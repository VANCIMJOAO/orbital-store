# MatchZy Integration

## Visao Geral

MatchZy e um plugin CounterStrikeSharp para CS2 que gerencia partidas competitivas. O Orbital Roxa integra com MatchZy para:

1. Carregar configuracao de partida automaticamente
2. Receber eventos em tempo real (kills, rounds, bomb)
3. Persistir estatisticas de jogadores
4. Finalizar partida e avancar bracket automaticamente

## Comandos RCON (via Pterodactyl)

### css_endmatch
Encerra a partida atual no servidor.

```
css_endmatch
```

**IMPORTANTE:** Usar `css_endmatch`, NAO `matchzy_endmatch`.
Aliases validos: `css_endmatch`, `get5_endmatch`, `css_forceend`

Deve ser enviado ANTES de `matchzy_loadmatch_url`, pois o plugin rejeita novo load se ja tem partida ativa.

### matchzy_loadmatch_url
Carrega configuracao de partida de uma URL.

```
matchzy_loadmatch_url "https://site.vercel.app/api/matches/{id}/config"
```

**Requisitos:**
- URL deve ser acessivel publicamente pelo CS2 server
- Retorna JSON no formato MatchZy
- `matchid` DEVE ser integer (Int32), NAO string, NAO UUID
- Funciona sem prefixo `css_`

### css_restore
Restaura partida para um round anterior.

```
css_restore 5
```

Usa backups automaticos do MatchZy. So funciona durante partida ao vivo.

## Config JSON

Gerado pelo endpoint `GET /api/matches/{id}/config`:

```json
{
  "matchid": 1425325056,
  "num_maps": 1,
  "maplist": ["de_ancient"],
  "skip_veto": true,
  "side_type": "knife",
  "players_per_team": 5,
  "min_players_to_ready": 5,
  "team1": {
    "name": "Team Alpha",
    "tag": "ALPH",
    "flag": "br",
    "players": {
      "76561198000000001": "Player1",
      "76561198000000002": "Player2",
      "76561198000000003": "Player3",
      "76561198000000004": "Player4",
      "76561198000000005": "Player5"
    }
  },
  "team2": {
    "name": "Team Beta",
    "tag": "BETA",
    "players": {
      "76561198000000006": "Player6",
      "76561198000000007": "Player7",
      "76561198000000008": "Player8",
      "76561198000000009": "Player9",
      "76561198000000010": "Player10"
    }
  },
  "cvars": {
    "matchzy_remote_log_url": "https://gotv-server/api/matchzy/events",
    "matchzy_remote_log_header_key": "Authorization",
    "matchzy_remote_log_header_value": "Bearer token_secreto",
    "orbital_match_uuid": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Conversao UUID → matchid (Int32)

MatchZy exige `matchid` como integer (max 2,147,483,647).

Algoritmo:
```
1. Remove hyphens do UUID: "550e8400e29b41d4a716446655440000"
2. Pega primeiros 8 chars hex: "550e8400"
3. Converte para decimal: 1,425,325,056
4. Modulo Int32 max: 1,425,325,056 % 2,147,483,647 = 1,425,325,056
5. Se zero, usa 1
```

O UUID original e enviado no cvar `orbital_match_uuid` para o GOTV server poder mapear de volta.

### Resolucao de Players

Prioridade para SteamID:
1. `team_players.steam_id` (override por time)
2. `profiles.steam_id` (perfil do jogador)

Prioridade para nome:
1. `team_players.nickname` (nome no time)
2. `profiles.username` (nome do perfil)
3. Fallback: "Player"

Apenas jogadores com `is_active = true` sao incluidos.

## Webhook Events

### Configuracao no CS2

Os cvars da config JSON configuram o MatchZy para enviar eventos:
```
matchzy_remote_log_url = "https://gotv-server/api/matchzy/events"
matchzy_remote_log_header_key = "Authorization"
matchzy_remote_log_header_value = "Bearer token"
```

### Fluxo de Eventos

```
Warmup → going_live → knife_start → knife_won → side_picked
  → round_start → round_end (×30) → map_result
  → series_end → demo_upload_ended
