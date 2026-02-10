import { Page, Locator } from '@playwright/test';

export class BracketPage {
  readonly page: Page;
  readonly title: Locator;
  readonly bracketContainer: Locator;
  readonly doubleEliminationBadge: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByText('BRACKET');
    this.bracketContainer = page.locator('[class*="bracket"], [class*="tournament"]').first();
    this.doubleEliminationBadge = page.getByText('DOUBLE ELIMINATION');
    this.loadingSpinner = page.getByText('Carregando bracket...');
    this.emptyState = page.getByText('Nenhuma partida encontrada');
  }

  async goto() {
    await this.page.goto('/campeonatos/bracket');
  }

  getMatchSlots() {
    return this.page.locator('[class*="match"], [class*="slot"]');
  }

  getClickableMatch(index: number) {
    return this.page.locator('a[href*="/partida/"]').nth(index);
  }
}
