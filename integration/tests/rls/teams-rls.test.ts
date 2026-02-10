import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient, getAnonClient } from '../../helpers/supabase-client';
import { createTestTeam } from '../../helpers/seed';
import { cleanupTeam } from '../../helpers/cleanup';

describe('Integration: Teams RLS', () => {
  const admin = getAdminClient();
  let teamId: string;

  beforeAll(async () => {
    const team = await createTestTeam('RLS Team Test', 'RTT');
    teamId = team.id;
  });

  afterAll(async () => {
    await cleanupTeam(teamId);
  });

  it('should allow anon to read teams', async () => {
    const anon = getAnonClient();
    const { data, error } = await anon
      .from('teams')
      .select('id, name, tag')
      .eq('id', teamId)
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.name).toBe('RLS Team Test');
  });

  it('should NOT allow anon to insert teams', async () => {
    const anon = getAnonClient();
    const { error } = await anon
      .from('teams')
      .insert({ name: 'Anon Hack Team', tag: 'AHT' });
    expect(error).not.toBeNull();
  });

  it('should NOT allow anon to delete teams', async () => {
    const anon = getAnonClient();
    const { error } = await anon
      .from('teams')
      .delete()
      .eq('id', teamId);
    // Verify team still exists
    const { data } = await admin
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .single();
    expect(data).not.toBeNull();
  });
});
