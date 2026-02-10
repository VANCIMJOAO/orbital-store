import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/auth-helpers';

test.describe('Player Profile', () => {
  test('should load own profile when authenticated', async ({ page }) => {
    await loginViaUI(
      page,
      process.env.TEST_USER_EMAIL || 'testuser@orbital.test',
      process.env.TEST_USER_PASSWORD || 'TestPass123!'
    );
    await page.goto('/campeonatos/perfil');
    await expect(page.locator('body')).not.toBeEmpty();
    // Should show profile content (not redirect)
    await expect(page).toHaveURL(/perfil/);
  });

  test('should load public player profile', async ({ page }) => {
    // Navigate to a player profile from partidas
    await page.goto('/campeonatos/partidas');
    const playerLink = page.locator('a[href*="/jogador/"]').first();
    if (await playerLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await playerLink.click();
      await expect(page).toHaveURL(/jogador/);
    }
  });

  test('should show stats cards (PARTIDAS, WINRATE, K/D, RATING)', async ({ page }) => {
    await loginViaUI(
      page,
      process.env.TEST_USER_EMAIL || 'testuser@orbital.test',
      process.env.TEST_USER_PASSWORD || 'TestPass123!'
    );
    await page.goto('/campeonatos/perfil');
    const statsText = page.getByText(/PARTIDAS|WINRATE|K\/D|RATING/i).first();
    await expect(statsText).toBeVisible({ timeout: 10000 });
  });

  test('should show match history section', async ({ page }) => {
    await loginViaUI(
      page,
      process.env.TEST_USER_EMAIL || 'testuser@orbital.test',
      process.env.TEST_USER_PASSWORD || 'TestPass123!'
    );
    await page.goto('/campeonatos/perfil');
    const history = page.getByText(/HIST[OÓ]RICO|PARTIDAS/i).first();
    await expect(history).toBeVisible({ timeout: 10000 });
  });
});
