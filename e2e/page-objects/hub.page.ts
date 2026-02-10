import { Page, Locator } from '@playwright/test';

export class HubPage {
  readonly page: Page;
  readonly tournamentName: Locator;
  readonly statusBracketSection: Locator;
  readonly topPlayersSection: Locator;
  readonly prizeSection: Locator;
  readonly bracketProgressSection: Locator;
  readonly matchTabs: { live: Locator; next: Locator; results: Locator };
  readonly viewBracketLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tournamentName = page.getByRole('heading').first();
    this.statusBracketSection = page.getByText('STATUS NO BRACKET');
    this.topPlayersSection = page.getByText('TOP PLAYERS');
    this.prizeSection = page.getByText('PREMIACAO');
    this.bracketProgressSection = page.getByText('PROGRESSO DO BRACKET');
    this.matchTabs = {
      live: page.getByRole('button', { name: /AO VIVO/i }),
      next: page.getByRole('button', { name: /PR[OÓ]XIMAS/i }),
      results: page.getByRole('button', { name: /RESULTADOS/i }),
    };
    this.viewBracketLink = page.getByText(/VER BRACKET COMPLETO/i);
  }

  async goto() {
    await this.page.goto('/campeonatos');
  }

  getStatCard(label: string) {
    return this.page.getByText(label);
  }

  getMatchCard(index: number) {
    return this.page.locator('[class*="match-card"], a[href*="/partida/"]').nth(index);
  }
}
