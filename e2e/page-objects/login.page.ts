import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signupLink: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.getByRole('button', { name: /ENTRAR/i });
    this.forgotPasswordLink = page.getByText('Esqueceu a senha?');
    this.signupLink = page.getByText('Cadastre-se');
    this.logo = page.getByText('ORBITAL ROXA');
  }

  async goto() {
    await this.page.goto('/campeonatos/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForRedirect() {
    await this.page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  }
}
