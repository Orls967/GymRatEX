import { AboutContent } from './schema';

export const ABOUT = AboutContent.parse({
  disclaimer: [
    {
      id: 'OtotLapis adalah alat edukasi. Isinya bukan nasihat medis dan bukan pengganti pelatih bersertifikat, dokter, atau fisioterapis.',
      en: 'OtotLapis is an educational tool. Its content is not medical advice and is not a substitute for a certified coach, doctor or physiotherapist.',
    },
    {
      id: 'Hentikan latihan bila terasa nyeri tajam, dan konsultasikan dengan tenaga profesional sebelum memulai program baru bila Anda punya cedera atau kondisi kesehatan.',
      en: 'Stop exercising if you feel sharp pain, and consult a professional before starting a new programme if you have an injury or health condition.',
    },
  ],
  limits: [
    {
      id: 'Tubuh 3D adalah stilisasi prosedural: bentuk, ukuran, dan perlekatan otot disederhanakan menjadi elipsoid di antara titik jangkar. Bukan model anatomi yang akurat.',
      en: 'The 3D body is a procedural stylization: muscle shape, size and attachments are simplified to ellipsoids between anchor points. It is not an accurate anatomical model.',
    },
    {
      id: 'Pembagian otot “utama/sinergis/stabilisator” adalah generalisasi. Kontribusi nyata berubah dengan teknik, rentang gerak, dan individu.',
      en: 'The “primary/synergist/stabilizer” split is a generalization. Real contributions vary with technique, range of motion and the individual.',
    },
    {
      id: 'Grafik Studio Form memakai model statis bidang sagital: momen = beban × jarak horizontal ke sendi, dengan massa segmen dari tabel antropometri rata-rata. Percepatan, gaya geser, ko-kontraksi otot, dan gerak di bidang frontal diabaikan.',
      en: 'The Form Studio chart uses a static sagittal-plane model: moment = load × horizontal distance to the joint, with segment masses from average anthropometric tables. Acceleration, shear forces, muscle co-contraction and frontal-plane motion are ignored.',
    },
    {
      id: 'Cek Form Webcam memakai estimasi pose 2D dari satu kamera. Sudut bisa meleset karena perspektif, pakaian longgar, atau pencahayaan.',
      en: 'The Webcam Form Check uses 2D pose estimation from a single camera. Angles can be off due to perspective, loose clothing or lighting.',
    },
  ],
  sources: [
    { label: "Gray's Anatomy, 42nd ed. (Standring, 2020)", note: { id: 'Origo, insersio, dan fungsi otot.', en: 'Muscle origins, insertions and functions.' } },
    { label: 'OpenStax — Anatomy & Physiology 2e (CC BY 4.0)', note: { id: 'Referensi terbuka untuk anatomi otot rangka.', en: 'Open reference for skeletal muscle anatomy.' } },
    { label: 'Moore — Clinically Oriented Anatomy, 8th ed.', note: { id: 'Otot dalam dan otot inti.', en: 'Deep and core muscles.' } },
    { label: 'Winter — Biomechanics and Motor Control of Human Movement, 4th ed.', note: { id: 'Tabel massa & pusat massa segmen tubuh.', en: 'Body segment mass & centre-of-mass tables.' } },
    { label: 'Escamilla (2001), Knee biomechanics of the dynamic squat exercise, MSSE 33(1)', note: { id: 'Konteks momen lutut dan pinggul pada squat.', en: 'Context for knee and hip moments in the squat.' } },
    { label: 'Google MediaPipe Pose Landmarker', note: { id: 'Model deteksi pose 33 titik.', en: '33-landmark pose detection model.' } },
  ],
  licenses: [
    { name: 'three.js, @react-three/fiber, @react-three/drei', license: 'MIT', note: { id: 'Render 3D.', en: '3D rendering.' } },
    { name: 'MediaPipe Tasks Vision + pose_landmarker_lite.task', license: 'Apache-2.0', note: { id: 'Di-host lokal di /mediapipe. Ping telemetri bawaan pustaka ini (ke odml.pa.googleapis.com) diblokir oleh Content-Security-Policy situs.', en: 'Hosted locally under /mediapipe. The library’s built-in telemetry ping (to odml.pa.googleapis.com) is blocked by the site’s Content-Security-Policy.' } },
    { name: 'Barlow Condensed, Archivo, IBM Plex Mono (@fontsource)', license: 'SIL OFL 1.1', note: { id: 'Font di-host sendiri.', en: 'Self-hosted fonts.' } },
    { name: 'lucide-react', license: 'ISC', note: { id: 'Ikon.', en: 'Icons.' } },
    { name: 'Model tubuh prosedural OtotLapis', license: 'MIT', note: { id: 'Dibuat lewat kode di proyek ini, tanpa aset eksternal.', en: 'Generated in code in this project, no external assets.' } },
  ],
});
