import { test, expect } from '@playwright/test';

test('admin berhasil login dan masuk dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.getByPlaceholder('admin@company.com').fill('admin@company.com');
  await page.getByPlaceholder('********').fill('admin123');

  await page.getByRole('button', { name: 'Masuk' }).click();

  await expect(page).toHaveURL('http://localhost:5173/');

  await expect(
    page.getByRole('link', { name: 'Dashboard' })
  ).toBeVisible();
});

test('admin gagal login dengan password salah', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.getByPlaceholder('admin@company.com').fill('admin@company.com');
  await page.getByPlaceholder('********').fill('passwordsalah');

  await page.getByRole('button', { name: 'Masuk' }).click();

  await expect(page).toHaveURL('http://localhost:5173/login');

  // Sesuaikan teks ini dengan pesan error di aplikasi kamu
  await expect(
    page.getByText(/email|password|gagal|invalid/i).first()
  ).toBeVisible();
});

test('admin berhasil logout', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.getByPlaceholder('admin@company.com').fill('admin@company.com');
  await page.getByPlaceholder('********').fill('admin123');

  await page.getByRole('button', { name: 'Masuk' }).click();

  await expect(page).toHaveURL('http://localhost:5173/');

  await page.getByRole('button', { name: /keluar/i }).click();

  await expect(page).toHaveURL(/login/);
});