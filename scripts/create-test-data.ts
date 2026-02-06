// Script para criar dados de teste
// Execute com: npx tsx scripts/create-test-data.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydwjaksobcvvihaxshan.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkd2pha3NvYmN2dmloYXhzaGFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIzMTAyNCwiZXhwIjoyMDg1ODA3MDI0fQ.pIu7IFhCXUYQ3xgQIs9k-mQEWHPh9LLO9NdXINifB_0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dados de teste: 8 times com 5 jogadores cada
const testTeams = [
  { name: 'FURIA Esports', tag: 'FUR', logo_url: 'https://img-cdn.hltv.org/teamlogo/mvNQc4csFGtxXk5guAh8m1.svg' },
  { name: 'LOUD', tag: 'LOUD', logo_url: 'https://img-cdn.hltv.org/teamlogo/0FShFCvfvDrAqvK9bO8bRI.png' },
  { name: 'paiN Gaming', tag: 'paiN', logo_url: 'https://img-cdn.hltv.org/teamlogo/BsGaDGqx9AIrpAqbsGPELH.svg' },
  { name: 'Imperial', tag: 'IMP', logo_url: 'https://img-cdn.hltv.org/teamlogo/lTVnYFCvdRuUD-KgDaJPJA.svg' },
  { name: 'RED Canids', tag: 'RED', logo_url: 'https://img-cdn.hltv.org/teamlogo/U8ZXkOJSaKHKBshCGz0YjC.png' },
  { name: 'Case Esports', tag: 'CASE', logo_url: null },
  { name: 'Fluxo', tag: 'FLX', logo_url: null },
  { name: 'MIBR', tag: 'MIBR', logo_url: 'https://img-cdn.hltv.org/teamlogo/tqcMWUTYKN4GfC5Db1sFEF.svg' },
];

// Jogadores fictícios por time
const playerNames = [
  ['FalleN', 'KSCERATO', 'yuurih', 'arT', 'chelo'],
  ['aspas', 'saadhak', 'Less', 'tuyz', 'cauanzin'],
  ['biguzera', 'NQZ', 'hardzao', 'n1ssim', 'nx0'],
  ['VINI', 'felps', 'fnx', 'boltz', 'WOOD7'],
  ['pesadelo', 'coldzera', 'HEN1', 'LUCAS1', 'leo_drk'],
  ['dumau', 'skullz', 'nython', 'lux', 'drg'],
  ['vsm', 'shz', 'v$m', 'JOTA', 'history'],
  ['exit', 'drop', 'brnz4n', 'saffee', 'insani'],
];

async function createTestData() {
  console.log('🚀 Criando dados de teste...\n');

  // 1. Buscar ou criar torneio
  let tournamentId: string;
  const { data: existingTournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', 'orbital-cup-2026')
    .single();

  if (existingTournament) {
    tournamentId = existingTournament.id;
    console.log('✅ Torneio existente encontrado:', tournamentId.slice(0, 8));
  } else {
    const { data: newTournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        name: 'Orbital Cup 2026',
        slug: 'orbital-cup-2026',
        game: 'cs2',
        format: 'double_elimination',
        status: 'ongoing',
        max_teams: 8,
        prize_pool: 10000,
        start_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (tournamentError) {
      console.log('❌ Erro ao criar torneio:', tournamentError.message);
      return;
    }
    tournamentId = newTournament.id;
    console.log('✅ Torneio criado:', tournamentId.slice(0, 8));
  }

  // 2. Criar times
  const teamIds: string[] = [];

  for (let i = 0; i < testTeams.length; i++) {
    const team = testTeams[i];

    // Verificar se time já existe
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('tag', team.tag)
      .single();

    if (existingTeam) {
      teamIds.push(existingTeam.id);
      console.log(`✅ Time existente: [${team.tag}] ${team.name}`);
      continue;
    }

    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: team.name,
        tag: team.tag,
        logo_url: team.logo_url,
        tournament_id: tournamentId,
      })
      .select()
      .single();

    if (teamError) {
      console.log(`❌ Erro ao criar time ${team.name}:`, teamError.message);
      continue;
    }

    teamIds.push(newTeam.id);
    console.log(`✅ Time criado: [${team.tag}] ${team.name}`);
  }

  // 3. Criar jogadores (perfis fictícios)
  console.log('\n📝 Criando jogadores...');

  for (let teamIndex = 0; teamIndex < teamIds.length; teamIndex++) {
    const teamId = teamIds[teamIndex];
    const players = playerNames[teamIndex] || [];

    for (const playerName of players) {
      // Gerar SteamID fictício
      const steamId = `7656119800000${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Verificar se perfil já existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', playerName)
        .single();

      let profileId: string;

      if (existingProfile) {
        profileId = existingProfile.id;
      } else {
        // Criar perfil usando auth.admin (não funciona sem auth)
        // Vamos pular a criação de perfis e usar os existentes
        console.log(`⚠️  Perfil ${playerName} não existe (pulando)`);
        continue;
      }

      // Verificar se já está no time
      const { data: existingMember } = await supabase
        .from('team_players')
        .select('id')
        .eq('team_id', teamId)
        .eq('profile_id', profileId)
        .single();

      if (!existingMember) {
        const { error: memberError } = await supabase
          .from('team_players')
          .insert({
            team_id: teamId,
            profile_id: profileId,
            steam_id: steamId,
            nickname: playerName,
            role: 'player',
            is_active: true,
          });

        if (memberError) {
          console.log(`   ⚠️  Erro ao adicionar ${playerName} ao time:`, memberError.message);
        }
      }
    }
  }

  // 4. Criar uma partida de teste
  if (teamIds.length >= 2) {
    console.log('\n📝 Criando partida de teste...');

    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('tournament_id', tournamentId)
      .limit(1)
      .single();

    if (existingMatch) {
      console.log('✅ Partida existente encontrada:', existingMatch.id.slice(0, 8));
    } else {
      const { data: newMatch, error: matchError } = await supabase
        .from('matches')
        .insert({
          tournament_id: tournamentId,
          team1_id: teamIds[0],
          team2_id: teamIds[1],
          status: 'scheduled',
          scheduled_at: new Date().toISOString(),
          round: 1,
          bracket_position: 1,
        })
        .select()
        .single();

      if (matchError) {
        console.log('❌ Erro ao criar partida:', matchError.message);
      } else {
        console.log('✅ Partida criada:', newMatch.id.slice(0, 8));
        console.log(`   ${testTeams[0].name} vs ${testTeams[1].name}`);
      }
    }
  }

  // 5. Mostrar resumo
  console.log('\n' + '='.repeat(50));
  console.log('📋 RESUMO');
  console.log('='.repeat(50));

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .limit(5);

  console.log('\n🔗 URLs para testar:');
  profiles?.forEach(p => {
    console.log(`   http://localhost:3000/campeonatos/jogador/${p.username}`);
  });

  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .limit(3);

  matches?.forEach(m => {
    console.log(`   http://localhost:3000/api/matches/${m.id}/config`);
  });

  console.log('\n✨ Setup concluído!');
}

createTestData().catch(console.error);
