import { getAdminClient } from './supabase-client';

/** Delete a tournament and all related data */
export async function cleanupTournament(tournamentId: string) {
  const admin = getAdminClient();

  // Get all matches for this tournament
  const { data: matches } = await admin
    .from('matches')
    .select('id')
    .eq('tournament_id', tournamentId);

  if (matches && matches.length > 0) {
    const matchIds = matches.map((m: { id: string }) => m.id);

    // Delete match-related data
    await admin.from('match_events').delete().in('match_id', matchIds);
    await admin.from('match_rounds').delete().in('match_id', matchIds);
    await admin.from('match_player_stats').delete().in('match_id', matchIds);
    await admin.from('match_maps').delete().in('match_id', matchIds);
    await admin.from('matches').delete().in('id', matchIds);
  }

  // Delete tournament_teams and tournament
  await admin.from('tournament_teams').delete().eq('tournament_id', tournamentId);
  await admin.from('tournaments').delete().eq('id', tournamentId);
}

/** Delete a team and its players */
export async function cleanupTeam(teamId: string) {
  const admin = getAdminClient();
  await admin.from('team_players').delete().eq('team_id', teamId);
  await admin.from('tournament_teams').delete().eq('team_id', teamId);
  await admin.from('teams').delete().eq('id', teamId);
}

/** Delete a test user and their profile */
export async function cleanupUser(userId: string) {
  const admin = getAdminClient();
  await admin.from('team_players').delete().eq('profile_id', userId);
  await admin.from('profiles').delete().eq('id', userId);
  await admin.auth.admin.deleteUser(userId);
}

/** Delete products and variants by product IDs */
export async function cleanupProducts(productIds: string[]) {
  const admin = getAdminClient();
  await admin.from('product_variants').delete().in('product_id', productIds);
  await admin.from('products').delete().in('id', productIds);
}
