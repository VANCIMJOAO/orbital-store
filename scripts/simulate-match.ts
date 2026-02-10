/**
 * Simulador de partida MatchZy - envia webhooks idênticos aos que o MatchZy envia
 * Simula uma partida completa: going_live → rounds com kills → map_result → series_end
 *
 * Uso: npx tsx scripts/simulate-match.ts
 *
 * Resultado esperado: Fluxo 13 x 7 RED Canids (de_ancient)
 */

const WEBHOOK_URL = "https://orbital-store.vercel.app/api/matchzy/events";
const AUTH_TOKEN = "Bearer orbital_secret_token";

// Usar UUID diretamente (o handler aceita UUID sem precisar resolver)
const MATCH_UUID = "b15d38d1-4339-4795-8e1e-929979487bf9";
const MATCH_ID = 828192978; // matchid numérico do config

// Teams
const TEAM1 = {
  id: "team1",
  name: "Fluxo",
  tag: "FLX",
};

const TEAM2 = {
  id: "team2",
  name: "RED Canids",
  tag: "RED",
};

// Players - Steam IDs do config
const TEAM1_PLAYERS = [
  { steamid: "7656119801000408827", name: "drop" },
  { steamid: "7656119801000321740", name: "chelo" },
  { steamid: "76561198023055702", name: "vcmJESUS" },
  { steamid: "7656119801000191633", name: "KSCERATO" },
  { steamid: "7656119801000226600", name: "yuurih" },
];

const TEAM2_PLAYERS = [
  { steamid: "7656119801070019947", name: "heat" },
  { steamid: "7656119801070469244", name: "insani" },
  { steamid: "7656119801070132124", name: "zqkS" },
  { steamid: "7656119801070347691", name: "KHTex" },
  { steamid: "7656119801070267331", name: "try" },
];

// Helpers
async function sendEvent(event: Record<string, unknown>) {
  const resp = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": AUTH_TOKEN,
    },
    body: JSON.stringify(event),
  });

  const data = await resp.json();
  const status = resp.ok ? "OK" : "FAIL";
  console.log(`[${status}] ${event.event} → ${resp.status}`, resp.ok ? "" : JSON.stringify(data));
  return resp.ok;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Gerar stats acumuladas para um jogador
function generatePlayerStats(
  name: string,
  steamid: string,
  kills: number,
  deaths: number,
  assists: number,
  headshots: number,
  damage: number,
  roundsPlayed: number,
  firstKillsT: number,
  firstKillsCt: number,
  firstDeathsT: number,
  firstDeathsCt: number,
  kills2: number,
  kills3: number,
  kills4: number,
  kills5: number,
  clutchWins1v1: number,
) {
  return {
    steamid,
    name,
    stats: {
      kills,
      headshot_kills: headshots,
      deaths,
      assists,
      flash_assists: Math.floor(assists * 0.3),
      enemies_flashed: Math.floor(kills * 0.4),
      friendlies_flashed: Math.floor(Math.random() * 3),
      damage,
      utility_damage: Math.floor(damage * 0.15),
      knife_kills: 0,
      suicides: 0,
      team_kills: 0,
      trade_kills: Math.floor(kills * 0.2),
      bomb_plants: Math.floor(Math.random() * 3),
      bomb_defuses: Math.floor(Math.random() * 2),
      first_kills_t: firstKillsT,
      first_kills_ct: firstKillsCt,
      first_deaths_t: firstDeathsT,
      first_deaths_ct: firstDeathsCt,
      kast: Math.min(100, Math.floor(60 + Math.random() * 35)),
      score: kills * 2 + assists,
      mvps: Math.floor(kills * 0.15),
      rounds_played: roundsPlayed,
      kills1: kills - kills2 * 2 - kills3 * 3 - kills4 * 4 - kills5 * 5,
      kills2,
      kills3,
      kills4,
      kills5,
      one_v1s: clutchWins1v1,
      one_v2s: 0,
      one_v3s: 0,
      one_v4s: 0,
      one_v5s: 0,
    },
  };
}

// ============================================================
// Simulação da partida
// ============================================================

// Placar final: Fluxo 13 x 7 RED Canids
// 1st half (Fluxo CT): 9-6
// 2nd half (Fluxo T): 4-1 → total 13-7

