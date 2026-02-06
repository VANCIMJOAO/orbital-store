// Script para verificar e criar dados de teste
// Execute com: npx tsx scripts/test-setup.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydwjaksobcvvihaxshan.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkd2pha3NvYmN2dmloYXhzaGFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIzMTAyNCwiZXhwIjoyMDg1ODA3MDI0fQ.pIu7IFhCXUYQ3xgQIs9k-mQEWHPh9LLO9NdXINifB_0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 Verificando estrutura do banco...\n');

  // 1. Verificar se tabela match_player_stats existe
  const { data: tables, error: tablesError } = await supabase
    .from('match_player_stats')
    .select('id')
    .limit(1);

  if (tablesError && tablesError.code === '42P01') {
    console.log('❌ Tabela match_player_stats NÃO existe.');
    console.log('   Execute a migração SQL no Supabase Dashboard primeiro!\n');
    console.log('   Arquivo: supabase/migrations/20260205_tournament_system.sql\n');
    return;
  } else if (tablesError) {
    console.log('⚠️ Erro ao verificar tabela:', tablesError.message);
  } else {
    console.log('✅ Tabela match_player_stats existe');
  }

  // 2. Verificar profiles existentes
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, steam_id')
    .limit(10);

  if (profilesError) {
    console.log('❌ Erro ao buscar profiles:', profilesError.message);
    return;
  }

  console.log(`✅ Encontrados ${profiles?.length || 0} perfis no banco`);
  profiles?.forEach(p => {
    console.log(`   - ${p.username} (steam: ${p.steam_id || 'não definido'})`);
  });

  // 3. Verificar times existentes
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name, tag')
    .limit(10);

  if (teamsError) {
    console.log('❌ Erro ao buscar times:', teamsError.message);
  } else {
    console.log(`\n✅ Encontrados ${teams?.length || 0} times no banco`);
    teams?.forEach(t => {
      console.log(`   - [${t.tag}] ${t.name}`);
    });
  }

  // 4. Verificar partidas existentes
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, status, map_name, match_phase')
    .limit(10);

  if (matchesError) {
    console.log('❌ Erro ao buscar partidas:', matchesError.message);
  } else {
    console.log(`\n✅ Encontradas ${matches?.length || 0} partidas no banco`);
    matches?.forEach(m => {
      console.log(`   - ${m.id.slice(0, 8)}... (status: ${m.status}, phase: ${m.match_phase || 'N/A'})`);
    });
  }

  // 5. Verificar se há algum perfil para testar
  if (profiles && profiles.length > 0) {
    const testProfile = profiles[0];
    console.log(`\n📋 TESTE: Acesse http://localhost:3000/campeonatos/jogador/${testProfile.username}`);
    console.log(`   ou http://localhost:3000/api/profiles/${testProfile.id}/stats`);
  }

  console.log('\n✨ Verificação concluída!');
}

main().catch(console.error);
