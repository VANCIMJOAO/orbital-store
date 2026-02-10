import { Page, Locator } from '@playwright/test';

export class AdminDashboardPage {
  readonly page: Page;
  readonly title: Locator;
  readonly statsCards: Locator;
  readonly campeonatosCard: Locator;
  readonly timesCard: Locator;
  readonly jogadoresCard: Locator;
  readonly partidasCard: Locator;
  readonly newTournamentBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByText('Dashboard');
    this.statsCards = page.locator('[class*="card"], [class*="stat"]');
    this.campeonatosCard = page.getByText('CAMPEONATOS');
    this.timesCard = page.getByText('TIMES');
    this.jogadoresCard = page.getByText('JOGADORES');
    this.partidasCard = page.getByText('PARTIDAS');
    this.newTournamentBtn = page.getByText('Novo Campeonato');
  }

  async goto() {
    await this.page.goto('/admin');
  }

  getSidebarLink(text: string) {
    return this.page.getByRole('link', { name: new RegExp(text, 'i') });
  }
}
