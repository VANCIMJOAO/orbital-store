import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient } from '../../helpers/supabase-client';
import { createTestUser, createTestProfile } from '../../helpers/seed';
import { cleanupUser } from '../../helpers/cleanup';

describe('Integration: Admin Toggle', () => {
  const admin = getAdminClient();
  let userId: string;

  beforeAll(async () => {
    const user = await createTestUser(`toggle_${Date.now()}@test.com`, 'TestPass123!');
    userId = user.id;
    await createTestProfile(userId, { username: `toggle_${Date.now()}`, is_admin: false });
  });

  afterAll(async () => {
    await cleanupUser(userId);
  });

  it('should toggle admin status on for regular user', async () => {
    const { data, error } = await admin
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userId)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.is_admin).toBe(true);
  });

  it('should toggle admin status back off', async () => {
    const { data, error } = await admin
      .from('profiles')
      .update({ is_admin: false })
      .eq('id', userId)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.is_admin).toBe(false);
  });

  it('should persist admin change', async () => {
    await admin.from('profiles').update({ is_admin: true }).eq('id', userId);
    const { data } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    expect(data!.is_admin).toBe(true);
  });
});