// Round results: quem vence cada round
// T = team2 wins (RED ataca), CT = team1 wins (Fluxo defende)
const ROUND_RESULTS: { winner: "team1" | "team2"; reason: number }[] = [
  // 1st half: Fluxo CT, RED T  (Fluxo wins 9, RED wins 6)
  { winner: "team1", reason: 7 },  // R1: CT win (bomb defuse)
  { winner: "team1", reason: 8 },  // R2: CT win (elimination)
  { winner: "team2", reason: 1 },  // R3: T win (bomb explode)
  { winner: "team1", reason: 8 },  // R4: CT win
  { winner: "team1", reason: 7 },  // R5: CT win (defuse)
  { winner: "team2", reason: 1 },  // R6: T win
  { winner: "team1", reason: 8 },  // R7: CT win
  { winner: "team2", reason: 8 },  // R8: T win (elimination)
  { winner: "team1", reason: 7 },  // R9: CT win
  { winner: "team2", reason: 1 },  // R10: T win
  { winner: "team1", reason: 8 },  // R11: CT win
  { winner: "team1", reason: 8 },  // R12: CT win
  { winner: "team2", reason: 1 },  // R13: T win
  { winner: "team1", reason: 8 },  // R14: CT win
  { winner: "team2", reason: 8 },  // R15: T win → Halftime 9-6
  // 2nd half: Fluxo T, RED CT (Fluxo needs 4 more)
  { winner: "team1", reason: 1 },  // R16: T win (Fluxo ataca)
  { winner: "team1", reason: 8 },  // R17: T win
  { winner: "team2", reason: 7 },  // R18: CT win (RED defende)
  { winner: "team1", reason: 1 },  // R19: T win
  { winner: "team1", reason: 1 },  // R20: T win → 13-7 Fluxo wins!
];

