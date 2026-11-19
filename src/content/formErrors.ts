import { z } from 'zod';
import { FormError } from './schema';

const raw: z.input<typeof FormError>[] = [
  {
    id: 'knee-valgus',
    title: { id: 'Lutut masuk (knee valgus)', en: 'Knees caving in (knee valgus)' },
    summary: {
      id: 'Saat bangkit dari squat, lutut bergerak ke dalam melewati garis jari kaki.',
      en: 'When rising from a squat, the knees travel inward past the line of the toes.',
    },
    why: {
      id: 'Valgus dinamis menggeser beban ke sisi medial lutut dan sering dikaitkan dengan iritasi patelofemoral serta risiko cedera ACL pada gerakan dinamis. Pada squat berbeban, sedikit valgus sesaat belum tentu berbahaya; yang dipermasalahkan adalah kolaps yang tidak terkontrol.',
      en: 'Dynamic valgus shifts load to the medial knee and is linked to patellofemoral irritation and ACL injury risk in dynamic movements. In loaded squats a brief, small valgus is not necessarily harmful; the concern is an uncontrolled collapse.',
    },
    fix: [
      {
        id: 'Dorong lutut searah jari kaki kedua.',
        en: 'Push the knees in line with the second toe.',
      },
      {
        id: 'Kurangi beban dan perkuat abduktor pinggul (gluteus medius).',
        en: 'Reduce the load and strengthen the hip abductors (gluteus medius).',
      },
      {
        id: 'Coba “sobek lantai” dengan kaki untuk mengaktifkan rotator eksternal pinggul.',
        en: 'Try to “screw the feet into the floor” to engage the hip external rotators.',
      },
    ],
    zones: ['knee', 'hip'],
    demo: 'squat',
    view: 'front',
    exercises: ['back-squat', 'goblet-squat', 'lunge', 'leg-press'],
    needsVerification: true,
  },
  {
    id: 'butt-wink',
    title: { id: 'Butt wink', en: 'Butt wink' },
    summary: {
      id: 'Di dasar squat panggul berputar ke belakang dan punggung bawah membulat.',
      en: 'At the bottom of the squat the pelvis tucks under and the lower back rounds.',
    },
    why: {
      id: 'Fleksi lumbal saat menahan beban berat menambah tekanan pada diskus. Penyebabnya bervariasi: kedalaman melebihi mobilitas pinggul, anatomi panggul, atau bracing yang lepas. Sedikit butt wink tanpa beban berat sering tidak bermasalah.',
      en: 'Lumbar flexion under heavy load adds stress to the discs. Causes vary: depth beyond hip mobility, pelvic anatomy or lost bracing. A small wink without heavy load is often harmless.',
    },
    fix: [
      {
        id: 'Squat hanya sedalam punggung bisa tetap netral.',
        en: 'Squat only as deep as you can keep a neutral back.',
      },
      {
        id: 'Coba posisi kaki sedikit lebih lebar dan jari kaki lebih terbuka.',
        en: 'Try a slightly wider stance with toes turned out more.',
      },
      {
        id: 'Pertahankan bracing sampai posisi paling bawah.',
        en: 'Keep the brace all the way to the bottom.',
      },
    ],
    zones: ['lumbar'],
    demo: 'squat',
    view: 'side',
    exercises: ['back-squat', 'goblet-squat', 'leg-press'],
    needsVerification: true,
  },
  {
    id: 'rounded-back',
    title: { id: 'Punggung membulat', en: 'Rounded back' },
    summary: {
      id: 'Saat deadlift, punggung bawah dan atas membulat sehingga barbel menjauh dari tubuh.',
      en: 'During a deadlift the lower and upper back round and the bar drifts away from the body.',
    },
    why: {
      id: 'Fleksi lumbal di bawah beban berat menggeser beban dari otot ke jaringan pasif (ligamen dan diskus). Barbel yang menjauh juga memperpanjang lengan momen ke punggung bawah.',
      en: 'Lumbar flexion under heavy load shifts stress from muscles to passive tissues (ligaments and discs). A bar drifting away also lengthens the moment arm to the lower back.',
    },
    fix: [
      {
        id: 'Kunci lat: bayangkan menyimpan ketiak di saku belakang.',
        en: 'Lock the lats: imagine tucking your armpits into your back pockets.',
      },
      {
        id: 'Barbel menyentuh tulang kering sebelum menarik.',
        en: 'Bar touching the shins before pulling.',
      },
      {
        id: 'Turunkan beban hingga posisi bisa dipertahankan.',
        en: 'Lower the load until you can hold the position.',
      },
    ],
    zones: ['lumbar'],
    demo: 'hinge',
    view: 'side',
    exercises: ['deadlift', 'romanian-deadlift', 'barbell-row', 'good-morning'],
    needsVerification: false,
  },
  {
    id: 'elbow-flare',
    title: { id: 'Siku melebar (elbow flare)', en: 'Elbow flare' },
    summary: {
      id: 'Saat bench press atau push-up, siku terbuka hampir 90° dari badan.',
      en: 'During the bench press or push-up, the elbows open to nearly 90° from the torso.',
    },
    why: {
      id: 'Abduksi bahu mendekati 90° dengan rotasi internal mempersempit ruang subakromial dan menambah tegangan di bahu depan. Sudut siku sekitar 45–70° umumnya lebih nyaman bagi bahu.',
      en: 'Shoulder abduction near 90° combined with internal rotation narrows the subacromial space and stresses the front of the shoulder. An elbow angle around 45–70° is usually friendlier to the shoulder.',
    },
    fix: [
      {
        id: 'Bayangkan “mematahkan” barbel untuk memutar siku ke dalam.',
        en: 'Think about “bending the bar” to tuck the elbows.',
      },
      {
        id: 'Turunkan barbel ke dada bawah, bukan leher.',
        en: 'Lower the bar to the lower chest, not the neck.',
      },
    ],
    zones: ['shoulder', 'elbow'],
    demo: 'bench',
    view: 'top',
    exercises: ['bench-press', 'incline-bench-press', 'push-up'],
    needsVerification: true,
  },
];

export const FORM_ERRORS: readonly FormError[] = z.array(FormError).parse(raw);
export const FORM_ERROR_BY_ID: ReadonlyMap<string, FormError> = new Map(
  FORM_ERRORS.map((f) => [f.id, f]),
);
