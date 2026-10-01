import { test, expect } from '@playwright/test';

test.describe('Proses Payroll', () => {

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
      .getByRole('link', { name: 'Proses Payroll' })
      .click();

    await expect(
      page.getByRole('button', { name: 'Buat / Buka Periode' })
    ).toBeVisible();
  }


  test('CREATE - membuat periode payroll', async ({ page }) => {
    await login(page);

    await page
      .getByRole('combobox')
      .selectOption('3');

    await page
      .getByRole('spinbutton')
      .fill('2027');

    await page
      .getByRole('button', { name: 'Buat / Buka Periode' })
      .click();

    await expect(
      page.getByRole('button', { name: /Maret 2027/ })
    ).toBeVisible();
  });


  test('CREATE - membuat periode payroll kedua', async ({ page }) => {
    await login(page);

    await page
      .getByRole('combobox')
      .selectOption('11');

    await page
      .getByRole('spinbutton')
      .fill('2026');

    await page
      .getByRole('button', { name: 'Buat / Buka Periode' })
      .click();

    await expect(
      page.getByRole('button', { name: /November 2026/ })
    ).toBeVisible();
  });


  test('RUN - menjalankan payroll periode', async ({ page }) => {
    await login(page);

    await page
      .getByRole('button', { name: 'Maret 2027 Draft' })
      .click();

    page.once('dialog', dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.dismiss().catch(() => {});
    });

    await page
      .getByRole('button', { name: 'Jalankan Payroll' })
      .click();
  });


  test('NAVIGATION - berpindah antar modul payroll', async ({ page }) => {
    await login(page);

    await page
      .getByRole('link', { name: 'Absensi Karyawan' })
      .click();

    await expect(
      page.getByRole('link', { name: 'Manajemen Cuti' })
    ).toBeVisible();

    await page
      .getByRole('link', { name: 'Manajemen Cuti' })
      .click();

    await expect(
      page.getByRole('link', { name: 'Laporan' })
    ).toBeVisible();

    await page
      .getByRole('link', { name: 'Laporan' })
      .click();

    await page
      .getByRole('link', { name: 'Proses Payroll' })
      .click();

    await expect(
      page.getByRole('button', { name: 'Buat / Buka Periode' })
    ).toBeVisible();
  });

});