```

### Eventos Detalhados

#### going_live
Partida saiu do warmup, round 1 vai comecar.

**DB:** `matches.status = "live"`, `matches.is_live = true`, `matches.started_at = now()`
Cria registro em `match_maps`.

#### round_end
Round terminou com vencedor.

**Dados:** team1/team2 com scores e stats de todos jogadores.
**DB:**
- Atualiza `matches.team1_score`, `matches.team2_score`
- Insere `match_rounds` com winner, reason, scores, first kill, bomb info
- Upsert `match_player_stats` com kills, deaths, assists, ADR, KAST, rating

**Win reasons (numerico):**

| Codigo | Significado |
|--------|------------|
| 1 | target_bombed (T venceu por explodir bomba) |
| 7 | bomb_defused (CT desarmou) |
| 8 | terrorists_killed (CT eliminou todos T) |
| 9 | cts_killed (T eliminou todos CT) |
| 10 | round_time_expired (CT venceu por tempo) |
| 12 | target_saved (CT salvou alvo) |
| 17 | terrorists_surrender |
| 18 | cts_surrender |

#### player_death
Jogador morreu.

**DB:** Insere `match_events` com attacker, victim, weapon, headshot, wallbang, throughSmoke.

#### bomb_planted / bomb_defused
Bomba plantada ou desarmada.

**DB:** Insere `match_events` com site (A/B) e jogador responsavel.

#### map_result
Mapa finalizado.

**DB:** Atualiza `match_maps` com scores finais e `winner_id`.

#### series_end
Serie decidida (BO1: apos 1 mapa, BO3: maioria de 3).

**DB:**
- `matches.status = "finished"`, `matches.winner_id`, `matches.finished_at`
- Persiste stats finais de todos jogadores
- Atualiza `profiles` com agregados (total_kills, total_deaths, average_rating)
- Chama `advanceTeamsInBracket()` para mover times no bracket

#### demo_upload_ended
Demo do mapa foi uploaded.

**DB:** Salva filename em `match_maps.demo_url`.

## Caching

3 caches TTL para evitar queries repetitivas ao Supabase:

| Cache | Chave | Valor | TTL | Max |
|-------|-------|-------|-----|-----|
| matchIdCache | matchid numerico | UUID | 30 min | 100 |
| steamIdCache | steamid | {profileId, teamId} | 30 min | 100 |
| matchMapCache | matchid:mapnum | match_maps.id | 30 min | 100 |

Eviction: FIFO quando atinge max size.

## Match Lifecycle Completo

```
1. SCHEDULED (partida criada no bracket)
   │
   ├── Admin faz Veto (bans/picks de mapas)
   │   └── Salva veto_data no DB
   │
   ├── Auto-trigger: load-server
   │   ├── css_endmatch (Pterodactyl RCON)
   │   ├── Wait 2s
   │   └── matchzy_loadmatch_url "config_url" (retry: 2s, 3s, 5s)
   │
   ├── CS2 busca config: GET /api/matches/{id}/config
   │
   v
2. WARMUP (jogadores conectam, fazem .ready)
   │
   v
3. KNIFE ROUND (knife_start → knife_won → side_picked)
   │
   v
4. LIVE (going_live)
   │ DB: status=live, is_live=true, started_at
   │
   ├── Round Loop (round_start → player_deaths → round_end)
   │   DB: match_rounds, match_events, match_player_stats
   │
   ├── Halftime (sides swap, scores persist)
   │
   v
5. MAP RESULT (map_result)
   │ DB: match_maps.winner_id
   │
   ├── Se BO3 e nao decidido: volta para KNIFE ROUND (proximo mapa)
   │
   v
6. SERIES END (series_end)
   │ DB: status=finished, winner_id, finished_at
   │ Chama finish API → advanceTeamsInBracket()
   │
   v
7. BRACKET ADVANCE
   Winner → proxima partida no winner bracket
   Loser → proxima partida no loser bracket
   Se ambos times definidos → status=scheduled (pronta para veto)
```

## Troubleshooting

### "matchzy_loadmatch_url" rejeita load
**Causa:** Ja tem partida ativa no servidor.
**Solucao:** Enviar `css_endmatch` antes. O sistema ja faz isso automaticamente.

### Stats nao persistem
1. Verificar `MATCHZY_AUTH_TOKEN` bate entre .env.local e GOTV server
2. Verificar que jogadores tem `steam_id` em `team_players` ou `profiles`
3. Ver logs do GOTV server: `[Persistence]` ou `[MatchZy]`

### Bracket nao avanca
1. Verificar se `matches.round` esta correto (ex: `winner_quarter_1`)
2. Verificar se proxima partida existe no torneio
3. Verificar logs de `advanceTeamsInBracket` no Vercel

### matchid invalido
**Sintoma:** MatchZy rejeita config com erro de matchid.
**Causa:** matchid nao e integer ou excede Int32.
**Verificar:** O endpoint /api/matches/{id}/config gera matchid automaticamente. Se o UUID comeca com hex > 7FFFFFFF, o modulo garante que fica no range.
