import { Page, Locator } from '@playwright/test';

export class StorePage {
  readonly page: Page;
  readonly logo: Locator;
  readonly navLinks: { drops: Locator; loja: Locator; manifesto: Locator; discord: Locator };
  readonly cartIcon: Locator;
  readonly productGrid: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.getByText('OR').first();
    this.navLinks = {
      drops: page.getByText('DROPS'),
      loja: page.getByText('LOJA'),
      manifesto: page.getByText('MANIFESTO'),
      discord: page.getByText('DISCORD'),
    };
    this.cartIcon = page.locator('[aria-label*="cart"], [aria-label*="carrinho"]').first();
    this.productGrid = page.locator('section, div').filter({ hasText: /R\$/ }).first();
    this.productCards = page.locator('a[href*="/produto/"]');
  }

  async goto() {
    await this.page.goto('/home');
  }

  getProductByName(name: string) {
    return this.page.getByText(name).first();
  }
}
