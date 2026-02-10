import { createClient } from '@supabase/supabase-js';

// Deterministic UUIDs for test data
export const TEST_IDS = {
  tournament: '11111111-1111-1111-1111-111111111111',
  teams: [
    '22222222-0001-0001-0001-000000000001',
    '22222222-0001-0001-0001-000000000002',
    '22222222-0001-0001-0001-000000000003',
    '22222222-0001-0001-0001-000000000004',
    '22222222-0001-0001-0001-000000000005',
    '22222222-0001-0001-0001-000000000006',
    '22222222-0001-0001-0001-000000000007',
    '22222222-0001-0001-0001-000000000008',
  ],
  finishedMatch: '33333333-0001-0001-0001-000000000001',
  liveMatch: '33333333-0001-0001-0001-000000000002',
  products: [
    '44444444-0001-0001-0001-000000000001',
    '44444444-0001-0001-0001-000000000002',
    '44444444-0001-0001-0001-000000000003',
  ],
  drop: '55555555-0001-0001-0001-000000000001',
};

export const TEAM_NAMES = [
  { name: 'Team Alpha', tag: 'ALP' },
  { name: 'Team Bravo', tag: 'BRV' },
  { name: 'Team Charlie', tag: 'CHL' },
  { name: 'Team Delta', tag: 'DLT' },
  { name: 'Team Echo', tag: 'ECH' },
  { name: 'Team Foxtrot', tag: 'FOX' },
  { name: 'Team Golf', tag: 'GLF' },
  { name: 'Team Hotel', tag: 'HTL' },
];

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Seed all test data - call in global-setup */
export async function seedAllData() {
  const supabase = getAdminClient();

  // 1. Create test users
  const testUserEmail = process.env.TEST_USER_EMAIL || 'testuser@orbital.test';
  const testAdminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@orbital.test';

  let testUserId: string;
  let adminUserId: string;

  // Create test user
  const { data: user1, error: err1 } = await supabase.auth.admin.createUser({
    email: testUserEmail,
    password: process.env.TEST_USER_PASSWORD || 'TestPass123!',
    email_confirm: true,
  });
  if (err1 || !user1.user) {
    console.warn('[Seed] Test user create failed, looking up existing:', err1?.message);
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users?.users?.find((u: { email?: string }) => u.email === testUserEmail);
    if (!existing) throw new Error(`Cannot find or create test user ${testUserEmail}`);
    testUserId = existing.id;
  } else {
    testUserId = user1.user.id;
  }

  // Create admin user
  const { data: user2, error: err2 } = await supabase.auth.admin.createUser({
    email: testAdminEmail,
    password: process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!',
    email_confirm: true,
  });
  if (err2 || !user2.user) {
    console.warn('[Seed] Admin user create failed, looking up existing:', err2?.message);
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users?.users?.find((u: { email?: string }) => u.email === testAdminEmail);
    if (!existing) throw new Error(`Cannot find or create admin user ${testAdminEmail}`);
    adminUserId = existing.id;
  } else {
    adminUserId = user2.user.id;
  }

  // 2. Update profiles (auto-created by trigger on auth.users insert)
  await supabase.from('profiles').update({
    username: 'testplayer',
    steam_id: '76561198000000001',
    is_admin: false,
    is_tournament_player: true,
  }).eq('id', testUserId);

  await supabase.from('profiles').update({
    username: 'adminuser',
    steam_id: '76561198000000002',
    is_admin: true,
    is_tournament_player: true,
  }).eq('id', adminUserId);

  // 3. Create teams
  for (let i = 0; i < 8; i++) {
    await supabase.from('teams').insert({
      id: TEST_IDS.teams[i],
      name: TEAM_NAMES[i].name,
      tag: TEAM_NAMES[i].tag,
    });
  }

  // 4. Create tournament
  await supabase.from('tournaments').insert({
    id: TEST_IDS.tournament,
    name: 'Orbital Cup #1',
    slug: 'orbital-cup-1',
    format: 'double_elimination',
    max_teams: 8,
    status: 'ongoing',
    prize_pool: 5000,
    prize_distribution: { '1': 3000, '2': 1500, '3': 500 },
  });

  // 5. Add teams to tournament
  for (let i = 0; i < 8; i++) {
    await supabase.from('tournament_teams').insert({
      tournament_id: TEST_IDS.tournament,
      team_id: TEST_IDS.teams[i],
      seed: i + 1,
      status: 'active',
    });
  }

  // 6. Create bracket matches (quarters = scheduled, rest = pending)
  const bracketMatches = [
    { round: 'winner_quarter_1', team1_id: TEST_IDS.teams[0], team2_id: TEST_IDS.teams[7], status: 'scheduled' },
    { round: 'winner_quarter_2', team1_id: TEST_IDS.teams[1], team2_id: TEST_IDS.teams[6], status: 'scheduled' },
    { round: 'winner_quarter_3', team1_id: TEST_IDS.teams[2], team2_id: TEST_IDS.teams[5], status: 'scheduled' },
    { round: 'winner_quarter_4', team1_id: TEST_IDS.teams[3], team2_id: TEST_IDS.teams[4], status: 'scheduled' },
    { round: 'winner_semi_1', team1_id: null, team2_id: null, status: 'pending' },
    { round: 'winner_semi_2', team1_id: null, team2_id: null, status: 'pending' },
    { round: 'winner_final', team1_id: null, team2_id: null, status: 'pending' },
    { round: 'loser_round1_1', team1_id: null, team2_id: null, status: 'pending' },
    { round: 'loser_round1_2', team1_id: null, team2_id: null, status: 'pending' },
    { round: 'loser_round2_1', team1_id: null, team2_id: null, status: 'pending' },
    { round: 'loser_round2_2', team1_id: null, team2_id: null, status: 'pending' },
    { round: 'loser_semi', team1_id: null, team2_id: null, status: 'pending' },
    { round: 'loser_final', team1_id: null, team2_id: null, status: 'pending' },
  ];

  for (const match of bracketMatches) {
    const { error } = await supabase.from('matches').insert({
      tournament_id: TEST_IDS.tournament,
      best_of: 1,
      ...match,
    });
    if (error) console.warn(`[Seed] Match ${match.round} insert error:`, error.message);
  }

  // 7. Create a finished match (for profile stats + match page tests)
  await supabase.from('matches').insert({
    id: TEST_IDS.finishedMatch,
    tournament_id: TEST_IDS.tournament,
    team1_id: TEST_IDS.teams[0],
    team2_id: TEST_IDS.teams[1],
    team1_score: 16,
    team2_score: 10,
    winner_id: TEST_IDS.teams[0],
    status: 'finished',
    round: 'showmatch',
    best_of: 1,
    map_name: 'de_mirage',
    veto_data: JSON.stringify([
      { step: 1, team: 'Team Alpha', action: 'ban', map: 'de_ancient' },
      { step: 2, team: 'Team Bravo', action: 'ban', map: 'de_nuke' },
    ]),
  });

  // 8. Create products
  const products = [
    { id: TEST_IDS.products[0], name: 'Camiseta Orbital', slug: 'camiseta-orbital', price: 89.90, collection: 'camisetas', images: [] as string[] },
    { id: TEST_IDS.products[1], name: 'Moletom Orbital', slug: 'moletom-orbital', price: 189.90, collection: 'moletons', images: [] as string[] },
    { id: TEST_IDS.products[2], name: 'Bone Orbital', slug: 'bone-orbital', price: 59.90, collection: 'acessorios', images: [] as string[] },
  ];
  for (const product of products) {
    await supabase.from('products').insert(product);
  }

  // 9. Create product variants
  for (const productId of TEST_IDS.products) {
    for (const size of ['S', 'M', 'L']) {
      await supabase.from('product_variants').insert({
        product_id: productId,
        size,
        sku: `${productId.slice(-4)}-${size}`,
        stock: 10,
        max_stock: 20,
      });
    }
  }

  // 10. Create drop
  await supabase.from('drops').insert({
    id: TEST_IDS.drop,
    name: 'Drop Orbital #1',
    slug: 'drop-orbital-1',
    description: 'Primeira colecao limitada',
    release_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  });

  console.log('[Seed] All test data created successfully.');
}

