import { z } from 'zod';
import { Exercise } from './schema';

type In = z.input<typeof Exercise>;

const raw: In[] = [
  {
    id: 'back-squat',
    name: { id: 'Back squat', en: 'Back squat' },
    equipment: ['barbell'],
    pattern: 'squat',
    primary: [
      'rectus-femoris',
      'vastus-lateralis',
      'vastus-medialis',
      'vastus-intermedius',
      'gluteus-maximus',
    ],
    synergist: ['adductors', 'hamstrings', 'soleus'],
    stabilizer: [
      'erector-spinae',
      'rectus-abdominis',
      'obliques-external',
      'transversus-abdominis',
      'gluteus-medius',
    ],
    summary: {
      id: 'Barbel di punggung atas, turunkan pinggul di antara kaki lalu berdiri kembali.',
      en: 'Bar on the upper back, sit the hips down between the feet and stand back up.',
    },
    cues: [
      {
        id: 'Tarik napas dan kencangkan perut (bracing) sebelum turun.',
        en: 'Breathe in and brace before descending.',
      },
      { id: 'Lutut mengikuti arah jari kaki.', en: 'Knees track over the toes.' },
      { id: 'Barbel tetap di atas tengah telapak kaki.', en: 'Keep the bar over mid-foot.' },
    ],
    errors: ['knee-valgus', 'butt-wink'],
    studio: 'squat',
    webcam: 'squat',
    needsVerification: false,
  },
  {
    id: 'front-squat',
    name: { id: 'Front squat', en: 'Front squat' },
    equipment: ['barbell'],
    pattern: 'squat',
    primary: ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius'],
    synergist: ['gluteus-maximus', 'adductors'],
    stabilizer: ['erector-spinae', 'rectus-abdominis', 'trapezius', 'transversus-abdominis'],
    summary: {
      id: 'Barbel di bahu depan; torso lebih tegak sehingga paha depan lebih dominan.',
      en: 'Bar on the front of the shoulders; a more upright torso makes the quads more dominant.',
    },
    cues: [
      {
        id: 'Siku tinggi agar barbel tidak menggelinding.',
        en: 'Elbows high so the bar does not roll.',
      },
      { id: 'Dada tegak, turun lurus ke bawah.', en: 'Chest up, sit straight down.' },
    ],
    errors: ['knee-valgus'],
    studio: 'squat',
    webcam: 'squat',
    needsVerification: false,
  },
  {
    id: 'goblet-squat',
    name: { id: 'Goblet squat', en: 'Goblet squat' },
    equipment: ['dumbbell', 'kettlebell'],
    pattern: 'squat',
    primary: ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'gluteus-maximus'],
    synergist: ['adductors'],
    stabilizer: ['rectus-abdominis', 'erector-spinae', 'biceps-brachii'],
    summary: {
      id: 'Pegang dumbel/kettlebell di depan dada; varian squat yang ramah pemula.',
      en: 'Hold a dumbbell/kettlebell at the chest; a beginner-friendly squat variation.',
    },
    cues: [
      {
        id: 'Siku turun di antara lutut di posisi bawah.',
        en: 'Elbows drop between the knees at the bottom.',
      },
      { id: 'Beban menempel di dada.', en: 'Keep the weight against the chest.' },
    ],
    errors: ['knee-valgus', 'butt-wink'],
    studio: 'squat',
    webcam: 'squat',
    needsVerification: false,
  },
  {
    id: 'deadlift',
    name: { id: 'Deadlift konvensional', en: 'Conventional deadlift' },
    equipment: ['barbell'],
    pattern: 'hinge',
    primary: ['gluteus-maximus', 'hamstrings', 'erector-spinae'],
    synergist: ['adductors', 'rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'trapezius'],
    stabilizer: [
      'latissimus-dorsi',
      'forearm-flexors',
      'rectus-abdominis',
      'multifidus',
      'rhomboids',
    ],
    summary: {
      id: 'Angkat barbel dari lantai dengan mendorong lantai lalu mengunci pinggul.',
      en: 'Lift the bar from the floor by pushing the floor away and locking out the hips.',
    },
    cues: [
      {
        id: 'Barbel dekat tulang kering sepanjang gerakan.',
        en: 'Keep the bar close to the shins throughout.',
      },
      {
        id: 'Punggung netral; “patahkan” barbel dengan lat.',
        en: 'Neutral back; “bend the bar” with your lats.',
      },
      {
        id: 'Dorong lantai, jangan tarik dengan punggung.',
        en: 'Push the floor away rather than pulling with your back.',
      },
    ],
    errors: ['rounded-back'],
    studio: 'hinge',
    needsVerification: false,
  },
  {
    id: 'romanian-deadlift',
    name: { id: 'Romanian deadlift', en: 'Romanian deadlift' },
    equipment: ['barbell', 'dumbbell'],
    pattern: 'hinge',
    primary: ['hamstrings', 'gluteus-maximus'],
    synergist: ['erector-spinae', 'adductors'],
    stabilizer: ['latissimus-dorsi', 'forearm-flexors', 'rectus-abdominis'],
    summary: {
      id: 'Hinge dari posisi berdiri dengan lutut sedikit tertekuk; regangan pada hamstring.',
      en: 'Hinge from standing with soft knees; loads the hamstrings in a stretch.',
    },
    cues: [
      {
        id: 'Dorong pinggul ke belakang, lutut hampir diam.',
        en: 'Push the hips back, knees nearly still.',
      },
      {
        id: 'Berhenti saat punggung mulai ingin membulat.',
        en: 'Stop when the back starts to round.',
      },
    ],
    errors: ['rounded-back'],
    studio: 'hinge',
    needsVerification: false,
  },
  {
    id: 'sumo-deadlift',
    name: { id: 'Sumo deadlift', en: 'Sumo deadlift' },
    equipment: ['barbell'],
    pattern: 'hinge',
    primary: ['gluteus-maximus', 'adductors', 'rectus-femoris', 'vastus-lateralis'],
    synergist: ['hamstrings', 'erector-spinae'],
    stabilizer: ['trapezius', 'forearm-flexors', 'gluteus-medius', 'latissimus-dorsi'],
    summary: {
      id: 'Kaki lebar, tangan di dalam kaki; torso lebih tegak dibanding konvensional.',
      en: 'Wide stance, hands inside the legs; a more upright torso than conventional.',
    },
    cues: [
      { id: 'Dorong lutut keluar searah jari kaki.', en: 'Push the knees out over the toes.' },
      { id: 'Pinggul dekat ke barbel.', en: 'Keep the hips close to the bar.' },
    ],
    errors: ['rounded-back', 'knee-valgus'],
    studio: 'hinge',
    needsVerification: true,
  },
  {
    id: 'good-morning',
    name: { id: 'Good morning', en: 'Good morning' },
    equipment: ['barbell'],
    pattern: 'hinge',
    primary: ['hamstrings', 'erector-spinae'],
    synergist: ['gluteus-maximus', 'adductors'],
    stabilizer: ['rectus-abdominis', 'multifidus'],
    summary: {
      id: 'Barbel di punggung, bungkuk dari pinggul dengan punggung netral.',
      en: 'Bar on the back, bow forward from the hips with a neutral spine.',
    },
    cues: [
      {
        id: 'Mulai ringan — lengan momen ke punggung bawah panjang.',
        en: 'Start light — the moment arm to the lower back is long.',
      },
      { id: 'Pinggul ke belakang, bukan dada ke bawah.', en: 'Hips back, not chest down.' },
    ],
    errors: ['rounded-back'],
    studio: 'hinge',
    needsVerification: false,
  },
  {
    id: 'bench-press',
    name: { id: 'Bench press', en: 'Bench press' },
    equipment: ['barbell', 'bench'],
    pattern: 'push',
    primary: ['pectoralis-major', 'triceps-brachii'],
    synergist: ['deltoid-anterior', 'serratus-anterior'],
    stabilizer: ['rotator-cuff', 'latissimus-dorsi', 'rhomboids', 'biceps-brachii'],
    summary: {
      id: 'Berbaring di bangku, turunkan barbel ke dada bawah lalu dorong ke atas.',
      en: 'Lying on a bench, lower the bar to the lower chest and press it up.',
    },
    cues: [
      { id: 'Skapula ditarik ke belakang-bawah.', en: 'Shoulder blades pulled back and down.' },
      {
        id: 'Siku sekitar 45–70° dari badan, bukan 90°.',
        en: 'Elbows about 45–70° from the torso, not 90°.',
      },
      { id: 'Kaki menapak, dorong lantai.', en: 'Feet planted, drive through the floor.' },
    ],
    errors: ['elbow-flare'],
    needsVerification: false,
  },
  {
    id: 'incline-bench-press',
    name: { id: 'Incline bench press', en: 'Incline bench press' },
    equipment: ['barbell', 'dumbbell', 'bench'],
    pattern: 'push',
    primary: ['pectoralis-major', 'deltoid-anterior'],
    synergist: ['triceps-brachii', 'serratus-anterior'],
    stabilizer: ['rotator-cuff', 'rhomboids'],
    summary: {
      id: 'Bench press pada bangku miring 30–45°; menekankan bagian klavikular dada.',
      en: 'Bench press on a 30–45° incline; emphasizes the clavicular part of the chest.',
    },
    cues: [
      { id: 'Turunkan beban ke dada atas.', en: 'Lower the weight to the upper chest.' },
      {
        id: 'Jaga skapula tetap rapat ke bangku.',
        en: 'Keep the shoulder blades pinned to the bench.',
      },
    ],
    errors: ['elbow-flare'],
    needsVerification: true,
  },
  {
    id: 'push-up',
    name: { id: 'Push-up', en: 'Push-up' },
    equipment: ['bodyweight'],
    pattern: 'push',
    primary: ['pectoralis-major', 'triceps-brachii'],
    synergist: ['deltoid-anterior', 'serratus-anterior'],
    stabilizer: [
      'rectus-abdominis',
      'obliques-external',
      'gluteus-maximus',
      'transversus-abdominis',
    ],
    summary: {
      id: 'Tubuh lurus seperti papan, turunkan dada ke lantai lalu dorong.',
      en: 'Body straight like a plank, lower the chest to the floor and push back up.',
    },
    cues: [
      { id: 'Kencangkan bokong dan perut.', en: 'Squeeze the glutes and abs.' },
      { id: 'Siku mengarah serong ke belakang.', en: 'Elbows angle back diagonally.' },
    ],
    errors: ['elbow-flare'],
    needsVerification: false,
  },
  {
    id: 'dips',
    name: { id: 'Dips', en: 'Dips' },
    equipment: ['bar', 'bodyweight'],
    pattern: 'push',
    primary: ['triceps-brachii', 'pectoralis-major'],
    synergist: ['deltoid-anterior'],
    stabilizer: ['rotator-cuff', 'pectoralis-minor', 'rectus-abdominis'],
    summary: {
      id: 'Tubuh ditopang di palang paralel, turun dengan menekuk siku lalu dorong naik.',
      en: 'Supported on parallel bars, lower by bending the elbows and press back up.',
    },
    cues: [
      {
        id: 'Turun hanya sejauh bahu nyaman.',
        en: 'Only descend as far as the shoulders are comfortable.',
      },
      { id: 'Bahu menjauh dari telinga.', en: 'Shoulders away from the ears.' },
    ],
    errors: [],
    needsVerification: true,
  },
  {
    id: 'overhead-press',
    name: { id: 'Overhead press', en: 'Overhead press' },
    equipment: ['barbell', 'dumbbell'],
    pattern: 'push',
    primary: ['deltoid-anterior', 'deltoid-lateral', 'triceps-brachii'],
    synergist: ['trapezius', 'serratus-anterior', 'pectoralis-major'],
    stabilizer: ['rectus-abdominis', 'erector-spinae', 'gluteus-maximus', 'rotator-cuff'],
    summary: {
      id: 'Tekan barbel dari bahu ke atas kepala sambil berdiri.',
      en: 'Press the bar from the shoulders to overhead while standing.',
    },
    cues: [
      {
        id: 'Bokong dan perut kencang, jangan melengkungkan punggung.',
        en: 'Glutes and abs tight, do not arch the back.',
      },
      {
        id: 'Kepala “masuk ke jendela” setelah barbel lewat.',
        en: 'Head “through the window” once the bar passes.',
      },
    ],
    errors: [],
    studio: 'ohp',
    webcam: 'ohp',
    needsVerification: false,
  },
  {
    id: 'lateral-raise',
    name: { id: 'Lateral raise', en: 'Lateral raise' },
    equipment: ['dumbbell', 'cable'],
    pattern: 'isolation',
    primary: ['deltoid-lateral'],
    synergist: ['deltoid-anterior', 'trapezius'],
    stabilizer: ['rotator-cuff', 'serratus-anterior'],
    summary: {
      id: 'Angkat dumbel ke samping hingga setinggi bahu.',
      en: 'Raise the dumbbells out to the side to shoulder height.',
    },
    cues: [
      {
        id: 'Siku sedikit ditekuk dan memimpin gerakan.',
        en: 'Slightly bent elbows lead the movement.',
      },
      { id: 'Jangan mengayun dengan badan.', en: 'Do not swing with the body.' },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'barbell-row',
    name: { id: 'Barbell row', en: 'Barbell row' },
    equipment: ['barbell'],
    pattern: 'pull',
    primary: ['latissimus-dorsi', 'rhomboids', 'trapezius'],
    synergist: ['deltoid-posterior', 'biceps-brachii', 'brachialis'],
    stabilizer: ['erector-spinae', 'hamstrings', 'gluteus-maximus', 'forearm-flexors'],
    summary: {
      id: 'Torso condong ke depan, tarik barbel ke perut bawah.',
      en: 'Torso hinged forward, pull the bar to the lower stomach.',
    },
    cues: [
      {
        id: 'Pertahankan sudut torso, jangan berdiri saat menarik.',
        en: 'Hold the torso angle; do not stand up as you pull.',
      },
      { id: 'Tarik siku ke arah pinggul.', en: 'Drive the elbows toward the hips.' },
    ],
    errors: ['rounded-back'],
    needsVerification: false,
  },
  {
    id: 'dumbbell-row',
    name: { id: 'Dumbbell row satu tangan', en: 'One-arm dumbbell row' },
    equipment: ['dumbbell', 'bench'],
    pattern: 'pull',
    primary: ['latissimus-dorsi', 'rhomboids'],
    synergist: ['deltoid-posterior', 'biceps-brachii', 'trapezius'],
    stabilizer: ['obliques-external', 'erector-spinae', 'forearm-flexors'],
    summary: {
      id: 'Satu tangan dan lutut di bangku, tarik dumbel ke pinggul.',
      en: 'One hand and knee on a bench, row the dumbbell to the hip.',
    },
    cues: [
      { id: 'Badan tidak berputar saat menarik.', en: 'Do not rotate the torso as you pull.' },
      {
        id: 'Turunkan dumbel dengan terkontrol hingga lengan lurus.',
        en: 'Lower under control to a straight arm.',
      },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'pull-up',
    name: { id: 'Pull-up', en: 'Pull-up' },
    equipment: ['bar', 'bodyweight'],
    pattern: 'pull',
    primary: ['latissimus-dorsi'],
    synergist: ['biceps-brachii', 'brachialis', 'rhomboids', 'trapezius', 'deltoid-posterior'],
    stabilizer: ['rectus-abdominis', 'forearm-flexors', 'rotator-cuff'],
    summary: {
      id: 'Genggaman pronasi, tarik badan hingga dagu melewati palang.',
      en: 'Overhand grip, pull the body up until the chin clears the bar.',
    },
    cues: [
      {
        id: 'Mulai dengan menarik skapula ke bawah.',
        en: 'Start by pulling the shoulder blades down.',
      },
      { id: 'Turun penuh tanpa kehilangan tegangan.', en: 'Lower fully without losing tension.' },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'chin-up',
    name: { id: 'Chin-up', en: 'Chin-up' },
    equipment: ['bar', 'bodyweight'],
    pattern: 'pull',
    primary: ['latissimus-dorsi', 'biceps-brachii'],
    synergist: ['brachialis', 'rhomboids', 'pectoralis-major'],
    stabilizer: ['rectus-abdominis', 'forearm-flexors'],
    summary: {
      id: 'Genggaman supinasi; bisep lebih banyak terlibat dibanding pull-up.',
      en: 'Underhand grip; the biceps contribute more than in a pull-up.',
    },
    cues: [
      { id: 'Dada menuju palang.', en: 'Bring the chest toward the bar.' },
      { id: 'Hindari mengayun kaki.', en: 'Avoid kicking the legs.' },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'lat-pulldown',
    name: { id: 'Lat pulldown', en: 'Lat pulldown' },
    equipment: ['cable', 'machine'],
    pattern: 'pull',
    primary: ['latissimus-dorsi'],
    synergist: ['biceps-brachii', 'rhomboids', 'trapezius', 'deltoid-posterior'],
    stabilizer: ['rectus-abdominis', 'forearm-flexors'],
    summary: {
      id: 'Tarik palang kabel ke dada atas sambil duduk.',
      en: 'Pull a cable bar down to the upper chest while seated.',
    },
    cues: [
      {
        id: 'Sedikit condong ke belakang, dada terangkat.',
        en: 'Lean back slightly with the chest up.',
      },
      { id: 'Jangan menarik ke belakang leher.', en: 'Do not pull behind the neck.' },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'seated-cable-row',
    name: { id: 'Seated cable row', en: 'Seated cable row' },
    equipment: ['cable'],
    pattern: 'pull',
    primary: ['rhomboids', 'latissimus-dorsi', 'trapezius'],
    synergist: ['deltoid-posterior', 'biceps-brachii'],
    stabilizer: ['erector-spinae', 'rectus-abdominis'],
    summary: {
      id: 'Duduk, tarik pegangan kabel ke perut dengan torso tegak.',
      en: 'Seated, row the cable handle to the stomach with an upright torso.',
    },
    cues: [
      {
        id: 'Rapatkan skapula di akhir tarikan.',
        en: 'Squeeze the shoulder blades together at the end.',
      },
      { id: 'Torso tidak mengayun maju-mundur.', en: 'Do not rock the torso back and forth.' },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'face-pull',
    name: { id: 'Face pull', en: 'Face pull' },
    equipment: ['cable'],
    pattern: 'pull',
    primary: ['deltoid-posterior', 'rotator-cuff'],
    synergist: ['trapezius', 'rhomboids'],
    stabilizer: ['rectus-abdominis'],
    summary: {
      id: 'Tarik tali kabel ke arah wajah sambil memutar lengan ke luar.',
      en: 'Pull a rope toward the face while rotating the arms outward.',
    },
    cues: [
      {
        id: 'Siku tinggi, tangan berakhir di samping telinga.',
        en: 'Elbows high, hands finish beside the ears.',
      },
      { id: 'Beban ringan, fokus kontrol.', en: 'Light load, focus on control.' },
    ],
    errors: [],
    needsVerification: true,
  },
  {
    id: 'lunge',
    name: { id: 'Lunge', en: 'Lunge' },
    equipment: ['bodyweight', 'dumbbell'],
    pattern: 'lunge',
    primary: ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'gluteus-maximus'],
    synergist: ['adductors', 'hamstrings', 'soleus'],
    stabilizer: ['gluteus-medius', 'obliques-external', 'tibialis-anterior'],
    summary: {
      id: 'Langkah ke depan, turunkan lutut belakang mendekati lantai.',
      en: 'Step forward and lower the back knee toward the floor.',
    },
    cues: [
      { id: 'Lutut depan sejajar jari kaki kedua.', en: 'Front knee in line with the second toe.' },
      { id: 'Torso tegak, berat di kaki depan.', en: 'Upright torso, weight on the front foot.' },
    ],
    errors: ['knee-valgus'],
    studio: 'lunge',
    needsVerification: false,
  },
  {
    id: 'bulgarian-split-squat',
    name: { id: 'Bulgarian split squat', en: 'Bulgarian split squat' },
    equipment: ['dumbbell', 'bench'],
    pattern: 'lunge',
    primary: ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'gluteus-maximus'],
    synergist: ['adductors', 'hamstrings'],
    stabilizer: ['gluteus-medius', 'obliques-external', 'iliopsoas'],
    summary: {
      id: 'Kaki belakang di bangku; squat satu kaki dengan tuntutan keseimbangan tinggi.',
      en: 'Rear foot on a bench; a single-leg squat with a high balance demand.',
    },
    cues: [
      {
        id: 'Jarak kaki cukup jauh agar tumit depan tetap menapak.',
        en: 'Stance long enough for the front heel to stay down.',
      },
      { id: 'Turun lurus ke bawah.', en: 'Drop straight down.' },
    ],
    errors: ['knee-valgus'],
    studio: 'lunge',
    needsVerification: false,
  },
  {
    id: 'hip-thrust',
    name: { id: 'Hip thrust', en: 'Hip thrust' },
    equipment: ['barbell', 'bench'],
    pattern: 'hinge',
    primary: ['gluteus-maximus'],
    synergist: ['hamstrings', 'adductors'],
    stabilizer: ['rectus-abdominis', 'gluteus-medius', 'rectus-femoris'],
    summary: {
      id: 'Punggung atas di bangku, dorong pinggul ke atas dengan barbel di panggul.',
      en: 'Upper back on a bench, drive the hips up with a bar across the pelvis.',
    },
    cues: [
      { id: 'Dagu sedikit menunduk, rusuk turun.', en: 'Chin slightly tucked, ribs down.' },
      { id: 'Tulang kering vertikal di posisi atas.', en: 'Shins vertical at the top.' },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'glute-bridge',
    name: { id: 'Glute bridge', en: 'Glute bridge' },
    equipment: ['bodyweight'],
    pattern: 'hinge',
    primary: ['gluteus-maximus'],
    synergist: ['hamstrings'],
    stabilizer: ['rectus-abdominis', 'transversus-abdominis'],
    summary: {
      id: 'Berbaring telentang, angkat pinggul dengan meremas bokong.',
      en: 'Lying on your back, lift the hips by squeezing the glutes.',
    },
    cues: [
      { id: 'Dorong lewat tumit.', en: 'Drive through the heels.' },
      {
        id: 'Jangan melengkungkan punggung bawah di atas.',
        en: 'Do not arch the lower back at the top.',
      },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'leg-press',
    name: { id: 'Leg press', en: 'Leg press' },
    equipment: ['machine'],
    pattern: 'squat',
    primary: ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius'],
    synergist: ['gluteus-maximus', 'adductors'],
    stabilizer: ['soleus'],
    summary: {
      id: 'Dorong platform mesin dengan kaki sambil punggung bersandar.',
      en: 'Push the machine platform with the legs while the back is supported.',
    },
    cues: [
      {
        id: 'Panggul tetap menempel sandaran di posisi bawah.',
        en: 'Keep the pelvis on the pad at the bottom.',
      },
      { id: 'Jangan mengunci lutut keras di atas.', en: 'Do not slam the knees into lockout.' },
    ],
    errors: ['butt-wink', 'knee-valgus'],
    needsVerification: false,
  },
  {
    id: 'leg-extension',
    name: { id: 'Leg extension', en: 'Leg extension' },
    equipment: ['machine'],
    pattern: 'isolation',
    primary: ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius'],
    synergist: [],
    stabilizer: [],
    summary: {
      id: 'Duduk di mesin, luruskan lutut melawan bantalan.',
      en: 'Seated in the machine, straighten the knees against the pad.',
    },
    cues: [
      { id: 'Tahan sejenak di posisi lurus.', en: 'Pause briefly at full extension.' },
      { id: 'Turunkan perlahan.', en: 'Lower slowly.' },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'leg-curl',
    name: { id: 'Leg curl', en: 'Leg curl' },
    equipment: ['machine'],
    pattern: 'isolation',
    primary: ['hamstrings'],
    synergist: ['gastrocnemius'],
    stabilizer: [],
    summary: {
      id: 'Tekuk lutut melawan bantalan mesin (berbaring atau duduk).',
      en: 'Bend the knees against the machine pad (lying or seated).',
    },
    cues: [
      { id: 'Pinggul tetap menempel bantalan.', en: 'Keep the hips on the pad.' },
      { id: 'Kontrol fase turun.', en: 'Control the lowering phase.' },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'calf-raise',
    name: { id: 'Calf raise', en: 'Calf raise' },
    equipment: ['machine', 'bodyweight'],
    pattern: 'isolation',
    primary: ['gastrocnemius', 'soleus'],
    synergist: [],
    stabilizer: ['tibialis-anterior'],
    summary: {
      id: 'Jinjitkan kaki setinggi mungkin lalu turunkan tumit di bawah pijakan.',
      en: 'Rise onto the toes as high as possible, then lower the heels below the step.',
    },
    cues: [
      { id: 'Jeda di bawah agar tidak memantul.', en: 'Pause at the bottom to avoid bouncing.' },
      {
        id: 'Lutut lurus menekankan gastroknemius.',
        en: 'Straight knees emphasize the gastrocnemius.',
      },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'biceps-curl',
    name: { id: 'Biceps curl', en: 'Biceps curl' },
    equipment: ['dumbbell', 'barbell', 'cable'],
    pattern: 'isolation',
    primary: ['biceps-brachii', 'brachialis'],
    synergist: ['brachioradialis'],
    stabilizer: ['forearm-flexors', 'forearm-extensors', 'deltoid-anterior'],
    summary: {
      id: 'Tekuk siku untuk mengangkat beban ke bahu.',
      en: 'Bend the elbows to bring the weight to the shoulders.',
    },
    cues: [
      { id: 'Siku diam di samping badan.', en: 'Elbows stay at your sides.' },
      { id: 'Luruskan lengan penuh di bawah.', en: 'Fully straighten the arms at the bottom.' },
    ],
    errors: [],
    webcam: 'curl',
    needsVerification: false,
  },
  {
    id: 'triceps-pushdown',
    name: { id: 'Triceps pushdown', en: 'Triceps pushdown' },
    equipment: ['cable'],
    pattern: 'isolation',
    primary: ['triceps-brachii'],
    synergist: [],
    stabilizer: ['latissimus-dorsi', 'rectus-abdominis'],
    summary: {
      id: 'Dorong tali/palang kabel ke bawah dengan meluruskan siku.',
      en: 'Push a cable rope/bar down by straightening the elbows.',
    },
    cues: [
      { id: 'Lengan atas diam.', en: 'Upper arms stay still.' },
      { id: 'Kunci siku di bawah.', en: 'Lock the elbows at the bottom.' },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'plank',
    name: { id: 'Plank', en: 'Plank' },
    equipment: ['bodyweight'],
    pattern: 'carry',
    primary: ['rectus-abdominis', 'transversus-abdominis'],
    synergist: ['obliques-external', 'obliques-internal'],
    stabilizer: ['gluteus-maximus', 'serratus-anterior', 'rectus-femoris'],
    summary: {
      id: 'Tahan tubuh lurus bertumpu pada lengan bawah dan jari kaki.',
      en: 'Hold a straight body on the forearms and toes.',
    },
    cues: [
      {
        id: 'Panggul sedikit diputar ke belakang (rusuk turun).',
        en: 'Tuck the pelvis slightly (ribs down).',
      },
      { id: 'Dorong lantai menjauh dengan lengan.', en: 'Push the floor away with the forearms.' },
    ],
    errors: [],
    needsVerification: false,
  },
  {
    id: 'hanging-leg-raise',
    name: { id: 'Hanging leg raise', en: 'Hanging leg raise' },
    equipment: ['bar'],
    pattern: 'isolation',
    primary: ['rectus-abdominis', 'iliopsoas'],
    synergist: ['obliques-external', 'rectus-femoris'],
    stabilizer: ['latissimus-dorsi', 'forearm-flexors'],
    summary: {
      id: 'Bergantung di palang, angkat kaki dengan menggulung panggul.',
      en: 'Hanging from a bar, raise the legs by curling the pelvis up.',
    },
    cues: [
      {
        id: 'Gulung panggul, bukan hanya mengayun kaki.',
        en: 'Curl the pelvis, not just swing the legs.',
      },
      { id: 'Turunkan pelan tanpa berayun.', en: 'Lower slowly without swinging.' },
    ],
    errors: [],
    needsVerification: true,
  },
  {
    id: 'farmer-carry',
    name: { id: 'Farmer carry', en: 'Farmer carry' },
    equipment: ['dumbbell', 'kettlebell'],
    pattern: 'carry',
    primary: ['forearm-flexors', 'trapezius'],
    synergist: ['quadratus-lumborum', 'obliques-external'],
    stabilizer: ['erector-spinae', 'gluteus-medius', 'rectus-abdominis', 'forearm-extensors'],
    summary: {
      id: 'Berjalan sambil membawa beban berat di kedua tangan.',
      en: 'Walk while carrying heavy weights in both hands.',
    },
    cues: [
      { id: 'Badan tegak, bahu turun.', en: 'Stand tall, shoulders down.' },
      { id: 'Langkah pendek dan terkontrol.', en: 'Short, controlled steps.' },
    ],
    errors: [],
    needsVerification: false,
  },
];

export const EXERCISES: readonly Exercise[] = z.array(Exercise).parse(raw);
export const EXERCISE_BY_ID: ReadonlyMap<string, Exercise> = new Map(
  EXERCISES.map((e) => [e.id, e]),
);

export function getExercise(id: string | undefined): Exercise | undefined {
  return id ? EXERCISE_BY_ID.get(id) : undefined;
}

export type Role = 'primary' | 'synergist' | 'stabilizer';

/** Intensitas tampilan per peran: utama 3, sinergis 2, stabilisator 1. */
export const ROLE_INTENSITY: Record<Role, 1 | 2 | 3> = { primary: 3, synergist: 2, stabilizer: 1 };

export function exerciseIntensities(ex: Exercise): Record<string, 1 | 2 | 3> {
  const out: Record<string, 1 | 2 | 3> = {};
  for (const id of ex.stabilizer) out[id] = 1;
  for (const id of ex.synergist) out[id] = 2;
  for (const id of ex.primary) out[id] = 3;
  return out;
}

export function exercisesForMuscle(muscleId: string): { exercise: Exercise; role: Role }[] {
  const out: { exercise: Exercise; role: Role }[] = [];
  for (const ex of EXERCISES) {
    if (ex.primary.includes(muscleId)) out.push({ exercise: ex, role: 'primary' });
    else if (ex.synergist.includes(muscleId)) out.push({ exercise: ex, role: 'synergist' });
    else if (ex.stabilizer.includes(muscleId)) out.push({ exercise: ex, role: 'stabilizer' });
  }
  const order: Record<Role, number> = { primary: 0, synergist: 1, stabilizer: 2 };
  return out.sort((a, b) => order[a.role] - order[b.role]);
}
