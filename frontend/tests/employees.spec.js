import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('http://localhost:5173/login');

  await page.getByRole('textbox', { name: 'admin@company.com' })
    .fill('admin@company.com');

  await page.getByRole('textbox', { name: '********' })
    .fill('admin123');

  await page.getByRole('button', { name: 'Masuk' }).click();

  await expect(page).toHaveURL('http://localhost:5173/');
}


// ============================================================
// TEST 1 - Buka halaman tambah karyawan
// ============================================================

test('admin dapat membuka halaman tambah karyawan', async ({ page }) => {
  await login(page);

  await page.getByRole('link', {
    name: 'Karyawan',
    exact: true
  }).click();

  await expect(page).toHaveURL(/employees/);

  await page.getByRole('link', {
    name: '+ Tambah Karyawan'
  }).click();

  await expect(page).toHaveURL(/employees\/new/);

  await expect(
    page.locator('input[name="employee_code"]')
  ).toBeVisible();

  await expect(
    page.locator('input[name="name"]')
  ).toBeVisible();
});


// ============================================================
// TEST 2 - Isi form karyawan
// ============================================================

test('admin dapat mengisi form tambah karyawan', async ({ page }) => {
  await login(page);

  await page.getByRole('link', {
    name: 'Karyawan',
    exact: true
  }).click();

  await page.getByRole('link', {
    name: '+ Tambah Karyawan'
  }).click();

  const uniqueId = Date.now();

  await page.locator('input[name="employee_code"]')
    .fill(`TEST${uniqueId}`);

  await page.locator('input[name="name"]')
    .fill('Bima Test');

  await page.locator('input[name="email"]')
    .fill(`bima${uniqueId}@company.com`);

  await page.locator('input[name="department"]')
    .fill('Keuangan');

  await page.locator('input[name="position"]')
    .fill('Staff');

  await page.locator('input[name="join_date"]')
    .fill('2026-01-01');

  await page.getByRole('spinbutton')
    .fill('5000000');

  await page.locator('input[name="bank_account"]')
    .fill('1234567890');

  await expect(
    page.locator('input[name="employee_code"]')
  ).toHaveValue(`TEST${uniqueId}`);

  await expect(
    page.locator('input[name="name"]')
  ).toHaveValue('Bima Test');

  await expect(
    page.locator('input[name="email"]')
  ).toHaveValue(`bima${uniqueId}@company.com`);
});


// ============================================================
// TEST 3 - Submit karyawan
// ============================================================

test('admin dapat submit form tambah karyawan', async ({ page }) => {
  await login(page);

  await page.getByRole('link', {
    name: 'Karyawan',
    exact: true
  }).click();

  await page.getByRole('link', {
    name: '+ Tambah Karyawan'
  }).click();

  const uniqueId = Date.now();

  const employeeCode = `TEST${uniqueId}`;
  const email = `bima${uniqueId}@company.com`;

  await page.locator('input[name="employee_code"]')
    .fill(employeeCode);

  await page.locator('input[name="name"]')
    .fill('Bima Test');

  await page.locator('input[name="email"]')
    .fill(email);

  await page.locator('input[name="department"]')
    .fill('Keuangan');

  await page.locator('input[name="position"]')
    .fill('Staff');

  await page.locator('input[name="join_date"]')
    .fill('2026-01-01');

  await page.getByRole('spinbutton')
    .fill('5000000');

  await page.locator('input[name="bank_account"]')
    .fill('1234567890');

  await page.getByRole('button', {
    name: 'Simpan'
  }).click();

  // Aplikasi redirect ke halaman detail employee
  await expect(page).toHaveURL(/\/employees\/\d+$/);
});