// Innebygd øvelsesbibliotek og treningsprogrammer.
// Øvelsestyper: 'wr' = vekt + reps, 'r' = kun reps, 't' = tid, 'dt' = distanse + tid

export const GROUPS = [
  'Bryst', 'Rygg', 'Skuldre', 'Biceps', 'Triceps', 'Underarmer',
  'Bein', 'Setemuskler', 'Legger', 'Mage/kjerne', 'Kondisjon', 'Hele kroppen',
];

export const EQUIPMENT = [
  'Stang', 'Manualer', 'Maskin', 'Kabel', 'Kroppsvekt', 'Strikk', 'Kettlebell', 'Annet',
];

export const TYPES = {
  wr: 'Vekt og repetisjoner',
  r: 'Kun repetisjoner',
  t: 'Tid',
  dt: 'Distanse og tid',
};

const E = (id, name, group, equip, type, desc) => ({ id, name, group, equip, type, desc, builtin: true });

export const EXERCISES = [
  // Bryst
  E('benkpress', 'Benkpress', 'Bryst', 'Stang', 'wr', 'Ligg på benken, senk stanga kontrollert til brystet og press opp til strake armer. Hold skulderbladene samlet.'),
  E('skra-benkpress', 'Skråbenkpress', 'Bryst', 'Stang', 'wr', 'Benkpress på skråbenk (30–45°) for mer fokus på øvre bryst.'),
  E('nedover-benkpress', 'Benkpress nedoverskrå', 'Bryst', 'Stang', 'wr', 'Benkpress med hodet lavere enn hoftene. Treffer nedre del av brystet.'),
  E('manual-benkpress', 'Benkpress med manualer', 'Bryst', 'Manualer', 'wr', 'Press manualene opp fra brystet. Gir større bevegelsesbane enn stang.'),
  E('skra-manual', 'Skråbenkpress med manualer', 'Bryst', 'Manualer', 'wr', 'Manualpress på skråbenk for øvre bryst og fremre skulder.'),
  E('flyes', 'Flyes med manualer', 'Bryst', 'Manualer', 'wr', 'Lett bøy i albuene, senk armene ut til siden i en bue og før dem sammen over brystet.'),
  E('kabel-crossover', 'Kabel crossover', 'Bryst', 'Kabel', 'wr', 'Trekk håndtakene ned og sammen foran kroppen i en bue.'),
  E('brystpress-maskin', 'Brystpress i maskin', 'Bryst', 'Maskin', 'wr', 'Sittende press i maskin. Trygt alternativ for å jobbe tungt.'),
  E('pec-deck', 'Pec deck', 'Bryst', 'Maskin', 'wr', 'Før armene sammen foran brystet i maskin.'),
  E('pushups', 'Armhevinger', 'Bryst', 'Kroppsvekt', 'r', 'Rett kropp fra hode til hæl, senk brystet mot gulvet og press opp.'),
  E('dips-bryst', 'Dips', 'Bryst', 'Kroppsvekt', 'r', 'Senk kroppen mellom parallellstengene med lett foroverlent overkropp og press opp.'),
  E('strikk-brystpress', 'Brystpress med strikk', 'Bryst', 'Strikk', 'r', 'Fest strikken bak deg og press fremover i brysthøyde.'),
  E('strikk-flyes', 'Flyes med strikk', 'Bryst', 'Strikk', 'r', 'Strikken festet bak deg, før armene sammen foran brystet.'),

  // Rygg
  E('markloft', 'Markløft', 'Rygg', 'Stang', 'wr', 'Stanga over midtfoten, nøytral rygg. Løft ved å presse gulvet vekk og strekke hofta.'),
  E('roing-stang', 'Roing med stang', 'Rygg', 'Stang', 'wr', 'Foroverbøyd med rett rygg, trekk stanga mot navlen.'),
  E('roing-manual', 'Roing med manual', 'Rygg', 'Manualer', 'wr', 'Én hånd og ett kne på benken, trekk manualen mot hofta.'),
  E('pullups', 'Pull-ups', 'Rygg', 'Kroppsvekt', 'r', 'Overhåndsgrep, trekk deg opp til haka er over stanga.'),
  E('chinups', 'Chin-ups', 'Rygg', 'Kroppsvekt', 'r', 'Underhåndsgrep, trekk deg opp. Mer biceps enn pull-ups.'),
  E('nedtrekk', 'Nedtrekk', 'Rygg', 'Kabel', 'wr', 'Trekk stanga ned til øvre bryst med brystet frem.'),
  E('sittende-roing', 'Sittende roing i kabel', 'Rygg', 'Kabel', 'wr', 'Trekk håndtaket mot magen og klem skulderbladene sammen.'),
  E('t-bar-roing', 'T-bar roing', 'Rygg', 'Maskin', 'wr', 'Roing med T-stang eller landmine for tykk rygg.'),
  E('hyperextension', 'Rygghev', 'Rygg', 'Kroppsvekt', 'r', 'I rygghevbenk, senk overkroppen og løft til rett linje.'),
  E('pullover', 'Pullover', 'Rygg', 'Manualer', 'wr', 'Ligg på tvers av benken og før manualen bak hodet og tilbake.'),
  E('strikk-roing', 'Roing med strikk', 'Rygg', 'Strikk', 'r', 'Strikken festet foran deg, trekk håndtakene mot magen.'),
  E('strikk-nedtrekk', 'Nedtrekk med strikk', 'Rygg', 'Strikk', 'r', 'Strikken festet høyt, trekk ned mot brystet.'),
  E('strikk-pull-apart', 'Band pull-apart', 'Rygg', 'Strikk', 'r', 'Hold strikken foran deg i skulderhøyde og trekk den fra hverandre.'),

  // Skuldre
  E('skulderpress', 'Stående skulderpress', 'Skuldre', 'Stang', 'wr', 'Press stanga fra skuldrene til over hodet med stram kjerne.'),
  E('manual-skulderpress', 'Skulderpress med manualer', 'Skuldre', 'Manualer', 'wr', 'Sittende eller stående press med manualer.'),
  E('arnold-press', 'Arnold press', 'Skuldre', 'Manualer', 'wr', 'Skulderpress med rotasjon av håndleddene gjennom bevegelsen.'),
  E('sidehev', 'Sidehev', 'Skuldre', 'Manualer', 'wr', 'Løft manualene ut til siden til skulderhøyde med lett bøy i albuen.'),
  E('fronthev', 'Fronthev', 'Skuldre', 'Manualer', 'wr', 'Løft manualene rett frem til skulderhøyde.'),
  E('omvendt-flyes', 'Omvendte flyes', 'Skuldre', 'Manualer', 'wr', 'Foroverbøyd, løft armene ut til siden for bakre skulder.'),
  E('face-pull', 'Face pull', 'Skuldre', 'Kabel', 'wr', 'Trekk tauet mot ansiktet med albuene høyt.'),
  E('upright-row', 'Stående roing', 'Skuldre', 'Stang', 'wr', 'Trekk stanga opp langs kroppen til brysthøyde.'),
  E('skuldertrekk', 'Skuldertrekk', 'Skuldre', 'Manualer', 'wr', 'Løft skuldrene rett opp mot ørene og senk kontrollert.'),
  E('skulderpress-maskin', 'Skulderpress i maskin', 'Skuldre', 'Maskin', 'wr', 'Sittende press i maskin.'),
  E('strikk-skulderpress', 'Skulderpress med strikk', 'Skuldre', 'Strikk', 'r', 'Stå på strikken og press håndtakene over hodet.'),
  E('strikk-sidehev', 'Sidehev med strikk', 'Skuldre', 'Strikk', 'r', 'Stå på strikken og løft armene ut til siden.'),

  // Biceps
  E('bicepscurl-stang', 'Bicepscurl med stang', 'Biceps', 'Stang', 'wr', 'Stående curl med albuene inntil kroppen.'),
  E('bicepscurl-manual', 'Bicepscurl med manualer', 'Biceps', 'Manualer', 'wr', 'Curl med supinering av håndleddet på toppen.'),
  E('hammercurl', 'Hammercurl', 'Biceps', 'Manualer', 'wr', 'Curl med nøytralt grep (tommel opp).'),
  E('preacher-curl', 'Preacher curl', 'Biceps', 'Stang', 'wr', 'Curl med overarmene hvilende på skråpute.'),
  E('konsentrasjonscurl', 'Konsentrasjonscurl', 'Biceps', 'Manualer', 'wr', 'Sittende, albuen mot innsiden av låret.'),
  E('kabelcurl', 'Bicepscurl i kabel', 'Biceps', 'Kabel', 'wr', 'Curl med konstant motstand fra kabel.'),
  E('strikk-curl', 'Bicepscurl med strikk', 'Biceps', 'Strikk', 'r', 'Stå på strikken og curl håndtakene opp.'),

  // Triceps
  E('triceps-pushdown', 'Triceps pushdown', 'Triceps', 'Kabel', 'wr', 'Press stanga eller tauet ned med albuene inntil kroppen.'),
  E('fransk-press', 'Fransk press', 'Triceps', 'Stang', 'wr', 'Liggende, senk stanga mot panna og strekk armene.'),
  E('triceps-over-hodet', 'Tricepsekstensjon over hodet', 'Triceps', 'Manualer', 'wr', 'Hold manualen over hodet, senk bak nakken og strekk.'),
  E('smal-benkpress', 'Benkpress med smalt grep', 'Triceps', 'Stang', 'wr', 'Benkpress med skulderbreddes grep for triceps.'),
  E('benkdips', 'Benkdips', 'Triceps', 'Kroppsvekt', 'r', 'Hendene på benken bak deg, senk og press opp.'),
  E('kickback', 'Triceps kickback', 'Triceps', 'Manualer', 'wr', 'Foroverbøyd, strekk armen bakover.'),
  E('diamant-pushups', 'Diamantarmhevinger', 'Triceps', 'Kroppsvekt', 'r', 'Armhevinger med hendene tett sammen under brystet.'),
  E('strikk-triceps', 'Tricepsekstensjon med strikk', 'Triceps', 'Strikk', 'r', 'Strikken festet høyt, press ned med albuene inntil kroppen.'),

  // Underarmer
  E('handleddscurl', 'Håndleddscurl', 'Underarmer', 'Manualer', 'wr', 'Underarmene på benken, curl kun med håndleddet.'),
  E('farmers-walk', 'Farmer\'s walk', 'Underarmer', 'Manualer', 'dt', 'Gå med tunge manualer eller kettlebells i hendene.'),
  E('dead-hang', 'Dead hang', 'Underarmer', 'Kroppsvekt', 't', 'Heng i stanga med strake armer så lenge du klarer.'),

  // Bein
  E('knebøy', 'Knebøy', 'Bein', 'Stang', 'wr', 'Stanga på øvre rygg, sitt ned til minst parallell og reis deg.'),
  E('frontbøy', 'Frontbøy', 'Bein', 'Stang', 'wr', 'Stanga foran på skuldrene, oppreist overkropp.'),
  E('beinpress', 'Beinpress', 'Bein', 'Maskin', 'wr', 'Press plattformen vekk uten å låse knærne helt.'),
  E('utfall', 'Utfall', 'Bein', 'Manualer', 'wr', 'Ta et langt steg frem og senk bakre kne mot gulvet.'),
  E('bulgarsk-splittbøy', 'Bulgarsk splittbøy', 'Bein', 'Manualer', 'wr', 'Bakre fot på benk, senk deg ned på fremre bein.'),
  E('goblet-squat', 'Goblet squat', 'Bein', 'Kettlebell', 'wr', 'Hold kettlebell foran brystet og gjør knebøy.'),
  E('beinspark', 'Beinspark', 'Bein', 'Maskin', 'wr', 'Strekk knærne i maskin for forside lår.'),
  E('lårcurl', 'Lårcurl', 'Bein', 'Maskin', 'wr', 'Bøy knærne i maskin for bakside lår.'),
  E('rumensk-markloft', 'Rumensk markløft', 'Bein', 'Stang', 'wr', 'Lett bøy i knærne, før hoftene bakover og senk stanga langs beina.'),
  E('hack-squat', 'Hack squat', 'Bein', 'Maskin', 'wr', 'Knebøy i hack-maskin.'),
  E('step-up', 'Step-up', 'Bein', 'Manualer', 'wr', 'Gå opp på en kasse eller benk med ett bein om gangen.'),
  E('kroppsvekt-knebøy', 'Knebøy uten vekt', 'Bein', 'Kroppsvekt', 'r', 'Knebøy med egen kroppsvekt.'),
  E('veggsitt', 'Veggsitt', 'Bein', 'Kroppsvekt', 't', 'Sitt med ryggen mot veggen og 90° i knærne.'),
  E('strikk-knebøy', 'Knebøy med strikk', 'Bein', 'Strikk', 'r', 'Stå på strikken med håndtakene ved skuldrene og gjør knebøy.'),

  // Setemuskler
  E('hip-thrust', 'Hip thrust', 'Setemuskler', 'Stang', 'wr', 'Øvre rygg mot benken, stang over hofta, løft hofta opp.'),
  E('glute-bridge', 'Seteløft', 'Setemuskler', 'Kroppsvekt', 'r', 'Ligg på ryggen og løft hofta mot taket.'),
  E('kettlebell-swing', 'Kettlebell swing', 'Setemuskler', 'Kettlebell', 'wr', 'Eksplosivt hoftekast som svinger kettlebellen til brysthøyde.'),
  E('kabel-kickback', 'Kickback i kabel', 'Setemuskler', 'Kabel', 'wr', 'Spark beinet bakover mot kabelmotstand.'),
  E('abduksjon', 'Abduksjon i maskin', 'Setemuskler', 'Maskin', 'wr', 'Press knærne ut mot motstand.'),
  E('strikk-sidegange', 'Sidegange med strikk', 'Setemuskler', 'Strikk', 'r', 'Strikk rundt knærne, gå sidelengs i halv knebøy.'),
  E('strikk-seteløft', 'Seteløft med strikk', 'Setemuskler', 'Strikk', 'r', 'Seteløft med strikk rundt knærne, press knærne ut.'),

  // Legger
  E('tåhev-stående', 'Stående tåhev', 'Legger', 'Maskin', 'wr', 'Løft deg opp på tærne og senk langsomt.'),
  E('tåhev-sittende', 'Sittende tåhev', 'Legger', 'Maskin', 'wr', 'Tåhev sittende for soleus.'),
  E('tåhev-kroppsvekt', 'Tåhev uten vekt', 'Legger', 'Kroppsvekt', 'r', 'Tåhev på trappetrinn med egen kroppsvekt.'),

  // Mage/kjerne
  E('planke', 'Planke', 'Mage/kjerne', 'Kroppsvekt', 't', 'Hold kroppen rett på underarmene og tærne.'),
  E('sideplanke', 'Sideplanke', 'Mage/kjerne', 'Kroppsvekt', 't', 'Planke på siden med hofta løftet.'),
  E('situps', 'Situps', 'Mage/kjerne', 'Kroppsvekt', 'r', 'Rull opp fra liggende til sittende.'),
  E('crunches', 'Crunches', 'Mage/kjerne', 'Kroppsvekt', 'r', 'Løft skuldrene fra gulvet ved å krølle overkroppen.'),
  E('beinløft-hengende', 'Hengende beinløft', 'Mage/kjerne', 'Kroppsvekt', 'r', 'Heng i stanga og løft beina opp foran deg.'),
  E('russian-twist', 'Russian twist', 'Mage/kjerne', 'Kroppsvekt', 'r', 'Sitt tilbakelent og roter overkroppen fra side til side.'),
  E('ab-wheel', 'Magehjul', 'Mage/kjerne', 'Annet', 'r', 'Rull hjulet frem fra knærne og trekk det tilbake.'),
  E('kabel-crunch', 'Kabel crunch', 'Mage/kjerne', 'Kabel', 'wr', 'Knestående, krøll overkroppen ned mot kabelmotstand.'),
  E('mountain-climbers', 'Mountain climbers', 'Mage/kjerne', 'Kroppsvekt', 'r', 'I armhevingsposisjon, dra knærne vekselvis mot brystet i høyt tempo.'),
  E('dead-bug', 'Dead bug', 'Mage/kjerne', 'Kroppsvekt', 'r', 'Ligg på ryggen, strekk motsatt arm og bein mens korsryggen holdes i gulvet.'),
  E('pallof-press', 'Pallof press', 'Mage/kjerne', 'Strikk', 'r', 'Strikk festet fra siden, press rett frem og motstå rotasjon.'),

  // Kondisjon
  E('løping', 'Løping', 'Kondisjon', 'Annet', 'dt', 'Løping ute eller på tredemølle.'),
  E('sykling', 'Sykling', 'Kondisjon', 'Maskin', 'dt', 'Spinningsykkel, ergometer eller ute.'),
  E('roing-maskin', 'Romaskin', 'Kondisjon', 'Maskin', 'dt', 'Roing på ergometer.'),
  E('ellipse', 'Ellipsemaskin', 'Kondisjon', 'Maskin', 'dt', 'Skånsom kondisjon på ellipsemaskin.'),
  E('gå', 'Gåtur', 'Kondisjon', 'Annet', 'dt', 'Rask gange ute eller på mølle.'),
  E('hoppetau', 'Hoppetau', 'Kondisjon', 'Annet', 't', 'Hopp tau i jevnt tempo.'),
  E('trappemaskin', 'Trappemaskin', 'Kondisjon', 'Maskin', 't', 'Gå i trappemaskin.'),

  // Hele kroppen
  E('burpees', 'Burpees', 'Hele kroppen', 'Kroppsvekt', 'r', 'Knebøy, spark beina bak, armheving, hopp frem og hopp opp.'),
  E('frivending', 'Frivending', 'Hele kroppen', 'Stang', 'wr', 'Eksplosivt løft av stanga fra gulvet til skuldrene.'),
  E('thrusters', 'Thrusters', 'Hele kroppen', 'Manualer', 'wr', 'Frontbøy som går rett over i skulderpress.'),
  E('turkish-getup', 'Turkish get-up', 'Hele kroppen', 'Kettlebell', 'wr', 'Reis deg fra liggende til stående med kettlebell over hodet.'),
  E('jumping-jacks', 'Stjernehopp', 'Hele kroppen', 'Kroppsvekt', 'r', 'Hopp ut med armer og bein samtidig og tilbake.'),
  E('box-jumps', 'Bokshopp', 'Hele kroppen', 'Annet', 'r', 'Hopp opp på en stabil kasse og gå ned.'),
];

