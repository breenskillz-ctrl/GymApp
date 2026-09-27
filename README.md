# GymApp – treningsdagbok

En enkel og rask treningslogg inspirert av [GymKeeper](https://gymkeeper.app/). Laget som en
installerbar web-app (PWA) som fungerer på mobil og PC, også uten nett. All data lagres lokalt på enheten.

## Funksjoner

- **Treningslogg per dag** – sveip til venstre/høyre eller bruk kalenderen for å bytte dag.
- **Smart autofyll** – nye øvelser fylles ut med vekt og repetisjoner fra forrige gang, og «Forrige»-kolonnen viser hva du gjorde sist.
- **100+ øvelser** med beskrivelse, fordelt på muskelgrupper og utstyr (inkludert treningsstrikk, kettlebell og kroppsvekt).
- **Egne øvelser** med ulike registreringstyper: vekt + reps, kun reps, tid, eller distanse + tid.
- **10 ferdige programmer** (fullkropp, 5×5, push/pull/bein, overkropp/underkropp, hjemmetrening, strikk m.m.)
  og mulighet til å lage egne eller kopiere og tilpasse de ferdige.
- **Personlige rekorder** – varsel når du setter ny PR, med estimert 1RM, tyngste løft og mest volum.
- **Fremgang og statistikk** – grafer per øvelse, økter per uke, sett per muskelgruppe, ukerekke og kroppsvekt.
- **Timere** – hviletimer som starter automatisk når et sett fullføres, nedtelling, Tabata-intervaller og stoppeklokke.
- **Sikkerhetskopi** – eksport og import av all data som JSON.
- Mørkt og lyst tema (følger systemet), kg eller lb.

## Kjør lokalt

Appen er ren HTML/CSS/JavaScript uten avhengigheter. Den må serveres over HTTP (ikke åpnes som fil):

```bash
python3 -m http.server 8000
# åpne http://localhost:8000
```

For å bruke den på mobilen kan mappen publiseres på f.eks. GitHub Pages, Netlify eller Vercel.
Åpne siden i nettleseren og velg «Legg til på startskjermen» for å installere den som en app.

## Struktur

```
index.html            Appskall, ikoner og navigasjon
css/styles.css        Stil (mørkt/lyst tema)
js/app.js             Oppstart og navigasjon
js/data.js            Øvelsesbibliotek og ferdige programmer
js/store.js           Lagring (localStorage), historikk og rekorder
js/timer.js           Global hviletimer
js/charts.js          Grafer tegnet på canvas
js/views/*.js         Skjermene: logg, programmer, øvelser, fremgang, timere
sw.js                 Service worker for offline-bruk
```
