import { Page } from '@playwright/test';

/** Login via UI */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/campeonatos/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /ENTRAR/i }).click();
  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

/** Wait for a toast message to appear */
export async function waitForToast(page: Page, text: string | RegExp) {
  await page.getByText(text).waitFor({ state: 'visible', timeout: 10000 });
}

/** Check if user is logged in by looking for username in header or logout button */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Look for a logout icon or user menu -- adjust selector as needed
    const logoutBtn = page.locator('[aria-label="Sair"], [title="Sair"]');
    return await logoutBtn.isVisible({ timeout: 3000 });
  } catch {
    return false;
  }
}
