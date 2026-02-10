import { Page, Locator } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly sizeSelector: Locator;
  readonly quantityMinus: Locator;
  readonly quantityPlus: Locator;
  readonly quantityValue: Locator;
  readonly addToCartButton: Locator;
  readonly imageGallery: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.locator('h1').first();
    this.productPrice = page.getByText(/R\$/).first();
    this.sizeSelector = page.locator('select, [role="combobox"]').first();
    this.quantityMinus = page.getByRole('button', { name: '-' }).first();
    this.quantityPlus = page.getByRole('button', { name: '+' }).first();
    this.quantityValue = page.locator('input[type="number"], [class*="quantity"]').first();
    this.addToCartButton = page.getByRole('button', { name: /ADICIONAR|ADD/i });
    this.imageGallery = page.locator('[class*="gallery"], [class*="image"]').first();
  }

  async goto(productId: string) {
    await this.page.goto(`/produto/${productId}`);
  }

  async selectSize(size: string) {
    // Try select dropdown first, then buttons
    const select = this.page.locator('select').first();
    if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
      await select.selectOption(size);
    } else {
      await this.page.getByRole('button', { name: size }).click();
    }
  }
}
