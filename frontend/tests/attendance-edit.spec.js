import { test, expect } from '@playwright/test';

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

  await expect(page).toHaveURL('http://localhost:5173/');
}

test('admin dapat mengedit absensi karyawan', async ({ page }) => {
  await login(page);

  // Masuk halaman Absensi
  await page
    .getByRole('link', { name: 'Absensi Karyawan' })
    .click();

  await expect(page).toHaveURL(/attendance/);

  // Klik Edit pada absensi pertama
  await page
    .getByRole('button', { name: 'Edit' })
    .first()
    .click();

  // Ubah status absensi
  await page
    .getByRole('combobox')
    .nth(3)
    .selectOption('leave');

  // Simpan perubahan
  await page
    .getByRole('button', { name: 'Simpan' })
    .click();

  await page.waitForLoadState('networkidle');

  // Pastikan tetap di halaman Absensi
  await expect(page).toHaveURL(/attendance/);
});