/** Clean up all test data */
export async function cleanupAllData() {
  const supabase = getAdminClient();

  // Delete in reverse order of dependencies
  // 1. Match child tables (via tournament matches)
  const { data: matchRows } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', TEST_IDS.tournament);

  const matchIds = matchRows?.map((m: { id: string }) => m.id) || [];
  if (matchIds.length > 0) {
    await supabase.from('match_events').delete().in('match_id', matchIds);
    await supabase.from('match_rounds').delete().in('match_id', matchIds);
    await supabase.from('match_player_stats').delete().in('match_id', matchIds);
    await supabase.from('match_maps').delete().in('match_id', matchIds);
  }

  // 2. Matches (all from tournament including finishedMatch)
  await supabase.from('matches').delete().eq('tournament_id', TEST_IDS.tournament);

  // 3. Tournament teams
  await supabase.from('tournament_teams').delete().eq('tournament_id', TEST_IDS.tournament);

  // 4. Tournament
  await supabase.from('tournaments').delete().eq('id', TEST_IDS.tournament);

  // 5. Teams and their players
  for (const teamId of TEST_IDS.teams) {
    await supabase.from('team_players').delete().eq('team_id', teamId);
    await supabase.from('teams').delete().eq('id', teamId);
  }

  // 6. Products and variants
  for (const productId of TEST_IDS.products) {
    await supabase.from('product_variants').delete().eq('product_id', productId);
    await supabase.from('products').delete().eq('id', productId);
  }

  // 7. Drops
  await supabase.from('drops').delete().eq('id', TEST_IDS.drop);

  // 8. Test auth users (profiles auto-deleted via CASCADE)
  const testUserEmail = process.env.TEST_USER_EMAIL || 'testuser@orbital.test';
  const testAdminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@orbital.test';
  const { data: users } = await supabase.auth.admin.listUsers();
  for (const user of users?.users || []) {
    if (user.email === testUserEmail || user.email === testAdminEmail) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  }

  console.log('[Seed] All test data cleaned up.');
}