const W = (name, exercises) => ({ name, exercises: exercises.map(([ex, sets, reps]) => ({ ex, sets, reps })) });

export const PROGRAMS = [
  {
    id: 'p-fullkropp',
    name: 'Fullkropp for nybegynnere',
    level: 'Nybegynner',
    days: 3,
    desc: 'Tre økter i uka som trener hele kroppen hver gang. Veksle mellom økt A og B. Et perfekt sted å starte.',
    workouts: [
      W('Økt A', [['knebøy', 3, 8], ['benkpress', 3, 8], ['roing-stang', 3, 8], ['planke', 3, 30]]),
      W('Økt B', [['markloft', 3, 5], ['skulderpress', 3, 8], ['nedtrekk', 3, 10], ['crunches', 3, 15]]),
    ],
  },
  {
    id: 'p-5x5',
    name: 'Styrke 5×5',
    level: 'Middels',
    days: 3,
    desc: 'Klassisk styrkeprogram med tunge basisløft. Øk vekten litt hver økt så lenge du klarer alle repetisjonene.',
    workouts: [
      W('Økt A', [['knebøy', 5, 5], ['benkpress', 5, 5], ['roing-stang', 5, 5]]),
      W('Økt B', [['knebøy', 5, 5], ['skulderpress', 5, 5], ['markloft', 1, 5]]),
    ],
  },
  {
    id: 'p-ppl',
    name: 'Push / Pull / Bein',
    level: 'Middels',
    days: 6,
    desc: 'Populær splitt der du trener pressøvelser, trekkøvelser og bein hver for seg. Kjør 3 eller 6 dager i uka.',
    workouts: [
      W('Push', [['benkpress', 4, 8], ['skra-manual', 3, 10], ['manual-skulderpress', 3, 10], ['sidehev', 3, 15], ['triceps-pushdown', 3, 12], ['triceps-over-hodet', 3, 12]]),
      W('Pull', [['markloft', 3, 5], ['pullups', 3, 8], ['sittende-roing', 3, 10], ['face-pull', 3, 15], ['bicepscurl-stang', 3, 10], ['hammercurl', 3, 12]]),
      W('Bein', [['knebøy', 4, 8], ['rumensk-markloft', 3, 10], ['beinpress', 3, 12], ['lårcurl', 3, 12], ['tåhev-stående', 4, 15]]),
    ],
  },
  {
    id: 'p-overunder',
    name: 'Overkropp / Underkropp',
    level: 'Middels',
    days: 4,
    desc: 'Fire økter i uka fordelt på overkropp og underkropp. God balanse mellom volum og restitusjon.',
    workouts: [
      W('Overkropp 1', [['benkpress', 4, 6], ['roing-stang', 4, 8], ['manual-skulderpress', 3, 10], ['nedtrekk', 3, 10], ['bicepscurl-manual', 3, 12], ['triceps-pushdown', 3, 12]]),
      W('Underkropp 1', [['knebøy', 4, 6], ['rumensk-markloft', 3, 8], ['utfall', 3, 10], ['lårcurl', 3, 12], ['tåhev-stående', 3, 15], ['planke', 3, 45]]),
      W('Overkropp 2', [['skra-benkpress', 4, 8], ['pullups', 4, 8], ['arnold-press', 3, 10], ['roing-manual', 3, 10], ['hammercurl', 3, 12], ['fransk-press', 3, 10]]),
      W('Underkropp 2', [['markloft', 3, 5], ['frontbøy', 3, 8], ['hip-thrust', 3, 10], ['beinspark', 3, 12], ['tåhev-sittende', 3, 15], ['beinløft-hengende', 3, 12]]),
    ],
  },
  {
    id: 'p-bro',
    name: 'Klassisk splitt (5 dager)',
    level: 'Avansert',
    days: 5,
    desc: 'Én muskelgruppe per dag for maksimalt volum. Passer for erfarne som ønsker muskelvekst.',
    workouts: [
      W('Bryst', [['benkpress', 4, 8], ['skra-manual', 4, 10], ['flyes', 3, 12], ['kabel-crossover', 3, 15], ['dips-bryst', 3, 10]]),
      W('Rygg', [['markloft', 4, 5], ['pullups', 4, 8], ['roing-stang', 4, 8], ['nedtrekk', 3, 12], ['pullover', 3, 12]]),
      W('Skuldre', [['skulderpress', 4, 8], ['sidehev', 4, 15], ['omvendt-flyes', 3, 15], ['face-pull', 3, 15], ['skuldertrekk', 4, 12]]),
      W('Bein', [['knebøy', 5, 6], ['beinpress', 4, 10], ['rumensk-markloft', 3, 10], ['beinspark', 3, 15], ['lårcurl', 3, 15], ['tåhev-stående', 4, 15]]),
      W('Armer', [['bicepscurl-stang', 4, 10], ['smal-benkpress', 4, 8], ['hammercurl', 3, 12], ['triceps-pushdown', 3, 12], ['preacher-curl', 3, 12], ['triceps-over-hodet', 3, 12]]),
    ],
  },
  {
    id: 'p-hjemme',
    name: 'Hjemmetrening uten utstyr',
    level: 'Nybegynner',
    days: 3,
    desc: 'Tren hele kroppen hjemme med bare kroppsvekt. Kjør gjerne øvelsene som en sirkel.',
    workouts: [
      W('Hele kroppen', [['kroppsvekt-knebøy', 3, 20], ['pushups', 3, 12], ['utfall', 3, 12], ['glute-bridge', 3, 15], ['planke', 3, 40], ['burpees', 3, 10]]),
      W('Kjerne og kondis', [['mountain-climbers', 3, 30], ['jumping-jacks', 3, 40], ['dead-bug', 3, 12], ['sideplanke', 3, 30], ['russian-twist', 3, 20]]),
    ],
  },
  {
    id: 'p-strikk',
    name: 'Strikktrening',
    level: 'Nybegynner',
    days: 3,
    desc: 'Fullkroppsprogram med treningsstrikk. Perfekt hjemme eller på reise.',
    workouts: [
      W('Overkropp', [['strikk-brystpress', 3, 15], ['strikk-roing', 3, 15], ['strikk-skulderpress', 3, 12], ['strikk-curl', 3, 15], ['strikk-triceps', 3, 15], ['strikk-pull-apart', 3, 20]]),
      W('Underkropp', [['strikk-knebøy', 3, 15], ['strikk-seteløft', 3, 20], ['strikk-sidegange', 3, 15], ['tåhev-kroppsvekt', 3, 20], ['pallof-press', 3, 12]]),
    ],
  },
  {
    id: 'p-mage',
    name: 'Sterk kjerne',
    level: 'Alle nivåer',
    days: 2,
    desc: 'Kort og effektiv kjerneøkt som kan legges til etter vanlig trening.',
    workouts: [
      W('Kjerneøkt', [['planke', 3, 60], ['sideplanke', 3, 30], ['beinløft-hengende', 3, 12], ['ab-wheel', 3, 10], ['pallof-press', 3, 12], ['dead-bug', 3, 12]]),
    ],
  },
  {
    id: 'p-sete',
    name: 'Sete og bein',
    level: 'Middels',
    days: 2,
    desc: 'Fokus på setemuskler og bakside lår.',
    workouts: [
      W('Sete og bein', [['hip-thrust', 4, 10], ['bulgarsk-splittbøy', 3, 10], ['rumensk-markloft', 3, 10], ['kabel-kickback', 3, 15], ['abduksjon', 3, 15], ['strikk-sidegange', 2, 20]]),
    ],
  },
  {
    id: 'p-kettlebell',
    name: 'Kettlebell-sirkel',
    level: 'Middels',
    days: 3,
    desc: 'Intens helkroppsøkt med én kettlebell. Kjør alle øvelsene etter hverandre, hvil og gjenta.',
    workouts: [
      W('Sirkel', [['kettlebell-swing', 4, 15], ['goblet-squat', 4, 12], ['turkish-getup', 3, 3], ['farmers-walk', 3, 1]]),
    ],
  },
];

// Gi økter stabile id-er
PROGRAMS.forEach((p) => {
  p.builtin = true;
  p.workouts.forEach((w, i) => { w.id = `${p.id}-w${i}`; });
});
