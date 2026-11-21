// Mengambil ulang 33 screenshot README dari build produksi.
// Pemakaian: npm run build && npx vite preview --port 4174 --strictPort &  lalu  node scripts/screenshots.mjs
import { chromium, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'docs/screenshots');
const BASE = process.env.BASE_URL ?? 'http://localhost:4174/GymRatEX/';
mkdirSync(OUT, { recursive: true });

const executablePath = process.env.PW_CHROMIUM_PATH;
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
});

async function ctx({ mobile = false, theme = 'dark', lang = 'id', camera = false } = {}) {
  const base = mobile
    ? devices['Pixel 7']
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
  const context = await browser.newContext({
    ...base,
    serviceWorkers: 'block',
    permissions: camera ? ['camera'] : [],
    colorScheme: theme,
  });
  await context.addInitScript(
    ([t, l]) => {
      try {
        localStorage.setItem('gymrat.theme', t);
        localStorage.setItem('gymrat.lang', l);
      } catch {
        /* abaikan */
      }
    },
    [theme, lang],
  );
  return context;
}

async function open(page, hash, { wait3d = true } = {}) {
  await page.goto(`${BASE}#${hash}`);
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  if (wait3d) {
    await page.locator('[data-testid="three-canvas"]').first().waitFor({ timeout: 20000 });
    await page.waitForTimeout(3500);
  } else {
    await page.waitForTimeout(600);
  }
}

async function shot(page, file, opts = {}) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({
    path: join(OUT, file),
    type: 'jpeg',
    quality: 86,
    fullPage: !!opts.full,
  });
  console.log('✓', file);
}

async function studio(page, pattern, { phase, theme } = {}) {
  await page.getByRole('radio', { name: pattern }).click();
  await page.waitForTimeout(800);
  await page.getByTestId('play-toggle').click(); // jeda
  if (phase != null) await page.getByTestId('phase-slider').fill(String(phase));
  await page.waitForTimeout(900);
  void theme;
}

// ---------- desktop gelap ----------
{
  const c = await ctx();
  const p = await c.newPage();
  await open(p, '/');
  await shot(p, '01-beranda-gelap.jpg');

  await p.getByTestId('search-open').click();
  await p.getByTestId('search-input').fill('paha');
  await p.waitForTimeout(500);
  await shot(p, '04-pencarian.jpg');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);

  await open(p, '/otot');
  await shot(p, '06-peta-otot-depan.jpg');
  await p.getByRole('radio', { name: 'Belakang' }).click();
  await p.waitForTimeout(1800);
  await shot(p, '07-peta-otot-belakang.jpg');
  await p.getByRole('radio', { name: 'Depan' }).click();
  await p.getByRole('radio', { name: 'Tengah' }).click();
  await p.waitForTimeout(1800);
  await shot(p, '08-peta-otot-lapisan-tengah.jpg');
  await p.getByRole('radio', { name: 'Dalam' }).click();
  await p.waitForTimeout(1800);
  await shot(p, '09-peta-otot-lapisan-dalam.jpg');

  await open(p, '/latihan?otot=gluteus-maximus&alat=barbell', { wait3d: false });
  await shot(p, '12-pustaka-filter.jpg');
  await open(p, '/latihan/back-squat');
  await shot(p, '13-pustaka-detail-back-squat.jpg');

  await open(p, '/studio');
  await studio(p, 'Back squat', { phase: 1 });
  await shot(p, '16-studio-squat.jpg');
  const svg = p.locator('svg[role="img"]').first();
  const box = await svg.boundingBox();
  if (box) await p.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.5);
  await p.waitForTimeout(500);
  await shot(p, '20-studio-tooltip-grafik.jpg');
  await p.mouse.move(5, 5);
  await p.getByRole('radio', { name: 'Deadlift (hinge)' }).click();
  await p.getByTestId('phase-slider').fill('1');
  await p.waitForTimeout(900);
  await shot(p, '17-studio-deadlift.jpg');
  await p.getByRole('radio', { name: 'Lunge' }).click();
  await p.getByTestId('phase-slider').fill('1');
  await p.waitForTimeout(900);
  await shot(p, '18-studio-lunge.jpg');
  await p.getByRole('radio', { name: 'Overhead press' }).click();
  await p.getByTestId('phase-slider').fill('0.95');
  await p.waitForTimeout(900);
  await shot(p, '19-studio-overhead-press.jpg');

  await open(p, '/studio');
  await p.getByRole('radio', { name: 'Back squat' }).click();
  await p.getByTestId('play-toggle').click();
  await p.getByLabel('Sudut torso').fill('12');
  await p.getByLabel('Kedalaman').fill('100');
  await p.getByTestId('phase-slider').fill('1');
  await p.waitForTimeout(1000);
  await shot(p, '22-studio-peringatan-mobilitas.jpg');

  for (const [id, f] of [
    ['knee-valgus', '23-benar-salah-knee-valgus.jpg'],
    ['butt-wink', '24-benar-salah-butt-wink.jpg'],
    ['rounded-back', '25-benar-salah-rounded-back.jpg'],
    ['elbow-flare', '26-benar-salah-elbow-flare.jpg'],
  ]) {
    await open(p, `/benar-salah/${id}`);
    await shot(p, f);
  }

  await open(p, '/glosarium', { wait3d: false });
  await shot(p, '29-glosarium.jpg');
  await open(p, '/glosarium/moment-arm', { wait3d: false });
  await p.waitForTimeout(600);
  await shot(p, '30-glosarium-istilah.jpg');
  await open(p, '/tentang', { wait3d: false });
  await shot(p, '31-tentang.jpg', { full: true });
  await c.close();
}

