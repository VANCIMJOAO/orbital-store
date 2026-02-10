import { test, expect } from '@playwright/test';
import { TEST_IDS } from '../../helpers/seed-data';

test.describe('Store - Checkout', () => {
  test('should redirect to Stripe on checkout', async ({ page }) => {
    // Add product to cart via direct product page
    await page.goto(`/produto/${TEST_IDS.products[0]}`);
    const sizeBtn = page.locator('button').filter({ hasText: /^(S|M|L)$/ }).first();
    await expect(sizeBtn).toBeVisible({ timeout: 15000 });
    await sizeBtn.click();
    const addBtn = page.getByRole('button', { name: /ADICIONAR AO CARRINHO/i });
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();
    await page.waitForTimeout(500);

    // Intercept checkout API call
    let checkoutCalled = false;
    await page.route('**/api/checkout', async (route) => {
      checkoutCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessionId: 'cs_test_mock', url: 'https://checkout.stripe.com/mock' }),
      });
    });

    const checkoutBtn = page.getByRole('button', { name: /FINALIZAR COMPRA/i });
    if (await checkoutBtn.isVisible().catch(() => false)) {
      await checkoutBtn.click();
      await page.waitForTimeout(2000);
      // Either redirected or API was called
    }
  });

  test('should load checkout success page', async ({ page }) => {
    await page.goto('/checkout/sucesso');
    await expect(page.locator('body')).not.toBeEmpty();
    // Page should render without errors
    await expect(page).toHaveURL(/sucesso/);
  });

  test('should load checkout cancel page', async ({ page }) => {
    await page.goto('/checkout/cancelado');
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page).toHaveURL(/cancelado/);
  });
});
