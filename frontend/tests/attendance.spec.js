import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('http://localhost:5173/login');

  await page
    .getByRole('textbox', { name: 'admin@company.com' })
    .fill('admin@company.com');

  await page
    .getByRole('textbox', { name: '********' })
    .fill('admin123');

  await page.getByRole('button', { name: 'Masuk' }).click();

  await expect(page).toHaveURL('http://localhost:5173/');
}

test('admin dapat menambah absensi karyawan', async ({ page }) => {
  await login(page);

  // Masuk halaman Absensi Karyawan
  await page
    .getByRole('link', { name: 'Absensi Karyawan' })
    .click();

  await expect(page).toHaveURL(/attendance/);

  // Buka form tambah absensi
  await page
    .getByRole('button', { name: '+ Tambah Absensi' })
    .click();

  // Pilih karyawan
  await page.getByRole('combobox').nth(2).selectOption('12');

  // Isi waktu masuk
  await page
    .getByRole('textbox')
    .nth(3)
    .fill('2026-09-20T14:30');

  // Isi waktu keluar
  await page
    .getByRole('textbox')
    .nth(4)
    .fill('2026-09-20T14:30');

  // Tambahkan absensi
  await page
    .getByText('Tambah Absensi�')
    .click();

  // Pilih status
  await page
    .getByRole('combobox')
    .nth(3)
    .selectOption('late');

  // Isi catatan
  await page
    .getByRole('textbox', { name: 'Catatan tambahan...' })
    .fill('saya telat karena saya ada meeting');

  // Simpan
  await page
    .getByRole('button', { name: 'Simpan' })
    .click();

  await page.waitForLoadState('networkidle');

  // Pastikan halaman attendance tetap terbuka
  await expect(page).toHaveURL(/attendance/);
});