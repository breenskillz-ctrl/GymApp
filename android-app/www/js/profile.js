// Local profile (DECISIONS #45): a name for the greeting, and an optional username + password that locks the app on this
// device. Everything stays on the phone. The password is stored as a salted PBKDF2 hash; it keeps casual eyes out but does
// not encrypt the workout data.
import { state, save, dayHasWork } from './store.js';
import { esc, icon, openModal, confirmDialog, promptDialog, toast } from './utils.js';

const SESSION = 'gymapp.session'; // '1' while signed in (localStorage when "stay signed in", else sessionStorage)
const ITER = 150000;

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hashPassword(pw, salt, iterations = ITER) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations }, key, 256);
  return hex(bits);
}

async function setPassword(pw) {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  state.profile.salt = salt;
  state.profile.iterations = ITER;
  state.profile.passHash = await hashPassword(pw, salt);
}

async function checkLogin(username, pw) {
  const p = state.profile;
  if (username.trim().toLowerCase() !== (p.username || '').toLowerCase()) return false;
  return (await hashPassword(pw, p.salt, p.iterations || ITER)) === p.passHash;
}

const store = (remember) => (remember ? localStorage : sessionStorage);
function signIn(remember) {
  try { store(remember).setItem(SESSION, '1'); } catch { /* storage blocked */ }
}
function signedIn() {
  try { return localStorage.getItem(SESSION) === '1' || sessionStorage.getItem(SESSION) === '1'; } catch { return true; }
}
function signOut() {
  try { localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION); } catch { /* storage blocked */ }
}

export const profileName = () => state.profile?.name || '';
export const hasPassword = () => !!state.profile?.passHash;
export const workoutCount = () => Object.keys(state.log).filter(dayHasWork).length;

export function updateDrawerUser() {
  const el = document.getElementById('drawer-user');
  if (el) el.textContent = profileName() || 'Workout log';
}

// Full-screen page shown before the app (first start and the lock screen). Resolves when it is closed.
function authScreen(html, mount) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'auth';
    wrap.innerHTML = `<div class="auth-panel"><img class="auth-logo" src="icons/icon.svg" alt="" width="44" height="44">${html}</div>`;
    document.body.appendChild(wrap);
    document.body.classList.add('auth-open');
    const done = () => {
      wrap.remove();
      document.body.classList.remove('auth-open');
      resolve();
    };
    mount(wrap, done);
  });
}

const field = (name, label, type = 'text', extra = '') => `<label>${label}<input class="input" name="${name}" type="${type}" ${extra}></label>`;

// ---------- First start: create a profile ----------
function createScreen() {
  return authScreen(`
    <h1 class="auth-title">Create your profile</h1>
    <p class="auth-sub">It stays on this phone. The password is optional and locks the app.</p>
    <form class="form">
      ${field('name', 'Your name', 'text', 'autocomplete="given-name" maxlength="30"')}
      ${field('username', 'Username', 'text', 'autocomplete="username" autocapitalize="none" maxlength="30"')}
      ${field('pw', 'Password', 'password', 'autocomplete="new-password"')}
      ${field('pw2', 'Repeat password', 'password', 'autocomplete="new-password"')}
      <p class="auth-error" hidden></p>
      <button type="submit" class="btn primary block">Get started</button>
      <button type="button" class="text-btn auth-skip" data-skip>Skip for now</button>
    </form>`, (wrap, done) => {
    const f = wrap.querySelector('form');
    const err = wrap.querySelector('.auth-error');
    setTimeout(() => f.name.focus(), 50);
    wrap.querySelector('[data-skip]').onclick = () => { state.profileSkipped = true; save(); done(); };
    f.onsubmit = async (e) => {
      e.preventDefault();
      const msg = profileError(f);
      if (msg) { err.textContent = msg; err.hidden = false; return; }
      state.profile = { name: f.name.value.trim(), username: f.username.value.trim(), created: Date.now() };
      if (f.pw.value) await setPassword(f.pw.value);
      save();
      signIn(true);
      done();
    };
  });
}

// Shared checks for the create screen and the profile editor; returns an error text or ''
function profileError(f) {
  if (!f.name.value.trim()) return 'Enter your name.';
  const pw = f.pw.value;
  if (pw && !f.username.value.trim()) return 'Choose a username to use with the password.';
  if (pw && pw.length < 4) return 'Use at least 4 characters for the password.';
  if (pw !== f.pw2.value) return 'The passwords do not match.';
  return '';
}

