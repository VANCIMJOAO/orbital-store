import { Page, Locator } from '@playwright/test';

export class CadastroPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly steamIdInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.emailInput = page.locator('#email');
    this.steamIdInput = page.locator('#steamId');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#confirmPassword');
    this.submitButton = page.getByRole('button', { name: /CRIAR CONTA/i });
    this.loginLink = page.getByText('Entrar');
  }

  async goto() {
    await this.page.goto('/campeonatos/cadastro');
  }

  async fillForm(data: {
    username: string;
    email: string;
    steamId: string;
    password: string;
    confirmPassword: string;
  }) {
    await this.usernameInput.fill(data.username);
    await this.emailInput.fill(data.email);
    await this.steamIdInput.fill(data.steamId);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
  }
}
