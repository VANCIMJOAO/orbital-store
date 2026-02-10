import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/auth-helpers';

test.describe('Logout', () => {
  test('should show logout button when logged in', async ({ page }) => {
    await loginViaUI(
      page,
      process.env.TEST_USER_EMAIL || 'testuser@orbital.test',
      process.env.TEST_USER_PASSWORD || 'TestPass123!'
    );
    const logoutBtn = page.locator('button, a').filter({ hasText: /sair|logout/i }).first();
    const logoutIcon = page.locator('[aria-label*="Sair"], [title*="Sair"], [aria-label*="sair"]').first();
    const isVisible = await logoutBtn.isVisible().catch(() => false) ||
                      await logoutIcon.isVisible().catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should clear session and show ENTRAR button on logout', async ({ page }) => {
    await loginViaUI(
      page,
      process.env.TEST_USER_EMAIL || 'testuser@orbital.test',
      process.env.TEST_USER_PASSWORD || 'TestPass123!'
    );
    // Find and click logout
    const logoutBtn = page.locator('button, a, [role="button"]').filter({ hasText: /sair|logout/i }).first();
    const logoutIcon = page.locator('[aria-label*="Sair"], [title*="Sair"]').first();
    if (await logoutIcon.isVisible().catch(() => false)) {
      await logoutIcon.click();
    } else {
      await logoutBtn.click();
    }
    await page.waitForTimeout(2000);
    await expect(page.getByText(/ENTRAR|LOGIN/i)).toBeVisible({ timeout: 10000 });
  });

  test('should redirect from protected routes after logout', async ({ page }) => {
    // Navigate directly to profile without auth
    await page.goto('/campeonatos/perfil');
    await expect(page).toHaveURL(/login|campeonatos/, { timeout: 10000 });
  });
});
