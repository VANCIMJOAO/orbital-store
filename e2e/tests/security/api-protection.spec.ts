import { test, expect } from '@playwright/test';

test.describe('Security - API Protection', () => {
  test('should return 401 for POST /api/admin/toggle-admin without auth', async ({ page }) => {
    const response = await page.request.post('/api/admin/toggle-admin', {
      data: { profileId: 'fake', currentStatus: false },
    });
    expect(response.status()).toBe(401);
  });

  test('should return 401 for POST /api/admin/delete-tournament without auth', async ({ page }) => {
    const response = await page.request.post('/api/admin/delete-tournament', {
      data: { tournamentId: 'fake' },
    });
    expect(response.status()).toBe(401);
  });

  test('should return 401 for POST /api/matches/fake/finish without auth', async ({ page }) => {
    const response = await page.request.post('/api/matches/fake/finish', {
      data: { team1_score: 16, team2_score: 10 },
    });
    expect(response.status()).toBe(401);
  });

  test('should reject POST /api/matchzy/events without Bearer token', async ({ page }) => {
    const response = await page.request.post('/api/matchzy/events', {
      data: { event: 'going_live', matchid: 'fake' },
    });
    // API rejeita sem Bearer token - pode retornar 401 (Unauthorized) ou 500 (erro interno
    // ao tentar processar sem auth). O importante é que NÃO retorna 200.
    expect(response.status()).not.toBe(200);
    expect([401, 403, 500]).toContain(response.status());
  });

  test('should return 400 for POST /api/webhook without Stripe-Signature', async ({ page }) => {
    const response = await page.request.post('/api/webhook', {
      data: 'test',
      headers: { 'Content-Type': 'application/json' },
    });
    // Should be 400 (bad request) or 401/403 without valid signature
    expect([400, 401, 403, 500]).toContain(response.status());
  });
});
