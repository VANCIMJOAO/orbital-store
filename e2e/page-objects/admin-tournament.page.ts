import { Page, Locator } from '@playwright/test';

export class AdminTournamentPage {
  readonly page: Page;
  readonly tournamentList: Locator;
  readonly newButton: Locator;
  readonly nameInput: Locator;
  readonly formatSelect: Locator;
  readonly maxTeamsInput: Locator;
  readonly prizePoolInput: Locator;
  readonly submitButton: Locator;
  readonly generateBracketBtn: Locator;
  readonly deleteBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tournamentList = page.locator('table, [class*="list"]').first();
    this.newButton = page.getByText(/NOVO CAMPEONATO/i);
    this.nameInput = page.locator('#name, [name="name"]').first();
    this.formatSelect = page.locator('#format, [name="format"]').first();
    this.maxTeamsInput = page.locator('#max_teams, [name="max_teams"]').first();
    this.prizePoolInput = page.locator('#prize_pool, [name="prize_pool"]').first();
    this.submitButton = page.getByRole('button', { name: /CRIAR|SALVAR/i });
    this.generateBracketBtn = page.getByRole('button', { name: /Gerar Bracket/i });
    this.deleteBtn = page.getByRole('button', { name: /EXCLUIR|DELETAR/i });
  }

  async gotoList() {
    await this.page.goto('/admin/campeonatos');
  }

  async gotoNew() {
    await this.page.goto('/admin/campeonatos/novo');
  }

  async gotoEdit(id: string) {
    await this.page.goto(`/admin/campeonatos/${id}`);
  }
}
