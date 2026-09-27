// Built-in exercise library and training programs.
// Exercise types: 'wr' = weight + reps, 'r' = reps only, 't' = time, 'dt' = distance + time

export const GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Legs', 'Glutes', 'Calves', 'Core', 'Cardio', 'Full body',
];

export const EQUIPMENT = [
  'Barbell', 'Dumbbells', 'Machine', 'Cable', 'Bodyweight', 'Band', 'Kettlebell', 'Other',
];

export const TYPES = {
  wr: 'Weight and reps',
  r: 'Reps only',
  t: 'Time',
  dt: 'Distance and time',
};

const E = (id, name, group, equip, type, desc) => ({ id, name, group, equip, type, desc, builtin: true });

export const EXERCISES = [
  // Chest
  E('bench-press', 'Bench Press', 'Chest', 'Barbell', 'wr', 'Lie on the bench, lower the bar under control to your chest and press up to straight arms. Keep your shoulder blades retracted.'),
  E('incline-bench-press', 'Incline Bench Press', 'Chest', 'Barbell', 'wr', 'Bench press on an incline bench (30–45°) to emphasise the upper chest.'),
  E('decline-bench-press', 'Decline Bench Press', 'Chest', 'Barbell', 'wr', 'Bench press with your head lower than your hips. Targets the lower chest.'),
  E('db-bench-press', 'Dumbbell Bench Press', 'Chest', 'Dumbbells', 'wr', 'Press the dumbbells up from your chest. Allows a greater range of motion than a barbell.'),
  E('db-incline-press', 'Incline Dumbbell Press', 'Chest', 'Dumbbells', 'wr', 'Dumbbell press on an incline bench for the upper chest and front delts.'),
  E('db-flyes', 'Dumbbell Flyes', 'Chest', 'Dumbbells', 'wr', 'With a slight bend in the elbows, lower your arms out to the sides in an arc and bring them together over your chest.'),
  E('cable-crossover', 'Cable Crossover', 'Chest', 'Cable', 'wr', 'Pull the handles down and together in front of your body in an arc.'),
  E('machine-chest-press', 'Machine Chest Press', 'Chest', 'Machine', 'wr', 'Seated press in a machine. A safe option for training heavy.'),
  E('pec-deck', 'Pec Deck', 'Chest', 'Machine', 'wr', 'Bring your arms together in front of your chest in the machine.'),
  E('push-ups', 'Push-ups', 'Chest', 'Bodyweight', 'r', 'Body straight from head to heels, lower your chest to the floor and push back up.'),
  E('dips', 'Dips', 'Chest', 'Bodyweight', 'r', 'Lower yourself between parallel bars with a slight forward lean and press back up.'),
  E('band-chest-press', 'Band Chest Press', 'Chest', 'Band', 'r', 'Anchor the band behind you and press forward at chest height.'),
  E('band-flyes', 'Band Flyes', 'Chest', 'Band', 'r', 'With the band anchored behind you, bring your arms together in front of your chest.'),

  // Back
  E('deadlift', 'Deadlift', 'Back', 'Barbell', 'wr', 'Bar over mid-foot, neutral spine. Lift by pushing the floor away and extending your hips.'),
  E('barbell-row', 'Barbell Row', 'Back', 'Barbell', 'wr', 'Bent over with a flat back, pull the bar towards your belly button.'),
  E('db-row', 'Dumbbell Row', 'Back', 'Dumbbells', 'wr', 'One hand and one knee on the bench, pull the dumbbell towards your hip.'),
  E('pull-ups', 'Pull-ups', 'Back', 'Bodyweight', 'r', 'Overhand grip, pull yourself up until your chin is over the bar.'),
  E('chin-ups', 'Chin-ups', 'Back', 'Bodyweight', 'r', 'Underhand grip, pull yourself up. More biceps than pull-ups.'),
  E('lat-pulldown', 'Lat Pulldown', 'Back', 'Cable', 'wr', 'Pull the bar down to your upper chest with your chest up.'),
  E('seated-cable-row', 'Seated Cable Row', 'Back', 'Cable', 'wr', 'Pull the handle towards your stomach and squeeze your shoulder blades together.'),
  E('t-bar-row', 'T-Bar Row', 'Back', 'Machine', 'wr', 'Row with a T-bar or landmine for a thick back.'),
  E('back-extension', 'Back Extension', 'Back', 'Bodyweight', 'r', 'On a back extension bench, lower your upper body and raise it to a straight line.'),
  E('pullover', 'Dumbbell Pullover', 'Back', 'Dumbbells', 'wr', 'Lie across the bench and move the dumbbell behind your head and back.'),
  E('band-row', 'Band Row', 'Back', 'Band', 'r', 'With the band anchored in front of you, pull the handles towards your stomach.'),
  E('band-pulldown', 'Band Pulldown', 'Back', 'Band', 'r', 'With the band anchored high, pull down towards your chest.'),
  E('band-pull-apart', 'Band Pull-Apart', 'Back', 'Band', 'r', 'Hold the band in front of you at shoulder height and pull it apart.'),

  // Shoulders
  E('overhead-press', 'Overhead Press', 'Shoulders', 'Barbell', 'wr', 'Press the bar from your shoulders to overhead with a tight core.'),
  E('db-shoulder-press', 'Dumbbell Shoulder Press', 'Shoulders', 'Dumbbells', 'wr', 'Seated or standing press with dumbbells.'),
  E('arnold-press', 'Arnold Press', 'Shoulders', 'Dumbbells', 'wr', 'Shoulder press with a rotation of the wrists through the movement.'),
  E('lateral-raise', 'Lateral Raise', 'Shoulders', 'Dumbbells', 'wr', 'Raise the dumbbells out to the sides to shoulder height with a slight bend in the elbow.'),
  E('front-raise', 'Front Raise', 'Shoulders', 'Dumbbells', 'wr', 'Raise the dumbbells straight in front of you to shoulder height.'),
  E('reverse-flyes', 'Reverse Flyes', 'Shoulders', 'Dumbbells', 'wr', 'Bent over, raise your arms out to the sides for the rear delts.'),
  E('face-pull', 'Face Pull', 'Shoulders', 'Cable', 'wr', 'Pull the rope towards your face with your elbows high.'),
  E('upright-row', 'Upright Row', 'Shoulders', 'Barbell', 'wr', 'Pull the bar up along your body to chest height.'),
  E('shrugs', 'Shrugs', 'Shoulders', 'Dumbbells', 'wr', 'Raise your shoulders straight up towards your ears and lower under control.'),
  E('machine-shoulder-press', 'Machine Shoulder Press', 'Shoulders', 'Machine', 'wr', 'Seated press in a machine.'),
  E('band-shoulder-press', 'Band Shoulder Press', 'Shoulders', 'Band', 'r', 'Stand on the band and press the handles overhead.'),
  E('band-lateral-raise', 'Band Lateral Raise', 'Shoulders', 'Band', 'r', 'Stand on the band and raise your arms out to the sides.'),

  // Biceps
  E('barbell-curl', 'Barbell Curl', 'Biceps', 'Barbell', 'wr', 'Standing curl with your elbows tucked in to your sides.'),
  E('db-curl', 'Dumbbell Curl', 'Biceps', 'Dumbbells', 'wr', 'Curl with supination of the wrist at the top.'),
  E('hammer-curl', 'Hammer Curl', 'Biceps', 'Dumbbells', 'wr', 'Curl with a neutral grip (thumbs up).'),
  E('preacher-curl', 'Preacher Curl', 'Biceps', 'Barbell', 'wr', 'Curl with your upper arms resting on an angled pad.'),
  E('concentration-curl', 'Concentration Curl', 'Biceps', 'Dumbbells', 'wr', 'Seated, elbow braced against the inside of your thigh.'),
  E('cable-curl', 'Cable Curl', 'Biceps', 'Cable', 'wr', 'Curl with constant tension from a cable.'),
  E('band-curl', 'Band Curl', 'Biceps', 'Band', 'r', 'Stand on the band and curl the handles up.'),

  // Triceps
  E('triceps-pushdown', 'Triceps Pushdown', 'Triceps', 'Cable', 'wr', 'Push the bar or rope down with your elbows tucked in to your sides.'),
  E('skull-crusher', 'Skull Crusher', 'Triceps', 'Barbell', 'wr', 'Lying down, lower the bar towards your forehead and extend your arms.'),
  E('overhead-triceps-extension', 'Overhead Triceps Extension', 'Triceps', 'Dumbbells', 'wr', 'Hold the dumbbell overhead, lower it behind your neck and extend.'),
  E('close-grip-bench', 'Close-Grip Bench Press', 'Triceps', 'Barbell', 'wr', 'Bench press with a shoulder-width grip for the triceps.'),
  E('bench-dips', 'Bench Dips', 'Triceps', 'Bodyweight', 'r', 'Hands on the bench behind you, lower and press back up.'),
  E('triceps-kickback', 'Triceps Kickback', 'Triceps', 'Dumbbells', 'wr', 'Bent over, extend your arm backwards.'),
  E('diamond-push-ups', 'Diamond Push-ups', 'Triceps', 'Bodyweight', 'r', 'Push-ups with your hands close together under your chest.'),
  E('band-triceps-extension', 'Band Triceps Extension', 'Triceps', 'Band', 'r', 'With the band anchored high, push down with your elbows tucked in.'),

  // Forearms
  E('wrist-curl', 'Wrist Curl', 'Forearms', 'Dumbbells', 'wr', 'Forearms on the bench, curl with the wrist only.'),
  E('farmers-walk', 'Farmer\'s Walk', 'Forearms', 'Dumbbells', 'dt', 'Walk while holding heavy dumbbells or kettlebells.'),
  E('dead-hang', 'Dead Hang', 'Forearms', 'Bodyweight', 't', 'Hang from the bar with straight arms for as long as you can.'),

  // Legs
  E('squat', 'Squat', 'Legs', 'Barbell', 'wr', 'Bar on your upper back, sit down to at least parallel and stand back up.'),
  E('front-squat', 'Front Squat', 'Legs', 'Barbell', 'wr', 'Bar racked on the front of your shoulders, upright torso.'),
  E('leg-press', 'Leg Press', 'Legs', 'Machine', 'wr', 'Push the platform away without fully locking your knees.'),
  E('lunges', 'Lunges', 'Legs', 'Dumbbells', 'wr', 'Take a long step forward and lower your back knee towards the floor.'),
  E('bulgarian-split-squat', 'Bulgarian Split Squat', 'Legs', 'Dumbbells', 'wr', 'Rear foot on a bench, lower yourself on the front leg.'),
  E('goblet-squat', 'Goblet Squat', 'Legs', 'Kettlebell', 'wr', 'Hold a kettlebell in front of your chest and squat.'),
  E('leg-extension', 'Leg Extension', 'Legs', 'Machine', 'wr', 'Extend your knees in a machine for the quads.'),
  E('leg-curl', 'Leg Curl', 'Legs', 'Machine', 'wr', 'Bend your knees in a machine for the hamstrings.'),
  E('romanian-deadlift', 'Romanian Deadlift', 'Legs', 'Barbell', 'wr', 'Slight bend in the knees, push your hips back and lower the bar along your legs.'),
  E('hack-squat', 'Hack Squat', 'Legs', 'Machine', 'wr', 'Squat in a hack squat machine.'),
  E('step-up', 'Step-up', 'Legs', 'Dumbbells', 'wr', 'Step up onto a box or bench one leg at a time.'),
  E('bodyweight-squat', 'Bodyweight Squat', 'Legs', 'Bodyweight', 'r', 'Squat using only your bodyweight.'),
  E('wall-sit', 'Wall Sit', 'Legs', 'Bodyweight', 't', 'Sit with your back against the wall and knees at 90°.'),
  E('band-squat', 'Band Squat', 'Legs', 'Band', 'r', 'Stand on the band with the handles at your shoulders and squat.'),

  // Glutes
  E('hip-thrust', 'Hip Thrust', 'Glutes', 'Barbell', 'wr', 'Upper back against the bench, bar over your hips, drive your hips up.'),
  E('glute-bridge', 'Glute Bridge', 'Glutes', 'Bodyweight', 'r', 'Lie on your back and lift your hips towards the ceiling.'),
  E('kettlebell-swing', 'Kettlebell Swing', 'Glutes', 'Kettlebell', 'wr', 'Explosive hip hinge that swings the kettlebell to chest height.'),
  E('cable-kickback', 'Cable Kickback', 'Glutes', 'Cable', 'wr', 'Kick your leg backwards against cable resistance.'),
  E('hip-abduction', 'Hip Abduction Machine', 'Glutes', 'Machine', 'wr', 'Push your knees out against resistance.'),
  E('band-lateral-walk', 'Band Lateral Walk', 'Glutes', 'Band', 'r', 'Band around your knees, walk sideways in a half squat.'),
  E('band-glute-bridge', 'Band Glute Bridge', 'Glutes', 'Band', 'r', 'Glute bridge with a band around your knees, pushing the knees out.'),

  // Calves
  E('standing-calf-raise', 'Standing Calf Raise', 'Calves', 'Machine', 'wr', 'Rise up onto your toes and lower slowly.'),
  E('seated-calf-raise', 'Seated Calf Raise', 'Calves', 'Machine', 'wr', 'Seated calf raise for the soleus.'),
  E('bodyweight-calf-raise', 'Bodyweight Calf Raise', 'Calves', 'Bodyweight', 'r', 'Calf raise on a step using your own bodyweight.'),

  // Core
  E('plank', 'Plank', 'Core', 'Bodyweight', 't', 'Hold your body straight on your forearms and toes.'),
  E('side-plank', 'Side Plank', 'Core', 'Bodyweight', 't', 'Plank on your side with your hips raised.'),
  E('sit-ups', 'Sit-ups', 'Core', 'Bodyweight', 'r', 'Roll up from lying to sitting.'),
  E('crunches', 'Crunches', 'Core', 'Bodyweight', 'r', 'Lift your shoulders off the floor by curling your upper body.'),
  E('hanging-leg-raise', 'Hanging Leg Raise', 'Core', 'Bodyweight', 'r', 'Hang from the bar and raise your legs in front of you.'),
  E('russian-twist', 'Russian Twist', 'Core', 'Bodyweight', 'r', 'Sit leaning back and rotate your upper body from side to side.'),
  E('ab-wheel', 'Ab Wheel Rollout', 'Core', 'Other', 'r', 'Roll the wheel forward from your knees and pull it back.'),
  E('cable-crunch', 'Cable Crunch', 'Core', 'Cable', 'wr', 'Kneeling, curl your upper body down against cable resistance.'),
  E('mountain-climbers', 'Mountain Climbers', 'Core', 'Bodyweight', 'r', 'In a push-up position, drive your knees alternately towards your chest at a fast pace.'),
  E('dead-bug', 'Dead Bug', 'Core', 'Bodyweight', 'r', 'Lie on your back, extend opposite arm and leg while keeping your lower back on the floor.'),
  E('pallof-press', 'Pallof Press', 'Core', 'Band', 'r', 'Band anchored to the side, press straight out and resist rotation.'),

  // Cardio
  E('running', 'Running', 'Cardio', 'Other', 'dt', 'Running outdoors or on a treadmill.'),
  E('cycling', 'Cycling', 'Cardio', 'Machine', 'dt', 'Spin bike, ergometer or outdoors.'),
  E('rowing-machine', 'Rowing Machine', 'Cardio', 'Machine', 'dt', 'Rowing on an ergometer.'),
  E('elliptical', 'Elliptical', 'Cardio', 'Machine', 'dt', 'Low-impact cardio on an elliptical trainer.'),
  E('walking', 'Walking', 'Cardio', 'Other', 'dt', 'Brisk walking outdoors or on a treadmill.'),
  E('jump-rope', 'Jump Rope', 'Cardio', 'Other', 't', 'Skip rope at a steady pace.'),
  E('stair-climber', 'Stair Climber', 'Cardio', 'Machine', 't', 'Climb on a stair machine.'),

  // Full body
  E('burpees', 'Burpees', 'Full body', 'Bodyweight', 'r', 'Squat, kick your legs back, push-up, jump forward and jump up.'),
  E('power-clean', 'Power Clean', 'Full body', 'Barbell', 'wr', 'Explosively lift the bar from the floor to your shoulders.'),
  E('thrusters', 'Thrusters', 'Full body', 'Dumbbells', 'wr', 'A front squat that flows straight into a shoulder press.'),
  E('turkish-get-up', 'Turkish Get-up', 'Full body', 'Kettlebell', 'wr', 'Get up from lying to standing with a kettlebell overhead.'),
  E('jumping-jacks', 'Jumping Jacks', 'Full body', 'Bodyweight', 'r', 'Jump out with arms and legs at the same time and back.'),
  E('box-jumps', 'Box Jumps', 'Full body', 'Other', 'r', 'Jump up onto a stable box and step down.'),
];

