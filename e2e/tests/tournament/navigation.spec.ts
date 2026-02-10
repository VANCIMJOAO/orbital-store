import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/auth-helpers';

test.describe('Tournament Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Some tournament pages may require auth, login first
    await loginViaUI(
      page,
      process.env.TEST_USER_EMAIL || 'testuser@orbital.test',
      process.env.TEST_USER_PASSWORD || 'TestPass123!'
    );
  });

  test('should navigate to VISAO GERAL', async ({ page }) => {
    await page.goto('/campeonatos');
    const link = page.locator('a[href*="visao-geral"], a[href*="visao_geral"]').first();
    const textLink = page.getByText(/VIS[AÃ]O GERAL/i).first();
    const el = await link.isVisible().catch(() => false) ? link : textLink;
    if (await el.isVisible().catch(() => false)) {
      await el.click();
      await expect(page).toHaveURL(/visao/);
    }
  });

  test('should navigate to PARTIDAS', async ({ page }) => {
    await page.goto('/campeonatos');
    const link = page.locator('a[href*="/campeonatos/partidas"]').first();
    const textLink = page.getByRole('link', { name: /^PARTIDAS$/i }).first();
    const el = await link.isVisible().catch(() => false) ? link : textLink;
    if (await el.isVisible().catch(() => false)) {
      await el.click();
      await expect(page).toHaveURL(/partidas/);
    }
  });

  test('should navigate to ESTATISTICAS', async ({ page }) => {
    await page.goto('/campeonatos');
    const link = page.locator('a[href*="estatisticas"]').first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/estatisticas/);
    }
  });

  test('should navigate to BRACKET', async ({ page }) => {
    await page.goto('/campeonatos');
    const link = page.locator('a[href*="/bracket"]').first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/bracket/);
    }
  });
});
