import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient } from '../../helpers/supabase-client';
import { createTestUser, createTestProfile } from '../../helpers/seed';
import { cleanupUser } from '../../helpers/cleanup';

describe('Integration: Admin Update Player', () => {
  const admin = getAdminClient();
  let userId1: string;
  let userId2: string;

  beforeAll(async () => {
    const user1 = await createTestUser(`update1_${Date.now()}@test.com`, 'TestPass123!');
    userId1 = user1.id;
    await createTestProfile(userId1, { username: `update1_${Date.now()}`, steam_id: '76561198000111001' });

    const user2 = await createTestUser(`update2_${Date.now()}@test.com`, 'TestPass123!');
    userId2 = user2.id;
    await createTestProfile(userId2, { username: `update2_${Date.now()}`, steam_id: '76561198000111002' });
  });

  afterAll(async () => {
    await cleanupUser(userId1);
    await cleanupUser(userId2);
  });

  it('should update username and steam_id', async () => {
    const newUsername = `updated_${Date.now()}`;
    const { data, error } = await admin
      .from('profiles')
      .update({ username: newUsername, steam_id: '76561198000222001' })
      .eq('id', userId1)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.username).toBe(newUsername);
    expect(data!.steam_id).toBe('76561198000222001');
  });

  it('should store steam_id correctly', async () => {
    const { data } = await admin
      .from('profiles')
      .select('steam_id')
      .eq('id', userId1)
      .single();
    expect(data!.steam_id).toBeDefined();
    expect(typeof data!.steam_id).toBe('string');
  });

  it('should handle different users independently', async () => {
    const name1 = `ind1_${Date.now()}`;
    const name2 = `ind2_${Date.now()}`;
    await admin.from('profiles').update({ username: name1 }).eq('id', userId1);
    await admin.from('profiles').update({ username: name2 }).eq('id', userId2);
    const { data: d1 } = await admin.from('profiles').select('username').eq('id', userId1).single();
    const { data: d2 } = await admin.from('profiles').select('username').eq('id', userId2).single();
    expect(d1!.username).toBe(name1);
    expect(d2!.username).toBe(name2);
  });

  it('should persist updates across reads', async () => {
    const newName = `persist_${Date.now()}`;
    await admin.from('profiles').update({ username: newName }).eq('id', userId1);
    const { data } = await admin.from('profiles').select('username').eq('id', userId1).single();
    expect(data!.username).toBe(newName);
  });
});
