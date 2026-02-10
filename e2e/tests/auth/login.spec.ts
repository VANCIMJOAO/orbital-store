import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/login.page';

test.describe('Login - /campeonatos/login', () => {
  let login: LoginPage;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.goto();
  });

  test('should load login page with form fields', async () => {
    await expect(login.emailInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.submitButton).toBeVisible();
    await expect(login.forgotPasswordLink).toBeVisible();
  });

  test('should not submit empty form', async ({ page }) => {
    await login.submitButton.click();
    // Should stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should show error toast on wrong password', async ({ page }) => {
    await login.login('testuser@orbital.test', 'wrongpassword');
    await expect(
      page.getByText(/incorretos|inv[aá]lid|erro/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should redirect to /campeonatos on successful login', async ({ page }) => {
    await login.login(
      process.env.TEST_USER_EMAIL || 'testuser@orbital.test',
      process.env.TEST_USER_PASSWORD || 'TestPass123!'
    );
    await login.waitForRedirect();
    await expect(page).toHaveURL(/campeonatos/);
  });

  test('should show username in header after login', async ({ page }) => {
    await login.login(
      process.env.TEST_USER_EMAIL || 'testuser@orbital.test',
      process.env.TEST_USER_PASSWORD || 'TestPass123!'
    );
    await login.waitForRedirect();
    await expect(page.getByText(/testplayer/i)).toBeVisible({ timeout: 10000 });
  });

  test('should have link to registration page', async ({ page }) => {
    await login.signupLink.click();
    await expect(page).toHaveURL(/cadastro/);
  });
});
