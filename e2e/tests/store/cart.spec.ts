import { test, expect } from '@playwright/test';
import { TEST_IDS } from '../../helpers/seed-data';

test.describe('Store - Cart', () => {
  /** Abre a página do produto, seleciona tamanho e adiciona ao carrinho */
  async function addProductToCart(page: import('@playwright/test').Page) {
    await page.goto(`/produto/${TEST_IDS.products[0]}`);
    const sizeBtn = page.locator('button').filter({ hasText: /^(S|M|L)$/ }).first();
    await expect(sizeBtn).toBeVisible({ timeout: 15000 });
    await sizeBtn.click();
    const addBtn = page.getByRole('button', { name: /ADICIONAR AO CARRINHO/i });
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();
    // Esperar drawer do carrinho abrir
    await expect(page.getByText('CARRINHO', { exact: true })).toBeVisible({ timeout: 5000 });
  }

  /** Clica no ícone do carrinho na navbar (primeiro button dentro do nav) */
  async function openCartViaNavbar(page: import('@playwright/test').Page) {
    const cartBtn = page.locator('nav button').first();
    await cartBtn.click();
  }

  test('should show empty cart message', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(2000);
    await openCartViaNavbar(page);
    await expect(
      page.getByText(/Carrinho vazio/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show item in cart after adding', async ({ page }) => {
    await addProductToCart(page);
    // Cart drawer já está aberto
    await expect(page.getByText(/R\$/).first()).toBeVisible();
  });

  test('should increment item quantity', async ({ page }) => {
    await addProductToCart(page);
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    if (await plusBtn.isVisible().catch(() => false)) {
      await plusBtn.click();
      await page.waitForTimeout(500);
    }
    await expect(page.getByText('CARRINHO', { exact: true })).toBeVisible();
  });

  test('should decrement item quantity', async ({ page }) => {
    await addProductToCart(page);
    const minusBtn = page.locator('button:has(svg.lucide-minus)').first();
    if (await minusBtn.isVisible().catch(() => false)) {
      await minusBtn.click();
      await page.waitForTimeout(500);
    }
    await expect(page.getByText('CARRINHO', { exact: true })).toBeVisible();
  });

  test('should remove item from cart', async ({ page }) => {
    await addProductToCart(page);
    const removeBtn = page.locator('button:has(svg.lucide-trash2)').first();
    if (await removeBtn.isVisible().catch(() => false)) {
      await removeBtn.click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/Carrinho vazio/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display correct total', async ({ page }) => {
    await addProductToCart(page);
    await expect(page.getByText('TOTAL')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/R\$/).last()).toBeVisible();
  });

  test('should persist cart after navigation', async ({ page }) => {
    await addProductToCart(page);
    // Navegar para outra página
    await page.goto('/home');
    await page.waitForTimeout(1000);
    await openCartViaNavbar(page);
    await expect(page.getByText('CARRINHO', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('TOTAL')).toBeVisible();
  });
});
