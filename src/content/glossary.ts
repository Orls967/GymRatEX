import { z } from 'zod';
import { GlossaryTerm } from './schema';

type In = z.input<typeof GlossaryTerm>;
const t = (
  id: string,
  term: [string, string],
  definition: [string, string],
  aliases: [string[], string[]] = [[], []],
  related: string[] = [],
): In => ({
  id,
  term: { id: term[0], en: term[1] },
  definition: { id: definition[0], en: definition[1] },
  aliases: { id: aliases[0], en: aliases[1] },
  related,
});

const raw: In[] = [
  t('origin', ['Origo', 'Origin'], [
    'Titik perlekatan otot yang relatif diam saat otot berkontraksi, biasanya lebih dekat ke pusat tubuh.',
    'The attachment point that stays relatively still when the muscle contracts, usually closer to the body’s centre.',
  ], [['origo'], ['origins']], ['insertion']),
  t('insertion', ['Insersio', 'Insertion'], [
    'Titik perlekatan otot yang bergerak ketika otot memendek.',
    'The attachment point that moves when the muscle shortens.',
  ], [['insersio'], ['insertions']], ['origin']),
  t('agonist', ['Agonis', 'Agonist'], [
    'Otot penggerak utama sebuah gerakan. Di aplikasi ini disebut otot “utama”.',
    'The prime mover of a movement. Called the “primary” muscle in this app.',
  ], [['penggerak utama'], ['prime mover']], ['synergist', 'antagonist']),
  t('synergist', ['Sinergis', 'Synergist'], [
    'Otot yang membantu agonis menghasilkan gerakan yang sama.',
    'A muscle that assists the agonist in producing the same movement.',
  ], [['sinergis'], ['synergists']], ['agonist', 'stabilizer']),
  t('stabilizer', ['Stabilisator', 'Stabilizer'], [
    'Otot yang berkontraksi untuk menahan sendi atau segmen tetap diam agar gerakan lain bisa terjadi dengan aman.',
    'A muscle that contracts to hold a joint or segment still so another movement can happen safely.',
  ], [['stabilisator', 'penstabil'], ['stabilizers', 'stabiliser']], ['synergist']),
  t('antagonist', ['Antagonis', 'Antagonist'], [
    'Otot yang bekerja berlawanan dengan agonis, misalnya hamstring terhadap paha depan saat ekstensi lutut.',
    'A muscle that opposes the agonist, e.g. hamstrings versus quads during knee extension.',
  ], [[], ['antagonists']], ['agonist']),
  t('flexion', ['Fleksi', 'Flexion'], [
    'Gerakan menekuk yang memperkecil sudut sendi pada bidang sagital.',
    'A bending movement that decreases the joint angle in the sagittal plane.',
  ], [['menekuk'], ['flex']], ['extension']),
  t('extension', ['Ekstensi', 'Extension'], [
    'Gerakan meluruskan yang memperbesar sudut sendi, kebalikan fleksi.',
    'A straightening movement that increases the joint angle; the opposite of flexion.',
  ], [[], ['extend']], ['flexion']),
  t('abduction', ['Abduksi', 'Abduction'], [
    'Gerakan menjauhi garis tengah tubuh, misalnya mengangkat lengan ke samping.',
    'Movement away from the body’s midline, such as raising the arm sideways.',
  ], [[], []], ['adduction']),
  t('adduction', ['Aduksi', 'Adduction'], [
    'Gerakan mendekati garis tengah tubuh.',
    'Movement toward the body’s midline.',
  ], [[], []], ['abduction']),
  t('sagittal-plane', ['Bidang sagital', 'Sagittal plane'], [
    'Bidang yang membelah tubuh menjadi kiri dan kanan; gerakan maju-mundur seperti squat terjadi di bidang ini.',
    'The plane that divides the body into left and right; forward-backward movements like squats happen in it.',
  ], [['sagital'], ['sagittal']], ['moment-arm']),
  t('moment-arm', ['Lengan momen', 'Moment arm'], [
    'Jarak tegak lurus antara garis kerja gaya dan pusat putaran sendi. Makin panjang, makin besar momen untuk beban yang sama.',
    'The perpendicular distance between a force’s line of action and the joint’s centre of rotation. Longer means a larger moment for the same load.',
  ], [['lengan tuas'], ['lever arm']], ['joint-moment']),
  t('joint-moment', ['Momen sendi', 'Joint moment'], [
    'Kecenderungan beban memutar sebuah sendi (gaya × lengan momen), dalam N·m. Otot harus menghasilkan momen yang setara untuk menahannya.',
    'The tendency of a load to rotate a joint (force × moment arm), in N·m. Muscles must produce an equal moment to resist it.',
  ], [['momen', 'torsi sendi'], ['torque', 'moment']], ['moment-arm']),
  t('bracing', ['Bracing', 'Bracing'], [
    'Mengencangkan seluruh otot inti setelah menarik napas untuk menaikkan tekanan intra-abdomen dan menstabilkan tulang belakang.',
    'Tightening the whole core after a breath to raise intra-abdominal pressure and stabilize the spine.',
  ], [['brace'], ['brace']], ['intra-abdominal-pressure']),
  t('intra-abdominal-pressure', ['Tekanan intra-abdomen', 'Intra-abdominal pressure'], [
    'Tekanan di rongga perut yang membantu menopang tulang belakang saat mengangkat beban berat.',
    'Pressure inside the abdominal cavity that helps support the spine when lifting heavy loads.',
  ], [['IAP'], ['IAP']], ['bracing']),
  t('hip-hinge', ['Hip hinge', 'Hip hinge'], [
    'Pola gerak membungkuk dari pinggul dengan punggung netral dan lutut relatif diam, dasar deadlift.',
    'Bending from the hips with a neutral spine and relatively still knees; the basis of the deadlift.',
  ], [['hinge'], ['hinge']], ['neutral-spine']),
  t('neutral-spine', ['Punggung netral', 'Neutral spine'], [
    'Posisi tulang belakang yang mempertahankan lengkung alaminya, tidak membulat maupun melengkung berlebihan.',
    'A spinal position that keeps its natural curves, neither rounded nor excessively arched.',
  ], [['tulang belakang netral'], []], ['butt-wink']),
  t('knee-valgus', ['Valgus lutut', 'Knee valgus'], [
    'Lutut bergerak masuk ke arah garis tengah saat menekuk, sering terlihat saat bangkit dari squat.',
    'The knee collapsing inward toward the midline while bending, often seen when rising from a squat.',
  ], [['lutut masuk', 'valgus'], ['valgus', 'knees caving']], ['gluteus-medius-term']),
  t('butt-wink', ['Butt wink', 'Butt wink'], [
    'Panggul berputar ke belakang (posterior tilt) di dasar squat sehingga punggung bawah ikut membulat.',
    'The pelvis tucking under (posterior tilt) at the bottom of a squat, rounding the lower back.',
  ], [[], []], ['posterior-pelvic-tilt', 'neutral-spine']),
  t('posterior-pelvic-tilt', ['Tilt panggul posterior', 'Posterior pelvic tilt'], [
    'Rotasi panggul ke belakang yang meratakan lengkung lumbal.',
    'Backward rotation of the pelvis that flattens the lumbar curve.',
  ], [['posterior tilt'], ['posterior tilt']], ['butt-wink']),
  t('eccentric', ['Eksentrik', 'Eccentric'], [
    'Fase ketika otot memanjang sambil menahan beban, misalnya saat turun di squat.',
    'The phase where a muscle lengthens under load, such as descending in a squat.',
  ], [['fase eksentrik', 'fase turun'], ['lowering phase']], ['concentric', 'tempo']),
  t('concentric', ['Konsentrik', 'Concentric'], [
    'Fase ketika otot memendek untuk mengangkat beban.',
    'The phase where a muscle shortens to lift a load.',
  ], [['fase konsentrik'], []], ['eccentric']),
  t('tempo', ['Tempo', 'Tempo'], [
    'Durasi tiap fase repetisi. Tempo lambat menambah waktu di bawah tegangan.',
    'The duration of each phase of a rep. A slow tempo increases time under tension.',
  ], [[], []], ['eccentric']),
  t('rep', ['Repetisi', 'Repetition'], [
    'Satu siklus penuh sebuah gerakan, dari posisi awal kembali ke posisi awal.',
    'One full cycle of a movement, from start position back to start.',
  ], [['rep', 'repetisi'], ['rep', 'reps']], ['set']),
  t('set', ['Set', 'Set'], [
    'Sekelompok repetisi yang dilakukan tanpa istirahat.',
    'A group of repetitions performed without rest.',
  ], [[], ['sets']], ['rep']),
  t('rom', ['Rentang gerak', 'Range of motion'], [
    'Seberapa jauh sendi bergerak dalam satu repetisi.',
    'How far a joint moves during a repetition.',
  ], [['ROM'], ['ROM']], []),
  t('lockout', ['Lockout', 'Lockout'], [
    'Posisi akhir gerakan ketika sendi terkunci lurus, misalnya pinggul terbuka di akhir deadlift.',
    'The end position where the joints are straight, e.g. hips fully open at the top of a deadlift.',
  ], [['kunci'], []], []),
  t('scapula', ['Skapula', 'Scapula'], [
    'Tulang belikat; posisinya menentukan stabilitas bahu saat menekan dan menarik.',
    'The shoulder blade; its position determines shoulder stability when pressing and pulling.',
  ], [['tulang belikat', 'skapula'], ['shoulder blade', 'shoulder blades']], []),
  t('pronation', ['Pronasi', 'Pronation'], [
    'Memutar lengan bawah sehingga telapak tangan menghadap ke bawah/belakang (genggaman overhand).',
    'Rotating the forearm so the palm faces down/back (overhand grip).',
  ], [['pronasi'], ['overhand']], ['supination']),
  t('supination', ['Supinasi', 'Supination'], [
    'Memutar lengan bawah sehingga telapak menghadap ke atas/depan (genggaman underhand).',
    'Rotating the forearm so the palm faces up/forward (underhand grip).',
  ], [['supinasi'], ['underhand']], ['pronation']),
  t('dorsiflexion', ['Dorsofleksi', 'Dorsiflexion'], [
    'Menekuk pergelangan kaki sehingga jari kaki mendekati tulang kering; dibutuhkan agar lutut bisa maju saat squat.',
    'Bending the ankle so the toes move toward the shin; needed for the knee to travel forward in a squat.',
  ], [[], []], ['plantarflexion']),
  t('plantarflexion', ['Plantarfleksi', 'Plantarflexion'], [
    'Meluruskan pergelangan kaki menjauhi tulang kering, seperti saat berjinjit.',
    'Pointing the ankle away from the shin, as when rising onto the toes.',
  ], [[], []], ['dorsiflexion']),
  t('gluteus-medius-term', ['Abduktor pinggul', 'Hip abductors'], [
    'Kelompok otot (terutama gluteus medius) yang mengangkat paha ke samping dan menjaga lutut tidak masuk.',
    'The muscle group (mainly gluteus medius) that lifts the thigh sideways and keeps the knee from caving in.',
  ], [[], ['hip abductor']], ['knee-valgus']),
  t('ik', ['Inverse kinematics (IK)', 'Inverse kinematics (IK)'], [
    'Teknik animasi yang menghitung sudut sendi dari posisi ujung yang diinginkan, misalnya posisi tangan di barbel.',
    'An animation technique that computes joint angles from a desired end position, such as the hands on a bar.',
  ], [['IK'], ['IK']], []),
];

export const GLOSSARY: readonly GlossaryTerm[] = z.array(GlossaryTerm).parse(raw);
export const TERM_BY_ID: ReadonlyMap<string, GlossaryTerm> = new Map(GLOSSARY.map((g) => [g.id, g]));
