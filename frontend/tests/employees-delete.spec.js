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

test('admin dapat menghapus karyawan', async ({ page }) => {
  await login(page);

  // Masuk halaman Karyawan
  await page
    .getByRole('link', { name: 'Karyawan', exact: true })
    .click();

  await expect(page).toHaveURL(/employees/);

  // Buat employee test
  await page
    .getByRole('link', { name: '+ Tambah Karyawan' })
    .click();

  const uniqueId = Date.now();
  const employeeCode = `DELETE${uniqueId}`;
  const employeeName = `Delete Test ${uniqueId}`;
  const email = `delete${uniqueId}@company.com`;

  await page
    .locator('input[name="employee_code"]')
    .fill(employeeCode);

  await page
    .locator('input[name="name"]')
    .fill(employeeName);

  await page
    .locator('input[name="email"]')
    .fill(email);

  await page
    .locator('input[name="department"]')
    .fill('Testing');

  await page
    .locator('input[name="position"]')
    .fill('Delete Tester');

  await page
    .locator('input[name="join_date"]')
    .fill('2026-01-01');

  await page
    .getByRole('spinbutton')
    .fill('5000000');

  await page
    .locator('input[name="bank_account"]')
    .fill('1234567890');

  await page
    .getByRole('button', { name: 'Simpan' })
    .click();

  await page.waitForLoadState('networkidle');

  // Kembali ke daftar Karyawan
  await page
    .getByRole('link', { name: 'Karyawan', exact: true })
    .click();

  await expect(page).toHaveURL(/employees/);

  // Cari row employee yang baru dibuat
  const row = page.getByRole('row', {
    name: new RegExp(employeeCode),
  });

  await expect(row).toBeVisible();

  // Buka action row
  await row.getByRole('button').click();

  // Konfirmasi dialog browser
  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  // Hapus employee dari row tersebut
  await row
    .getByRole('button', { name: 'Hapus' })
    .click();

  await page.waitForLoadState('networkidle');

  // Pastikan employee sudah hilang
  await expect(
    page.getByRole('row', {
      name: new RegExp(employeeCode),
    })
  ).not.toBeVisible();
});