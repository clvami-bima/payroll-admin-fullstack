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

test('admin dapat mengedit karyawan', async ({ page }) => {
  await login(page);

  await page
    .getByRole('link', { name: 'Karyawan', exact: true })
    .click();

  await expect(page).toHaveURL(/employees/);

  await page
    .getByRole('link', { name: 'Kelola' })
    .first()
    .click();

  // Edit data karyawan
  await page
    .locator('input[name="name"]')
    .fill('Anton Kalasnikov');

  await page
    .locator('input[name="department"]')
    .fill('Keuangan Luar Negeri');

  await page
    .locator('input[name="position"]')
    .fill('Staff Khusus');

  await page
    .locator('input[name="base_salary"]')
    .fill('42000000.00');

  await page
    .locator('select[name="status"]')
    .selectOption('active');

  await page
    .locator('input[name="bank_account"]')
    .fill('32463118912');

  // Simpan
  await page.getByRole('button', { name: 'Simpan' }).click();

  // Tunggu proses selesai
  await page.waitForLoadState('networkidle');

  // Verifikasi hasil edit
  await expect(page.getByText('Anton Kalasnikov')).toBeVisible();
  await expect(page.getByText('Keuangan Luar Negeri')).toBeVisible();
  await expect(page.getByText('Staff Khusus')).toBeVisible();
});