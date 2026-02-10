import { Page, Locator } from '@playwright/test';

export class MatchPage {
  readonly page: Page;
  readonly statusBadge: Locator;
  readonly team1Name: Locator;
  readonly team2Name: Locator;
  readonly scoreDisplay: Locator;
  readonly scoreboard: Locator;
  readonly vetoSection: Locator;
  readonly mapName: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statusBadge = page.locator('[class*="badge"], [class*="status"]').first();
    this.team1Name = page.locator('[class*="team"]').first();
    this.team2Name = page.locator('[class*="team"]').last();
    this.scoreDisplay = page.locator('[class*="score"]').first();
    this.scoreboard = page.getByText(/Players|K-D/i).first();
    this.vetoSection = page.getByText(/MAP VETO|VETO/i).first();
    this.mapName = page.locator('[class*="map"]').first();
  }

  async goto(matchId: string) {
    await this.page.goto(`/campeonatos/partida/${matchId}`);
  }

  getBadgeText() {
    return this.page.locator('text=/AGENDADA|FINALIZADA|AO VIVO|CANCELADA/i').first();
  }

  getPlayerRow(playerName: string) {
    return this.page.getByText(playerName).first();
  }
}
