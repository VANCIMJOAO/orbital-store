import { Page, Locator } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly username: Locator;
  readonly statsCards: Locator;
  readonly matchHistory: Locator;
  readonly editButton: Locator;
  readonly adminButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.username = page.locator('h1, h2').first();
    this.statsCards = page.locator('[class*="stat"], [class*="card"]');
    this.matchHistory = page.getByText(/HIST[OÓ]RICO DE PARTIDAS/i);
    this.editButton = page.getByRole('button', { name: /EDITAR PERFIL/i });
    this.adminButton = page.getByText('PAINEL ADMIN');
  }

  async gotoOwn() {
    await this.page.goto('/campeonatos/perfil');
  }

  async gotoPublic(profileId: string) {
    await this.page.goto(`/campeonatos/jogador/${profileId}`);
  }

  getStatCard(label: string) {
    return this.page.getByText(label);
  }
}