// ---------- Lock screen ----------
function lockScreen() {
  const p = state.profile;
  return authScreen(`
    <h1 class="auth-title">Welcome back${p.name ? `, ${esc(p.name)}` : ''}</h1>
    <p class="auth-sub">Sign in to open your log.</p>
    <form class="form">
      ${field('username', 'Username', 'text', 'autocomplete="username" autocapitalize="none"')}
      ${field('pw', 'Password', 'password', 'autocomplete="current-password"')}
      <label class="switch small"><input type="checkbox" name="remember" checked>Stay signed in on this phone</label>
      <p class="auth-error" hidden></p>
      <button type="submit" class="btn primary block">Sign in</button>
      <button type="button" class="text-btn auth-skip" data-forgot>Forgot password?</button>
    </form>`, (wrap, done) => {
    const f = wrap.querySelector('form');
    const err = wrap.querySelector('.auth-error');
    setTimeout(() => f.username.focus(), 50);
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (await checkLogin(f.username.value, f.pw.value)) {
        signIn(f.remember.checked);
        done();
      } else {
        err.textContent = 'Wrong username or password.';
        err.hidden = false;
        f.pw.value = '';
        f.pw.focus();
      }
    };
    wrap.querySelector('[data-forgot]').onclick = async () => {
      const u = await promptDialog('Forgot password', '', { placeholder: 'Your username', okLabel: 'Remove password' });
      if (u == null) return;
      if (u.toLowerCase() !== (p.username || '').toLowerCase()) { err.textContent = 'That is not the username of this profile.'; err.hidden = false; return; }
      delete state.profile.passHash;
      delete state.profile.salt;
      save();
      signIn(true);
      done();
      toast('Password removed – set a new one under Profile');
    };
  });
}

// Called once at startup, before the first screen is drawn
export async function initProfile() {
  if (!state.profile && !state.profileSkipped) await createScreen();
  else if (hasPassword() && !signedIn()) await lockScreen();
  updateDrawerUser();
}

// ---------- Profile editor (side drawer) ----------
export function openProfile(refresh) {
  const p = state.profile || {};
  const n = workoutCount();
  const since = p.created ? new Date(p.created).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '';
  openModal(`
    <div class="modal-head"><h2>Profile</h2><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>
    <div class="profile-sum"><span class="avatar">${esc((p.name || '?').slice(0, 1).toUpperCase())}</span>
      <div><strong>${esc(p.name || 'No profile yet')}</strong>
      <div class="muted">${n} workout${n === 1 ? '' : 's'}${since ? ` · since ${since}` : ''}</div></div></div>
    <form class="form">
      ${field('name', 'Your name', 'text', `maxlength="30" value="${esc(p.name || '')}"`)}
      ${field('username', 'Username', 'text', `autocapitalize="none" maxlength="30" value="${esc(p.username || '')}"`)}
      ${field('pw', hasPassword() ? 'New password (leave empty to keep)' : 'Password (optional)', 'password', 'autocomplete="new-password"')}
      ${field('pw2', 'Repeat password', 'password', 'autocomplete="new-password"')}
      <p class="auth-error" hidden></p>
      <button type="submit" class="btn primary block">Save</button>
      ${hasPassword() ? `<div class="profile-links">
        <button type="button" class="text-btn" data-act="signout">${icon('lock')}Lock app now</button>
        <button type="button" class="text-btn danger" data-act="nopw">Remove password</button></div>` : ''}
    </form>
    <p class="muted small-note">Your profile and workouts are stored only on this phone. The password locks the app, but it does
      not encrypt the data. Make backups under Settings.</p>`, {
    onMount(m, close) {
      const f = m.querySelector('form');
      const err = m.querySelector('.auth-error');
      f.onsubmit = async (e) => {
        e.preventDefault();
        const msg = profileError(f) || (hasPassword() && !f.username.value.trim() ? 'A username is needed while the password is on.' : '');
        if (msg) { err.textContent = msg; err.hidden = false; return; }
        state.profile = { ...p, name: f.name.value.trim(), username: f.username.value.trim(), created: p.created || Date.now() };
        if (f.pw.value) await setPassword(f.pw.value);
        delete state.profileSkipped;
        save();
        signIn(true);
        updateDrawerUser();
        close();
        toast('Profile saved');
        refresh?.();
      };
      m.querySelector('[data-act="nopw"]')?.addEventListener('click', async () => {
        if (!await confirmDialog('Remove the password? The app will open without signing in.', 'Remove')) return;
        delete state.profile.passHash;
        delete state.profile.salt;
        save();
        close();
        toast('Password removed');
      });
      m.querySelector('[data-act="signout"]')?.addEventListener('click', async () => {
        signOut();
        close();
        await lockScreen();
        refresh?.();
      });
    },
  });
}
