import { Page, Locator } from '@playwright/test';

export class AdminPlayersPage {
  readonly page: Page;
  readonly playerList: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.playerList = page.locator('table, [class*="list"]').first();
    this.searchInput = page.locator('input[type="text"], input[placeholder*="Buscar"]').first();
  }

  async goto() {
    await this.page.goto('/admin/jogadores');
  }

  getPlayerRow(username: string) {
    return this.page.getByText(username).first();
  }

  getEditButton(username: string) {
    return this.page.getByText(username).locator('..').getByRole('button').first();
  }

  getToggleAdminButton() {
    return this.page.getByRole('button', { name: /admin/i });
  }
}
