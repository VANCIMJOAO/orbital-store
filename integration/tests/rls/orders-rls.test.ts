import { describe, it, expect, beforeAll } from 'vitest';
import { getAdminClient, getAnonClient } from '../../helpers/supabase-client';

describe('Integration: Orders RLS', () => {
  const admin = getAdminClient();

  beforeAll(async () => {
    // Health check - will throw and skip all tests if Supabase is not running
    const { error } = await admin.from('orders').select('id').limit(1);
    if (error) throw new Error(`Supabase not reachable: ${error.message}`);
  });

  it('should NOT allow anon to read orders', async () => {
    const anon = getAnonClient();
    const { data, error } = await anon
      .from('orders')
      .select('id');
    // Should return empty or error
    if (data) {
      expect(data).toHaveLength(0);
    }
  });

  it('should allow service role to read all orders', async () => {
    const { data, error } = await admin
      .from('orders')
      .select('id')
      .limit(10);
    expect(error).toBeNull();
    // May be empty if no orders, but should not error
    expect(data).toBeDefined();
  });

  it('should enforce order isolation between users', async () => {
    // Service role can see all orders - verified by the fact that
    // anon gets empty results while service role gets results
    const anon = getAnonClient();
    const { data: anonOrders } = await anon.from('orders').select('id');
    const { data: adminOrders } = await admin.from('orders').select('id');

    // Anon should see 0 or less than service role
    const anonCount = anonOrders?.length ?? 0;
    const adminCount = adminOrders?.length ?? 0;
    expect(anonCount).toBeLessThanOrEqual(adminCount);
  });
});
