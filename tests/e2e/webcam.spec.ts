import { expect, test } from '@playwright/test';

const executablePath = process.env.PW_CHROMIUM_PATH;

test.use({
  permissions: ['camera'],
  launchOptions: {
    ...(executablePath ? { executablePath } : {}),
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

test('cek form: pernyataan privasi tampil & model pose lokal termuat dengan kamera palsu', async ({
  page,
}) => {
  const external: string[] = [];
  // permintaan yang benar-benar keluar ke jaringan (yang diblokir CSP gagal sebelum terkirim)
  page.on('requestfinished', (r) => {
    const u = new URL(r.url());
    if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol.startsWith('http'))
      external.push(r.url());
  });
  await page.goto('./#/webcam?mode=squat');
  await expect(page.getByTestId('privacy-note')).toBeVisible();
  await page.getByTestId('camera-start').click();
  await expect(page.getByTestId('camera-stop')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId('rep-count')).toHaveText('0');
  await expect(page.getByTestId('webcam-error')).toHaveCount(0);
  await page.getByTestId('camera-stop').click();
  // tidak ada permintaan ke host luar (tanpa CDN, tanpa unggahan)
  expect(external).toEqual([]);
});
