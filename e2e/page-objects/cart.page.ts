import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartDrawer: Locator;
  readonly emptyMessage: Locator;
  readonly cartItems: Locator;
  readonly totalLabel: Locator;
  readonly checkoutButton: Locator;
  readonly clearButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartDrawer = page.getByText('CARRINHO');
    this.emptyMessage = page.getByText(/Carrinho vazio/i);
    this.cartItems = page.locator('[class*="cart-item"], [class*="CartItem"]');
    this.totalLabel = page.getByText('TOTAL');
    this.checkoutButton = page.getByRole('button', { name: /FINALIZAR COMPRA/i });
    this.clearButton = page.getByText(/LIMPAR CARRINHO/i);
  }

  getItemQuantityPlus(index: number) {
    return this.cartItems.nth(index).getByRole('button', { name: '+' });
  }

  getItemQuantityMinus(index: number) {
    return this.cartItems.nth(index).getByRole('button', { name: '-' });
  }

  getItemRemoveButton(index: number) {
    return this.cartItems.nth(index).locator('[aria-label*="remover"], button:has(svg)').last();
  }
}
