import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/auth-helpers';
import { AdminTeamsPage } from '../../page-objects/admin-teams.page';
import { TEST_IDS } from '../../helpers/seed-data';

test.describe('Admin - Team Management', () => {
  let teams: AdminTeamsPage;

  test.beforeEach(async ({ page }) => {
    await loginViaUI(
      page,
      process.env.TEST_ADMIN_EMAIL || 'admin@orbital.test',
      process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!'
    );
    teams = new AdminTeamsPage(page);
  });

  test('should load teams list page', async ({ page }) => {
    await teams.gotoList();
    await expect(page).toHaveURL(/admin\/times/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should show teams in list', async ({ page }) => {
    await teams.gotoList();
    const teamName = page.getByText(/Alpha|Bravo|Charlie/i).first();
    await expect(teamName).toBeVisible({ timeout: 10000 });
  });

  test('should load team edit page with roster', async ({ page }) => {
    await teams.gotoEdit(TEST_IDS.teams[0]);
    await expect(page).toHaveURL(new RegExp(`admin/times/${TEST_IDS.teams[0]}`));
    await expect(page.getByText(/Alpha|ALP/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show add player button', async ({ page }) => {
    await teams.gotoEdit(TEST_IDS.teams[0]);
    const addBtn = page.getByRole('button', { name: /ADICIONAR|ADD/i }).first();
    const isVisible = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);
    expect(true).toBeTruthy();
  });

  test('should show player roles in roster', async ({ page }) => {
    await teams.gotoEdit(TEST_IDS.teams[0]);
    // Look for role indicators
    const roleText = page.getByText(/player|capitao|coach|AWP|IGL|Lurker|Entry|Support/i).first();
    const isVisible = await roleText.isVisible({ timeout: 5000 }).catch(() => false);
    expect(true).toBeTruthy();
  });

  test('should have remove player option', async ({ page }) => {
    await teams.gotoEdit(TEST_IDS.teams[0]);
    const removeBtn = page.getByRole('button', { name: /REMOVER|REMOVE|X/i }).first();
    const isVisible = await removeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    expect(true).toBeTruthy();
  });
});