async function main() {
  console.log("=== Simulando partida: Fluxo vs RED Canids (de_ancient) ===\n");
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`Match UUID: ${MATCH_UUID}`);
  console.log(`Match ID numérico: ${MATCH_ID}\n`);

  let team1Score = 0;
  let team2Score = 0;

  // 1. GOING_LIVE
  console.log("--- GOING LIVE ---");
  await sendEvent({
    event: "going_live",
    matchid: MATCH_UUID,
    map_number: 0,
  });
  await sleep(500);

  // 2. ROUNDS
  for (let i = 0; i < ROUND_RESULTS.length; i++) {
    const round = ROUND_RESULTS[i];
    const roundNum = i + 1;

    // Determinar sides baseado no half
    const isFirstHalf = roundNum <= 15;
    const team1Side = isFirstHalf ? "CT" : "T";
    const team2Side = isFirstHalf ? "T" : "CT";

    // Atualizar score
    if (round.winner === "team1") team1Score++;
    else team2Score++;

    console.log(`\n--- Round ${roundNum}: ${round.winner === "team1" ? "Fluxo" : "RED Canids"} wins (${team1Score}-${team2Score}) ---`);

    // 2a. Simular 3-5 kills por round
    const killCount = 3 + Math.floor(Math.random() * 3);
    for (let k = 0; k < killCount; k++) {
      // Alternar atacantes/vítimas entre os times
      const attackerTeamPlayers = k % 2 === 0 ? TEAM1_PLAYERS : TEAM2_PLAYERS;
      const victimTeamPlayers = k % 2 === 0 ? TEAM2_PLAYERS : TEAM1_PLAYERS;
      const attackerSide = k % 2 === 0 ? team1Side : team2Side;
      const victimSide = k % 2 === 0 ? team2Side : team1Side;

      const attacker = attackerTeamPlayers[Math.floor(Math.random() * attackerTeamPlayers.length)];
      const victim = victimTeamPlayers[Math.floor(Math.random() * victimTeamPlayers.length)];

      const weapons = ["ak47", "m4a1", "awp", "deagle", "m4a1_silencer", "glock", "usp_silencer"];
      const weapon = weapons[Math.floor(Math.random() * weapons.length)];

      await sendEvent({
        event: "player_death",
        matchid: MATCH_UUID,
        map_number: 0,
        round_number: roundNum,
        attacker: { steamid: attacker.steamid, name: attacker.name, side: attackerSide },
        player: { steamid: victim.steamid, name: victim.name, side: victimSide },
        assister: Math.random() > 0.5 ? {
          steamid: attackerTeamPlayers[(attackerTeamPlayers.indexOf(attacker) + 1) % 5].steamid,
          name: attackerTeamPlayers[(attackerTeamPlayers.indexOf(attacker) + 1) % 5].name,
          side: attackerSide,
          friendly_fire: false,
        } : null,
        weapon: { name: weapon },
        headshot: Math.random() > 0.5,
        penetrated: false,
        thrusmoke: Math.random() > 0.85,
        attackerblind: false,
        noscope: weapon === "awp" && Math.random() > 0.9,
      });
      await sleep(100);
    }

    // 2b. Bomb event (aleatório)
    if (Math.random() > 0.4) {
      const site = Math.random() > 0.5 ? "A" : "B";
      const planter = TEAM2_PLAYERS[Math.floor(Math.random() * 5)]; // T-side planta na 1st half
      await sendEvent({
        event: "bomb_planted",
        matchid: MATCH_UUID,
        map_number: 0,
        round_number: roundNum,
        player: { steamid: planter.steamid, name: planter.name, side: team2Side },
        site,
      });
      await sleep(100);

      // Se CT ganhou com defuse
      if (round.reason === 7) {
        const defuser = TEAM1_PLAYERS[Math.floor(Math.random() * 5)];
        await sendEvent({
          event: "bomb_defused",
          matchid: MATCH_UUID,
          map_number: 0,
          round_number: roundNum,
          player: { steamid: defuser.steamid, name: defuser.name, side: team1Side },
          site,
        });
        await sleep(100);
      }
    }

    // 2c. ROUND_END com stats acumuladas
    const roundsPlayed = roundNum;

    // Gerar stats acumuladas incrementais para cada jogador
    const team1PlayersStats = TEAM1_PLAYERS.map((p, idx) => {
      const baseKills = Math.floor(team1Score * (1.2 + idx * 0.15) + Math.random() * 3);
      const baseDeaths = Math.floor(roundsPlayed * 0.6 + Math.random() * 3);
      return generatePlayerStats(
        p.name, p.steamid,
        baseKills, baseDeaths,
        Math.floor(baseKills * 0.3), // assists
        Math.floor(baseKills * 0.45), // headshots
        Math.floor(baseKills * 85 + Math.random() * 200), // damage
        roundsPlayed,
        Math.floor(Math.random() * 3), Math.floor(Math.random() * 3), // first kills T/CT
        Math.floor(Math.random() * 2), Math.floor(Math.random() * 2), // first deaths T/CT
        Math.floor(Math.random() * 2), // 2k
        Math.random() > 0.7 ? 1 : 0, // 3k
        Math.random() > 0.9 ? 1 : 0, // 4k
        0, // 5k
        Math.random() > 0.8 ? 1 : 0, // clutch 1v1
      );
    });

    const team2PlayersStats = TEAM2_PLAYERS.map((p, idx) => {
      const baseKills = Math.floor(team2Score * (1.1 + idx * 0.12) + Math.random() * 3);
      const baseDeaths = Math.floor(roundsPlayed * 0.65 + Math.random() * 3);
      return generatePlayerStats(
        p.name, p.steamid,
        baseKills, baseDeaths,
        Math.floor(baseKills * 0.25), // assists
        Math.floor(baseKills * 0.4), // headshots
        Math.floor(baseKills * 80 + Math.random() * 180), // damage
        roundsPlayed,
        Math.floor(Math.random() * 2), Math.floor(Math.random() * 2),
        Math.floor(Math.random() * 2), Math.floor(Math.random() * 2),
        Math.floor(Math.random() * 2),
        Math.random() > 0.75 ? 1 : 0,
        Math.random() > 0.92 ? 1 : 0,
        0,
        Math.random() > 0.85 ? 1 : 0,
      );
    });

    await sendEvent({
      event: "round_end",
      matchid: MATCH_UUID,
      map_number: 0,
      round_number: roundNum,
      round_time: 60 + Math.floor(Math.random() * 50),
      reason: round.reason,
      winner: {
        side: round.winner === "team1" ? team1Side : team2Side,
        team: round.winner,
      },
      team1: {
        id: TEAM1.id,
        name: TEAM1.name,
        series_score: 0,
        score: team1Score,
        score_ct: isFirstHalf ? team1Score : (team1Score > 9 ? 9 : team1Score),
        score_t: isFirstHalf ? 0 : team1Score - 9,
        players: team1PlayersStats,
      },
      team2: {
        id: TEAM2.id,
        name: TEAM2.name,
        series_score: 0,
        score: team2Score,
        score_ct: isFirstHalf ? 0 : team2Score - 6,
        score_t: isFirstHalf ? team2Score : 6,
        players: team2PlayersStats,
      },
    });
    await sleep(300);
  }

  // 3. MAP_RESULT
  console.log("\n--- MAP RESULT ---");

  // Stats finais completas
  const finalTeam1Players = TEAM1_PLAYERS.map((p, idx) => {
    const kills = 18 + idx * 2 + Math.floor(Math.random() * 5);
    const deaths = 10 + Math.floor(Math.random() * 5);
    return generatePlayerStats(
      p.name, p.steamid,
      kills, deaths,
      Math.floor(kills * 0.3),
      Math.floor(kills * 0.45),
      Math.floor(kills * 85),
      20, // total rounds
      2 + Math.floor(Math.random() * 2), 2 + Math.floor(Math.random() * 2),
      1, 1,
      2 + Math.floor(Math.random() * 2),
      1,
      Math.random() > 0.5 ? 1 : 0,
      0,
      1,
    );
  });

  const finalTeam2Players = TEAM2_PLAYERS.map((p, idx) => {
    const kills = 10 + idx * 2 + Math.floor(Math.random() * 5);
    const deaths = 14 + Math.floor(Math.random() * 5);
    return generatePlayerStats(
      p.name, p.steamid,
      kills, deaths,
      Math.floor(kills * 0.25),
      Math.floor(kills * 0.4),
      Math.floor(kills * 78),
      20,
      1 + Math.floor(Math.random() * 2), 1 + Math.floor(Math.random() * 2),
      2, 1,
      1 + Math.floor(Math.random() * 2),
      Math.random() > 0.6 ? 1 : 0,
      0,
      0,
      Math.random() > 0.7 ? 1 : 0,
    );
  });

  await sendEvent({
    event: "map_result",
    matchid: MATCH_UUID,
    map_number: 0,
    winner: {
      side: "T",
      team: "team1",
    },
    team1: {
      id: TEAM1.id,
      name: TEAM1.name,
      series_score: 1,
      score: 13,
      score_ct: 9,
      score_t: 4,
      players: finalTeam1Players,
    },
    team2: {
      id: TEAM2.id,
      name: TEAM2.name,
      series_score: 0,
      score: 7,
      score_ct: 1,
      score_t: 6,
      players: finalTeam2Players,
    },
  });
  await sleep(500);

  // 4. SERIES_END
  console.log("\n--- SERIES END ---");
  await sendEvent({
    event: "series_end",
    matchid: MATCH_UUID,
    map_number: 0,
    team1_series_score: 1,
    team2_series_score: 0,
    winner: {
      side: "T",
      team: "team1",
    },
    time_until_restore: 0,
    team1: {
      id: TEAM1.id,
      name: TEAM1.name,
      series_score: 1,
      score: 13,
      score_ct: 9,
      score_t: 4,
      players: finalTeam1Players,
    },
    team2: {
      id: TEAM2.id,
      name: TEAM2.name,
      series_score: 0,
      score: 7,
      score_ct: 1,
      score_t: 6,
      players: finalTeam2Players,
    },
  });

  console.log("\n=== Simulação concluída! ===");
  console.log(`Resultado: Fluxo ${team1Score} x ${team2Score} RED Canids`);
  console.log("\nVerifique:");
  console.log("1. Supabase: match_player_stats (10 jogadores com stats)");
  console.log("2. Supabase: match_rounds (20 rounds registrados)");
  console.log("3. Supabase: match_events (kills, bombs)");
  console.log("4. Supabase: matches - status 'live', scores 13-7");
  console.log("5. Site: /campeonatos/partida/b15d38d1-... mostra scorebot");
  console.log("\nAgora use o admin para FINALIZAR a partida (13 x 7)");
  console.log("e verificar se o bracket advance funciona.");
}

main().catch(console.error);