const W = (name, exercises) => ({ name, exercises: exercises.map(([ex, sets, reps]) => ({ ex, sets, reps })) });

export const PROGRAMS = [
  {
    id: 'p-full-body',
    name: 'Full Body for Beginners',
    level: 'Beginner',
    days: 3,
    desc: 'Three sessions a week training the whole body each time. Alternate between workout A and B. A perfect place to start.',
    workouts: [
      W('Workout A', [['squat', 3, 8], ['bench-press', 3, 8], ['barbell-row', 3, 8], ['plank', 3, 30]]),
      W('Workout B', [['deadlift', 3, 5], ['overhead-press', 3, 8], ['lat-pulldown', 3, 10], ['crunches', 3, 15]]),
    ],
  },
  {
    id: 'p-5x5',
    name: 'Strength 5×5',
    level: 'Intermediate',
    days: 3,
    desc: 'Classic strength program built on heavy compound lifts. Add a little weight every session as long as you complete all reps.',
    workouts: [
      W('Workout A', [['squat', 5, 5], ['bench-press', 5, 5], ['barbell-row', 5, 5]]),
      W('Workout B', [['squat', 5, 5], ['overhead-press', 5, 5], ['deadlift', 1, 5]]),
    ],
  },
  {
    id: 'p-ppl',
    name: 'Push / Pull / Legs',
    level: 'Intermediate',
    days: 6,
    desc: 'Popular split where you train pushing, pulling and legs separately. Run it 3 or 6 days a week.',
    workouts: [
      W('Push', [['bench-press', 4, 8], ['db-incline-press', 3, 10], ['db-shoulder-press', 3, 10], ['lateral-raise', 3, 15], ['triceps-pushdown', 3, 12], ['overhead-triceps-extension', 3, 12]]),
      W('Pull', [['deadlift', 3, 5], ['pull-ups', 3, 8], ['seated-cable-row', 3, 10], ['face-pull', 3, 15], ['barbell-curl', 3, 10], ['hammer-curl', 3, 12]]),
      W('Legs', [['squat', 4, 8], ['romanian-deadlift', 3, 10], ['leg-press', 3, 12], ['leg-curl', 3, 12], ['standing-calf-raise', 4, 15]]),
    ],
  },
  {
    id: 'p-upper-lower',
    name: 'Upper / Lower',
    level: 'Intermediate',
    days: 4,
    desc: 'Four sessions a week split into upper body and lower body. A good balance between volume and recovery.',
    workouts: [
      W('Upper 1', [['bench-press', 4, 6], ['barbell-row', 4, 8], ['db-shoulder-press', 3, 10], ['lat-pulldown', 3, 10], ['db-curl', 3, 12], ['triceps-pushdown', 3, 12]]),
      W('Lower 1', [['squat', 4, 6], ['romanian-deadlift', 3, 8], ['lunges', 3, 10], ['leg-curl', 3, 12], ['standing-calf-raise', 3, 15], ['plank', 3, 45]]),
      W('Upper 2', [['incline-bench-press', 4, 8], ['pull-ups', 4, 8], ['arnold-press', 3, 10], ['db-row', 3, 10], ['hammer-curl', 3, 12], ['skull-crusher', 3, 10]]),
      W('Lower 2', [['deadlift', 3, 5], ['front-squat', 3, 8], ['hip-thrust', 3, 10], ['leg-extension', 3, 12], ['seated-calf-raise', 3, 15], ['hanging-leg-raise', 3, 12]]),
    ],
  },
  {
    id: 'p-bro-split',
    name: 'Classic Split (5 days)',
    level: 'Advanced',
    days: 5,
    desc: 'One muscle group per day for maximum volume. Suited to experienced lifters aiming for muscle growth.',
    workouts: [
      W('Chest', [['bench-press', 4, 8], ['db-incline-press', 4, 10], ['db-flyes', 3, 12], ['cable-crossover', 3, 15], ['dips', 3, 10]]),
      W('Back', [['deadlift', 4, 5], ['pull-ups', 4, 8], ['barbell-row', 4, 8], ['lat-pulldown', 3, 12], ['pullover', 3, 12]]),
      W('Shoulders', [['overhead-press', 4, 8], ['lateral-raise', 4, 15], ['reverse-flyes', 3, 15], ['face-pull', 3, 15], ['shrugs', 4, 12]]),
      W('Legs', [['squat', 5, 6], ['leg-press', 4, 10], ['romanian-deadlift', 3, 10], ['leg-extension', 3, 15], ['leg-curl', 3, 15], ['standing-calf-raise', 4, 15]]),
      W('Arms', [['barbell-curl', 4, 10], ['close-grip-bench', 4, 8], ['hammer-curl', 3, 12], ['triceps-pushdown', 3, 12], ['preacher-curl', 3, 12], ['overhead-triceps-extension', 3, 12]]),
    ],
  },
  {
    id: 'p-home',
    name: 'Home Workout, No Equipment',
    level: 'Beginner',
    days: 3,
    desc: 'Train your whole body at home using only your bodyweight. Works well as a circuit.',
    workouts: [
      W('Full body', [['bodyweight-squat', 3, 20], ['push-ups', 3, 12], ['lunges', 3, 12], ['glute-bridge', 3, 15], ['plank', 3, 40], ['burpees', 3, 10]]),
      W('Core and cardio', [['mountain-climbers', 3, 30], ['jumping-jacks', 3, 40], ['dead-bug', 3, 12], ['side-plank', 3, 30], ['russian-twist', 3, 20]]),
    ],
  },
  {
    id: 'p-band',
    name: 'Resistance Band Training',
    level: 'Beginner',
    days: 3,
    desc: 'Full-body program with resistance bands. Perfect at home or when travelling.',
    workouts: [
      W('Upper body', [['band-chest-press', 3, 15], ['band-row', 3, 15], ['band-shoulder-press', 3, 12], ['band-curl', 3, 15], ['band-triceps-extension', 3, 15], ['band-pull-apart', 3, 20]]),
      W('Lower body', [['band-squat', 3, 15], ['band-glute-bridge', 3, 20], ['band-lateral-walk', 3, 15], ['bodyweight-calf-raise', 3, 20], ['pallof-press', 3, 12]]),
    ],
  },
  {
    id: 'p-core',
    name: 'Strong Core',
    level: 'All levels',
    days: 2,
    desc: 'Short and effective core session that can be added after your regular training.',
    workouts: [
      W('Core workout', [['plank', 3, 60], ['side-plank', 3, 30], ['hanging-leg-raise', 3, 12], ['ab-wheel', 3, 10], ['pallof-press', 3, 12], ['dead-bug', 3, 12]]),
    ],
  },
  {
    id: 'p-glutes',
    name: 'Glutes and Legs',
    level: 'Intermediate',
    days: 2,
    desc: 'Focus on glutes and hamstrings.',
    workouts: [
      W('Glutes and legs', [['hip-thrust', 4, 10], ['bulgarian-split-squat', 3, 10], ['romanian-deadlift', 3, 10], ['cable-kickback', 3, 15], ['hip-abduction', 3, 15], ['band-lateral-walk', 2, 20]]),
    ],
  },
  {
    id: 'p-kettlebell',
    name: 'Kettlebell Circuit',
    level: 'Intermediate',
    days: 3,
    desc: 'Intense full-body session with a single kettlebell. Do all exercises back to back, rest and repeat.',
    workouts: [
      W('Circuit', [['kettlebell-swing', 4, 15], ['goblet-squat', 4, 12], ['turkish-get-up', 3, 3], ['farmers-walk', 3, 1]]),
    ],
  },
];

// Give workouts stable ids
PROGRAMS.forEach((p) => {
  p.builtin = true;
  p.workouts.forEach((w, i) => { w.id = `${p.id}-w${i}`; });
});
