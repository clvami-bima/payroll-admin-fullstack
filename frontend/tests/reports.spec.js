import { test, expect } from '@playwright/test';

test.describe('Laporan', () => {

  async function login(page) {
    await page.goto('http://localhost:5173/login');

    await page
      .getByRole('textbox', { name: 'admin@company.com' })
      .fill('admin@company.com');

    await page
      .getByRole('textbox', { name: '********' })
      .fill('admin123');

    await page
      .getByRole('button', { name: 'Masuk' })
      .click();

    await page
      .getByRole('link', { name: 'Laporan' })
      .click();

    await expect(
      page.getByRole('button', { name: 'Terapkan Filter' })
    ).toBeVisible();
  }


  test('FILTER - laporan berdasarkan periode dan departemen', async ({ page }) => {
    await login(page);

    await page
      .getByRole('combobox')
      .selectOption('11');

    await page
      .getByRole('textbox', { name: 'Tahun' })
      .fill('2026');

    await page
      .getByRole('textbox', { name: 'Departemen' })
      .fill('IT');

    await page
      .getByRole('button', { name: 'Terapkan Filter' })
      .click();

    await expect(
      page.getByRole('button', { name: 'Terapkan Filter' })
    ).toBeVisible();
  });


  test('FILTER - laporan berdasarkan bulan dan tahun', async ({ page }) => {
    await login(page);

    await page
      .getByRole('combobox')
      .selectOption('3');

    await page
      .getByRole('textbox', { name: 'Tahun' })
      .fill('2026');

    await page
      .getByRole('button', { name: 'Terapkan Filter' })
      .click();

    await expect(
      page.getByRole('button', { name: 'Ekspor CSV' })
    ).toBeVisible();
  });


  test('EXPORT - ekspor laporan ke CSV', async ({ page }) => {
    await login(page);

    await page
      .getByRole('combobox')
      .selectOption('3');

    await page
      .getByRole('textbox', { name: 'Tahun' })
      .fill('2026');

    await page
      .getByRole('button', { name: 'Terapkan Filter' })
      .click();

    const downloadPromise = page.waitForEvent('download');

    await page
      .getByRole('button', { name: 'Ekspor CSV' })
      .click();

    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

});