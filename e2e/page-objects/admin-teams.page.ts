import { Page, Locator } from '@playwright/test';

export class AdminTeamsPage {
  readonly page: Page;
  readonly teamList: Locator;
  readonly searchInput: Locator;
  readonly roster: Locator;
  readonly addPlayerBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.teamList = page.locator('table, [class*="list"]').first();
    this.searchInput = page.locator('input[type="text"], input[placeholder*="Buscar"]').first();
    this.roster = page.locator('[class*="roster"], [class*="player"]');
    this.addPlayerBtn = page.getByRole('button', { name: /ADICIONAR/i });
  }

  async gotoList() {
    await this.page.goto('/admin/times');
  }

  async gotoEdit(id: string) {
    await this.page.goto(`/admin/times/${id}`);
  }
}
