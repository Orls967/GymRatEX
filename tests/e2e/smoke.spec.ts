import { expect, test } from '@playwright/test';

test.describe('smoke', () => {
  test('beranda tampil dalam bahasa Indonesia secara default', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Lihat otot bekerja');
  });

  test('ganti bahasa ke EN dan tetap tersimpan setelah reload', async ({ page }) => {
    await page.goto('./');
    await page.getByTestId('menu-toggle').click();
    await page.locator('#mobile-menu').getByTestId('lang-en').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('See muscles work');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('See muscles work');
  });

  test('ganti tema terang/gelap tanpa berkedip setelah reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByTestId('menu-toggle').click();
    await page.locator('#mobile-menu').getByTestId('theme-light').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(243, 239, 230)');
    await page.reload();
    // atribut sudah benar sebelum React dirender (skrip inline di index.html)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('tema "ikuti sistem" mengikuti prefers-color-scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('semua modul bisa dibuka lewat routing hash', async ({ page }) => {
    for (const path of ['otot', 'latihan', 'studio', 'benar-salah', 'webcam', 'glosarium', 'tentang']) {
      await page.goto(`./#/${path}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('pencarian Ctrl+K menemukan otot', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Control+k');
    await expect(page.getByTestId('search-input')).toBeVisible();
    await page.getByTestId('search-input').fill('hamstring');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/otot\/hamstrings/);
  });
});

test.describe('peta otot', () => {
  test('memilih otot dari daftar menampilkan detail dan latihan terkait', async ({ page }) => {
    await page.goto('./#/otot');
    await page.getByTestId('muscle-chip-gluteus-maximus').click();
    await expect(page).toHaveURL(/#\/otot\/gluteus-maximus/);
    const detail = page.getByTestId('muscle-detail');
    await expect(detail).toContainText('Gluteus maximus');
    await expect(detail.getByRole('link', { name: /Hip thrust/ })).toBeVisible();
  });

  test('kanvas 3D dirender', async ({ page }) => {
    await page.goto('./#/otot');
    await expect(page.getByTestId('three-canvas').locator('canvas')).toBeVisible();
  });
});
