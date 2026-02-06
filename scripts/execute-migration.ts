// Script para executar migração SQL diretamente via fetch
// Execute com: npx tsx scripts/execute-migration.ts

const supabaseUrl = 'https://ydwjaksobcvvihaxshan.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkd2pha3NvYmN2dmloYXhzaGFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIzMTAyNCwiZXhwIjoyMDg1ODA3MDI0fQ.pIu7IFhCXUYQ3xgQIs9k-mQEWHPh9LLO9NdXINifB_0';

// SQL statements individuais para execução sequencial
const statements = [
  // 1. Criar tabela match_player_stats
  `CREATE TABLE IF NOT EXISTS match_player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    match_map_id UUID REFERENCES match_maps(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    headshots INTEGER DEFAULT 0,
    total_damage INTEGER DEFAULT 0,
    adr DECIMAL(5,2),
    kast_percentage DECIMAL(5,2),
    rating DECIMAL(4,2),
    rounds_played INTEGER DEFAULT 0,
    rounds_with_kill INTEGER DEFAULT 0,
    rounds_survived INTEGER DEFAULT 0,
    first_kills INTEGER DEFAULT 0,
    first_deaths INTEGER DEFAULT 0,
    clutch_wins INTEGER DEFAULT 0,
    clutch_attempts INTEGER DEFAULT 0,
    two_kills INTEGER DEFAULT 0,
    three_kills INTEGER DEFAULT 0,
    four_kills INTEGER DEFAULT 0,
    aces INTEGER DEFAULT 0,
    flash_assists INTEGER DEFAULT 0,
    enemies_flashed INTEGER DEFAULT 0,
    equipment_value_total INTEGER DEFAULT 0,
    ct_kills INTEGER DEFAULT 0,
    t_kills INTEGER DEFAULT 0,
    ct_deaths INTEGER DEFAULT 0,
    t_deaths INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, match_map_id, profile_id)
  )`,

  // 2. Índices para match_player_stats
  `CREATE INDEX IF NOT EXISTS idx_match_player_stats_match ON match_player_stats(match_id)`,
  `CREATE INDEX IF NOT EXISTS idx_match_player_stats_profile ON match_player_stats(profile_id)`,
  `CREATE INDEX IF NOT EXISTS idx_match_player_stats_team ON match_player_stats(team_id)`,

  // 3. Criar tabela match_rounds
  `CREATE TABLE IF NOT EXISTS match_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    match_map_id UUID REFERENCES match_maps(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    winner_team_id UUID REFERENCES teams(id),
    win_reason VARCHAR(50),
    ct_team_id UUID REFERENCES teams(id),
    t_team_id UUID REFERENCES teams(id),
    ct_score INTEGER NOT NULL DEFAULT 0,
    t_score INTEGER NOT NULL DEFAULT 0,
    ct_equipment_value INTEGER DEFAULT 0,
    t_equipment_value INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    first_kill_profile_id UUID REFERENCES profiles(id),
    first_death_profile_id UUID REFERENCES profiles(id),
    bomb_planted_by UUID REFERENCES profiles(id),
    bomb_defused_by UUID REFERENCES profiles(id),
    bomb_plant_site VARCHAR(1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, match_map_id, round_number)
  )`,

  // 4. Índices para match_rounds
  `CREATE INDEX IF NOT EXISTS idx_match_rounds_match ON match_rounds(match_id)`,
  `CREATE INDEX IF NOT EXISTS idx_match_rounds_winner ON match_rounds(winner_team_id)`,

  // 5. Criar tabela match_events
  `CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    match_map_id UUID REFERENCES match_maps(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    round_number INTEGER NOT NULL,
    tick INTEGER,
    event_data JSONB NOT NULL DEFAULT '{}',
    attacker_profile_id UUID REFERENCES profiles(id),
    victim_profile_id UUID REFERENCES profiles(id),
    weapon VARCHAR(50),
    is_headshot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // 6. Índices para match_events
  `CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id)`,
  `CREATE INDEX IF NOT EXISTS idx_match_events_type ON match_events(event_type)`,
  `CREATE INDEX IF NOT EXISTS idx_match_events_round ON match_events(match_id, round_number)`,

  // 7. Alterar tabela matches - adicionar colunas individualmente
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_phase VARCHAR(20) DEFAULT 'scheduled'`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS matchzy_config JSONB`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS best_of INTEGER DEFAULT 1`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS maps_won_team1 INTEGER DEFAULT 0`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS maps_won_team2 INTEGER DEFAULT 0`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS current_map_index INTEGER DEFAULT 0`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS veto_data JSONB`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS map_name VARCHAR(50)`,

  // 8. Alterar tabela team_players
  `ALTER TABLE team_players ADD COLUMN IF NOT EXISTS steam_id VARCHAR(50)`,
  `ALTER TABLE team_players ADD COLUMN IF NOT EXISTS nickname VARCHAR(100)`,

  // 9. Alterar tabela profiles
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_kills INTEGER DEFAULT 0`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_deaths INTEGER DEFAULT 0`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 0`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(4,2)`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headshot_percentage DECIMAL(5,2)`,
];

async function executeSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Usar a API REST do Supabase para executar SQL via PostgREST
    // Nota: Isso não funciona diretamente - PostgREST não executa SQL arbitrário
    // Vamos usar a abordagem de chamar uma função RPC ou criar dados via API

    // Na verdade, a melhor abordagem é usar o pg client diretamente
    // Mas como não temos acesso direto, vamos tentar outra abordagem

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: text };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${tableName}?select=id&limit=0`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 Verificando tabelas existentes...\n');

  // Verificar quais tabelas já existem
  const tables = ['match_player_stats', 'match_rounds', 'match_events'];
  for (const table of tables) {
    const exists = await checkTableExists(table);
    console.log(`   ${table}: ${exists ? '✅ existe' : '❌ não existe'}`);
  }

  console.log('\n📋 Instruções para executar a migração manualmente:\n');
  console.log('1. Abra o Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/ydwjaksobcvvihaxshan/sql\n');
  console.log('2. Clique em "New query"\n');
  console.log('3. Cole e execute cada bloco de SQL abaixo separadamente:\n');
  console.log('='.repeat(60));

  for (let i = 0; i < statements.length; i++) {
    console.log(`\n-- [${i + 1}/${statements.length}] Statement:`);
    console.log(statements[i]);
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('\n💡 Dica: Copie todo o conteúdo do arquivo de migração e cole no SQL Editor:');
  console.log('   orbital-store/supabase/migrations/20260205_tournament_system.sql\n');
}

main().catch(console.error);
