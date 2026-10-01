import { test, expect } from '@playwright/test';

test('delete attendance', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.getByRole('textbox', { name: 'admin@company.com' }).fill('admin@company.com');
  await page.getByRole('textbox', { name: '********' }).fill('admin123');
  await page.getByRole('textbox', { name: '********' }).press('Enter');

  await page.getByRole('link', { name: 'Absensi Karyawan' }).click();

  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.accept().catch(() => {});
  });

  await page.getByRole('button', { name: 'Hapus' }).first().click();

  await page.getByRole('button', { name: 'Terapkan' }).click();

  await expect(page.getByRole('button', { name: 'Hapus' }).first()).toBeVisible();
});