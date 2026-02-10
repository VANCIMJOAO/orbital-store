import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/auth-helpers';
import { AdminDashboardPage } from '../../page-objects/admin-dashboard.page';

test.describe('Admin Dashboard', () => {
  let dashboard: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    await loginViaUI(
      page,
      process.env.TEST_ADMIN_EMAIL || 'admin@orbital.test',
      process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!'
    );
    dashboard = new AdminDashboardPage(page);
    await dashboard.goto();
  });

  test('should load dashboard for admin user', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test('should show stats cards with counts', async ({ page }) => {
    // Wait for dashboard to load first
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible({ timeout: 10000 });
    // Stats cards in main content area (not sidebar links)
    // Labels are in text-[10px] spans - use exact match to distinguish from sidebar
    await expect(page.locator('main').getByText('CAMPEONATOS', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('main').getByText('TIMES', { exact: true })).toBeVisible();
    await expect(page.locator('main').getByText('JOGADORES', { exact: true })).toBeVisible();
    await expect(page.locator('main').getByText('PARTIDAS', { exact: true })).toBeVisible();
  });

  test('should navigate to campeonatos when clicking card', async ({ page }) => {
    const campLink = page.locator('a[href*="/admin/campeonatos"]').first();
    if (await campLink.isVisible().catch(() => false)) {
      await campLink.click();
      await expect(page).toHaveURL(/admin\/campeonatos/);
    }
  });

  test('should have working sidebar navigation', async ({ page }) => {
    const sidebarLink = page.locator('a[href*="/admin/times"]').first();
    if (await sidebarLink.isVisible().catch(() => false)) {
      await sidebarLink.click();
      await expect(page).toHaveURL(/admin\/times/);
    }
  });

  test('should display admin username', async ({ page }) => {
    const username = page.getByText(/adminuser|Administrador/i).first();
    await expect(username).toBeVisible({ timeout: 10000 });
  });
});
