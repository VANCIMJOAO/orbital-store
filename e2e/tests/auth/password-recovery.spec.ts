import { test, expect } from '@playwright/test';

test.describe('Password Recovery', () => {
  test('should navigate from login "Esqueceu a senha?"', async ({ page }) => {
    await page.goto('/campeonatos/login');
    await page.getByText('Esqueceu a senha?').click();
    await expect(page).toHaveURL(/recuperar-senha/);
  });

  test('should accept email and show success message', async ({ page }) => {
    await page.goto('/campeonatos/recuperar-senha');
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('testuser@orbital.test');
    // Button text is "ENVIAR LINK"
    await page.getByRole('button', { name: /ENVIAR LINK|ENVIAR|RECUPERAR/i }).click();
    // After submit: shows "EMAIL ENVIADO!" or toast "Email de recuperacao enviado"
    // In local Supabase, email might not be sent but Supabase still returns success
    await expect(
      page.getByText(/EMAIL ENVIADO|email.*enviado|verifique|sucesso/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should load nova-senha page with password fields', async ({ page }) => {
    await page.goto('/campeonatos/nova-senha');
    await expect(page.locator('#password, input[type="password"]').first()).toBeVisible({ timeout: 10000 });
  });
});
