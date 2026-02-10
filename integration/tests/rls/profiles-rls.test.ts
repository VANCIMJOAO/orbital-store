import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient, getAnonClient, getAuthenticatedClient } from '../../helpers/supabase-client';
import { createTestUser, createTestProfile } from '../../helpers/seed';
import { cleanupUser } from '../../helpers/cleanup';

describe('Integration: Profiles RLS', () => {
  const admin = getAdminClient();
  let userId1: string;
  let userId2: string;
  const email1 = `rls_p1_${Date.now()}@test.com`;
  const email2 = `rls_p2_${Date.now()}@test.com`;
  const password = 'TestPass123!';

  beforeAll(async () => {
    const user1 = await createTestUser(email1, password);
    userId1 = user1.id;
    await createTestProfile(userId1, { username: `rls_p1_${Date.now()}` });

    const user2 = await createTestUser(email2, password);
    userId2 = user2.id;
    await createTestProfile(userId2, { username: `rls_p2_${Date.now()}` });
  });

  afterAll(async () => {
    await cleanupUser(userId1);
    await cleanupUser(userId2);
  });

  it('should allow anon to read profiles (public SELECT)', async () => {
    const anon = getAnonClient();
    const { data, error } = await anon
      .from('profiles')
      .select('id, username')
      .eq('id', userId1)
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.username).toBeDefined();
  });

  it('should allow user to update own profile', async () => {
    const client = await getAuthenticatedClient(email1, password);
    const newDiscord = `discord_${Date.now()}`;
    const { error } = await client
      .from('profiles')
      .update({ discord_id: newDiscord })
      .eq('id', userId1);
    expect(error).toBeNull();

    // Verify update
    const { data } = await admin
      .from('profiles')
      .select('discord_id')
      .eq('id', userId1)
      .single();
    expect(data!.discord_id).toBe(newDiscord);
  });

  it('should NOT allow user to update another user profile', async () => {
    const client = await getAuthenticatedClient(email1, password);
    const { error, count } = await client
      .from('profiles')
      .update({ discord_id: 'hacked' })
      .eq('id', userId2);
    // RLS should prevent this - either error or 0 rows affected
    // Supabase returns no error but no rows affected
    const { data } = await admin
      .from('profiles')
      .select('discord_id')
      .eq('id', userId2)
      .single();
    expect(data!.discord_id).not.toBe('hacked');
  });

  it('should NOT allow anon to insert profiles', async () => {
    const anon = getAnonClient();
    const { error } = await anon
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-999999999999',
        username: 'anon_hack',
      });
    expect(error).not.toBeNull();
  });
});
