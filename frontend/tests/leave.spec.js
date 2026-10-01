import { test, expect } from '@playwright/test';

test.describe('Manajemen Cuti', () => {

  async function login(page) {
    await page.goto('http://localhost:5173/login');

    await page
      .getByRole('textbox', { name: 'admin@company.com' })
      .fill('admin@company.com');

    await page
      .getByRole('textbox', { name: '********' })
      .fill('admin123');

    await page
      .getByRole('textbox', { name: '********' })
      .press('Enter');

    await page.getByRole('link', { name: 'Manajemen Cuti' }).click();

    await expect(
      page.getByRole('button', { name: '+ Ajukan Cuti' })
    ).toBeVisible();
  }

  async function createLeave(page) {
    await page.getByRole('button', { name: '+ Ajukan Cuti' }).click();

    await page
      .getByRole('combobox')
      .first()
      .selectOption('24');

    await page
      .getByRole('textbox')
      .first()
      .fill('2026-09-20');

    await page
      .getByRole('textbox')
      .nth(1)
      .fill('2026-09-20');

    await page
      .getByRole('combobox')
      .nth(1)
      .selectOption('permission');

    await page
      .getByRole('textbox', {
        name: 'Masukkan alasan cuti...'
      })
      .fill('saya ada meeting');

    await page
      .getByRole('button', { name: 'Ajukan Cuti' })
      .click();

    await expect(
      page.getByRole('cell', { name: 'Menunggu' }).last()
    ).toBeVisible();
  }


  test('CREATE - mengajukan cuti', async ({ page }) => {
    await login(page);

    await createLeave(page);

    await expect(
      page.getByRole('cell', { name: 'Menunggu' }).last()
    ).toBeVisible();
  });


  test('APPROVE - menyetujui pengajuan cuti', async ({ page }) => {
    await login(page);

    await createLeave(page);

    await page
      .getByRole('cell', { name: 'Menunggu' })
      .last()
      .click();

    await page
      .getByRole('button', { name: 'Approve' })
      .last()
      .click();

    await expect(
      page.getByText('Disetujui').last()
    ).toBeVisible();
  });


  test('REJECT - menolak pengajuan cuti', async ({ page }) => {
    await login(page);

    await createLeave(page);

    await page
      .getByRole('cell', { name: 'Menunggu' })
      .last()
      .click();

    page.once('dialog', dialog => {
      dialog
        .accept('alasan penolakan untuk testing')
        .catch(() => {});
    });

    await page
      .getByRole('button', { name: 'Reject' })
      .last()
      .click();

    await expect(
      page.getByText('Ditolak').last()
    ).toBeVisible();
  });


  test('CANCEL - membatalkan pengajuan cuti', async ({ page }) => {
    await login(page);

    await createLeave(page);

    await page
      .getByRole('cell', { name: 'Menunggu' })
      .last()
      .click();

    page.once('dialog', dialog => {
      dialog.accept().catch(() => {});
    });

    await page
      .getByRole('button', { name: 'Cancel' })
      .last()
      .click();

    await expect(
      page.getByText('Dibatalkan').last()
    ).toBeVisible();
  });

});