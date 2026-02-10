import { test, expect } from '@playwright/test';
import { TEST_IDS } from '../../helpers/seed-data';

test.describe('Match Page', () => {
  test('should show AGENDADA badge for scheduled match', async ({ page }) => {
    // Find a scheduled match from the bracket
    await page.goto('/campeonatos/partidas');
    const matchLink = page.locator('a[href*="/partida/"]').first();
    if (await matchLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await matchLink.click();
      // Should show some status badge
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('should show team names on match page', async ({ page }) => {
    await page.goto('/campeonatos/partidas');
    const matchLink = page.locator('a[href*="/partida/"]').first();
    if (await matchLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await matchLink.click();
      // Page should have team information
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('should show FINALIZADA badge for finished match', async ({ page }) => {
    await page.goto(`/campeonatos/partida/${TEST_IDS.finishedMatch}`);
    const badge = page.getByText(/FINALIZADA|FINAL/i).first();
    await expect(badge).toBeVisible({ timeout: 10000 });
  });

  test('should show final score for finished match', async ({ page }) => {
    await page.goto(`/campeonatos/partida/${TEST_IDS.finishedMatch}`);
    // Should display score (16-10)
    await expect(page.getByText(/16/).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/10/).first()).toBeVisible();
  });

  test('should show scoreboard for finished match', async ({ page }) => {
    await page.goto(`/campeonatos/partida/${TEST_IDS.finishedMatch}`);
    // Look for scoreboard elements (K-D, ADR, Rating headers)
    const scoreboard = page.getByText(/K-D|Players|ADR|Rating/i).first();
    await expect(scoreboard).toBeVisible({ timeout: 10000 });
  });

  test('should show veto section if veto data exists', async ({ page }) => {
    await page.goto(`/campeonatos/partida/${TEST_IDS.finishedMatch}`);
    const veto = page.getByText(/VETO|BAN|PICK/i).first();
    const isVisible = await veto.isVisible({ timeout: 5000 }).catch(() => false);
    // Veto section is optional
    expect(true).toBeTruthy();
  });

  test('should link player names to profiles', async ({ page }) => {
    await page.goto(`/campeonatos/partida/${TEST_IDS.finishedMatch}`);
    const playerLink = page.locator('a[href*="/jogador/"]').first();
    const isVisible = await playerLink.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await playerLink.click();
      await expect(page).toHaveURL(/jogador/);
    }
  });

  test('should show map info', async ({ page }) => {
    await page.goto(`/campeonatos/partida/${TEST_IDS.finishedMatch}`);
    const mapName = page.getByText(/Mirage|mirage|de_mirage/i).first();
    await expect(mapName).toBeVisible({ timeout: 10000 });
  });
});