// ---------- desktop terang ----------
{
  const c = await ctx({ theme: 'light' });
  const p = await c.newPage();
  await open(p, '/otot/latissimus-dorsi');
  await shot(p, '10-peta-otot-terpilih-terang.jpg');
  await open(p, '/latihan/deadlift');
  await shot(p, '14-pustaka-deadlift-terang.jpg');
  await open(p, '/studio');
  await p.getByTestId('play-toggle').click();
  await p.getByTestId('phase-slider').fill('1');
  await p.waitForTimeout(900);
  await shot(p, '21-studio-terang.jpg');
  await c.close();
}

// ---------- English ----------
{
  const c = await ctx({ lang: 'en' });
  const p = await c.newPage();
  await open(p, '/');
  await shot(p, '05-beranda-english.jpg');
  await open(p, '/latihan/bench-press');
  await shot(p, '15-library-english.jpg');
  await c.close();
}

// ---------- webcam (kamera palsu Chromium) ----------
{
  const c = await ctx({ camera: true });
  const p = await c.newPage();
  await open(p, '/webcam?mode=squat', { wait3d: false });
  await shot(p, '27-webcam-siap.jpg');
  await p.getByTestId('camera-start').click();
  await p.getByTestId('camera-stop').waitFor({ timeout: 60000 });
  await p.waitForTimeout(2500);
  await shot(p, '28-webcam-berjalan.jpg');
  await c.close();
}

// ---------- HP ----------
{
  const c = await ctx({ mobile: true, theme: 'light' });
  const p = await c.newPage();
  await open(p, '/');
  await shot(p, '02-beranda-hp-terang.jpg');
  await p.getByTestId('menu-toggle').click();
  await p.waitForTimeout(400);
  await shot(p, '03-menu-hp.jpg');
  await c.close();
}
{
  const c = await ctx({ mobile: true });
  const p = await c.newPage();
  await open(p, '/otot/rectus-femoris');
  await shot(p, '11-peta-otot-hp.jpg');
  await open(p, '/studio');
  await p.getByTestId('play-toggle').click();
  await p.getByTestId('phase-slider').fill('1');
  await p.waitForTimeout(900);
  await shot(p, '32-studio-hp.jpg');
  await open(p, '/benar-salah/knee-valgus');
  await shot(p, '33-benar-salah-hp.jpg');
  await c.close();
}

await browser.close();
