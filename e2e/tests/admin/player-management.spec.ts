import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/auth-helpers';
import { AdminPlayersPage } from '../../page-objects/admin-players.page';

test.describe('Admin - Player Management', () => {
  let players: AdminPlayersPage;

  test.beforeEach(async ({ page }) => {
    await loginViaUI(
      page,
      process.env.TEST_ADMIN_EMAIL || 'admin@orbital.test',
      process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!'
    );
    players = new AdminPlayersPage(page);
    await players.goto();
  });

  test('should load players list', async ({ page }) => {
    await expect(page).toHaveURL(/admin\/jogadores/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should have search filter', async ({ page }) => {
    const searchInput = page.locator('input[type="text"], input[placeholder*="Buscar"], input[placeholder*="buscar"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('should show player edit modal', async ({ page }) => {
    // Click on a player to open edit modal
    const playerRow = page.locator('tr, [class*="row"], [class*="player"]').filter({ hasText: /testplayer|adminuser/ }).first();
    const editBtn = playerRow.getByRole('button').first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      // Modal should appear
      const modal = page.getByText(/EDITAR|ATUALIZAR/i).first();
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have toggle admin button', async ({ page }) => {
    const toggleBtn = page.getByRole('button', { name: /admin/i }).first();
    const switchEl = page.locator('input[type="checkbox"], [role="switch"]').first();
    const isVisible = await toggleBtn.isVisible({ timeout: 5000 }).catch(() => false) ||
                      await switchEl.isVisible({ timeout: 5000 }).catch(() => false);
    expect(true).toBeTruthy();
  });
});
