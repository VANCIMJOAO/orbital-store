import { Page, Locator } from '@playwright/test';

export class AdminMatchPage {
  readonly page: Page;
  readonly statusBadge: Locator;
  readonly startButton: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;
  readonly vetoSection: Locator;
  readonly vetoGrid: Locator;
  readonly resetVetoBtn: Locator;
  readonly loadServerBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statusBadge = page.locator('[class*="badge"], [class*="status"]').first();
    this.startButton = page.getByRole('button', { name: /INICIAR PARTIDA/i });
    this.finishButton = page.getByRole('button', { name: /FINALIZAR PARTIDA/i });
    this.cancelButton = page.getByRole('button', { name: /CANCELAR PARTIDA/i });
    this.vetoSection = page.getByText('MAP VETO');
    this.vetoGrid = page.locator('[class*="grid"]').filter({ hasText: /de_/ });
    this.resetVetoBtn = page.getByRole('button', { name: /RESETAR/i });
    this.loadServerBtn = page.getByRole('button', { name: /RECARREGAR NO SERVIDOR/i });
  }

  async goto(matchId: string) {
    await this.page.goto(`/admin/partidas/${matchId}`);
  }

  async gotoList() {
    await this.page.goto('/admin/partidas');
  }

  getMapButton(mapName: string) {
    return this.page.getByText(mapName).first();
  }

  getScoreInput(team: 'team1' | 'team2') {
    const inputs = this.page.locator('input[type="number"]');
    return team === 'team1' ? inputs.first() : inputs.last();
  }

  getFinishModalConfirm() {
    return this.page.getByRole('button', { name: /CONFIRMAR/i });
  }

  getFinishModalCancel() {
    return this.page.getByRole('button', { name: /CANCELAR/i }).last();
  }
}
