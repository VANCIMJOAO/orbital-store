import { getAdminClient } from './supabase-client';
import { v4 as uuidv4 } from 'crypto';

// Use crypto.randomUUID for deterministic-ish test IDs
function testId() {
  return crypto.randomUUID();
}

export interface SeedContext {
  tournamentId: string;
  teamIds: string[];
  matchIds: string[];
  profileIds: string[];
  userEmails: string[];
}

/** Create a test user via Supabase Admin API */
export async function createTestUser(
  email: string,
  password: string,
  metadata?: Record<string, unknown>
) {
  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`);
  return data.user;
}

/** Create a profile for a user */
export async function createTestProfile(
  userId: string,
  overrides: Record<string, unknown> = {}
) {
  const admin = getAdminClient();
  const profile = {
    id: userId,
    username: `test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    steam_id: `7656119800000${Math.floor(Math.random() * 9000 + 1000)}`,
    is_admin: false,
    is_tournament_player: true,
    ...overrides,
  };
  const { data, error } = await admin.from('profiles').upsert(profile).select().single();
  if (error) throw new Error(`Failed to create profile: ${error.message}`);
  return data;
}

/** Create a test team */
export async function createTestTeam(name: string, tag: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('teams')
    .insert({ name, tag })
    .select()
    .single();
  if (error) throw new Error(`Failed to create team ${name}: ${error.message}`);
  return data;
}

/** Create a test tournament */
export async function createTestTournament(overrides: Record<string, unknown> = {}) {
  const admin = getAdminClient();
  const tournament = {
    name: `Test Tournament ${Date.now()}`,
    slug: `test-tournament-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    format: 'double_elimination',
    max_teams: 8,
    status: 'active',
    prize_pool: 1000,
    ...overrides,
  };
  const { data, error } = await admin
    .from('tournaments')
    .insert(tournament)
    .select()
    .single();
  if (error) throw new Error(`Failed to create tournament: ${error.message}`);
  return data;
}

/** Create a test match */
export async function createTestMatch(
  tournamentId: string,
  team1Id: string,
  team2Id: string,
  overrides: Record<string, unknown> = {}
) {
  const admin = getAdminClient();
  const match = {
    tournament_id: tournamentId,
    team1_id: team1Id,
    team2_id: team2Id,
    status: 'scheduled',
    round: 'winner_quarter_1',
    best_of: 1,
    ...overrides,
  };
  const { data, error } = await admin
    .from('matches')
    .insert(match)
    .select()
    .single();
  if (error) throw new Error(`Failed to create match: ${error.message}`);
  return data;
}

/** Create a player in a team */
export async function createTestTeamPlayer(
  teamId: string,
  profileId: string,
  overrides: Record<string, unknown> = {}
) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('team_players')
    .insert({
      team_id: teamId,
      profile_id: profileId,
      role: 'player',
      is_active: true,
      ...overrides,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create team player: ${error.message}`);
  return data;
}

/** Create match player stats */
export async function createTestMatchPlayerStats(
  matchId: string,
  profileId: string,
  teamId: string,
  overrides: Record<string, unknown> = {}
) {
  const admin = getAdminClient();
  const stats = {
    match_id: matchId,
    profile_id: profileId,
    team_id: teamId,
    kills: 20,
    deaths: 15,
    assists: 5,
    headshots: 10,
    total_damage: 2000,
    adr: 80.0,
    kast_percentage: 70.0,
    rating: 1.15,
    ...overrides,
  };
  const { data, error } = await admin
    .from('match_player_stats')
    .insert(stats)
    .select()
    .single();
  if (error) throw new Error(`Failed to create match player stats: ${error.message}`);
  return data;
}
