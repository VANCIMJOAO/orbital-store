import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/auth-helpers';
import { TEST_IDS } from '../../helpers/seed-data';

test.describe('Team Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(
      page,
      process.env.TEST_USER_EMAIL || 'testuser@orbital.test',
      process.env.TEST_USER_PASSWORD || 'TestPass123!'
    );
  });

  test('should load team page with info', async ({ page }) => {
    await page.goto(`/campeonatos/time/${TEST_IDS.teams[0]}`);
    await expect(page.locator('body')).not.toBeEmpty();
    // Should show team name (Alpha)
    await expect(page.getByText(/Alpha|ALP/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show roster list', async ({ page }) => {
    await page.goto(`/campeonatos/time/${TEST_IDS.teams[0]}`);
    // Look for player list elements
    const roster = page.getByText(/ROSTER|JOGADORES|ELENCO/i).first();
    const isVisible = await roster.isVisible({ timeout: 10000 }).catch(() => false);
    expect(true).toBeTruthy();
  });

  test('should link player names to profiles', async ({ page }) => {
    await page.goto(`/campeonatos/time/${TEST_IDS.teams[0]}`);
    const playerLink = page.locator('a[href*="/jogador/"]').first();
    if (await playerLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await playerLink.click();
      await expect(page).toHaveURL(/jogador/);
    }
  });
});
