# API Reference

## Autenticacao

**Admin routes:** Requerem cookie JWT do Supabase Auth + `profiles.is_admin = true`.
O middleware `requireAdmin()` valida ambos. Retorna 401 (nao autenticado) ou 403 (nao admin).

**Webhook routes:** Requerem header `Authorization: Bearer {token}`.

**Public routes:** Sem autenticacao.

---

## Match Endpoints

### GET /api/matches/[id]
Busca detalhes de uma partida.

**Auth:** Public

**Response:**
```json
{
  "id": "uuid",
  "tournament_id": "uuid",
  "team1": { "id": "uuid", "name": "Team Alpha", "tag": "ALPH", "logo_url": "..." },
  "team2": { "id": "uuid", "name": "Team Beta", "tag": "BETA", "logo_url": "..." },
  "team1_score": 13,
  "team2_score": 7,
  "status": "live",
  "round": "winner_quarter_1",
  "best_of": 1,
  "scheduled_at": "2026-02-10T15:00:00Z",
  "started_at": "2026-02-10T15:05:00Z",
  "is_live": true,
  "winner_id": null,
  "map_name": "de_ancient",
  "veto_data": { "steps": [...], "maps": ["de_ancient"], "completed": true },
  "tournament": { "id": "uuid", "name": "Copa Orbital", "slug": "copa-orbital" }
}
```

---

### PATCH /api/matches/[id]
Atualiza campos de uma partida.

**Auth:** Admin

**Body (campos opcionais):**
```json
{
  "team1_score": 13,
  "team2_score": 7,
  "status": "finished",
  "match_phase": "finished",
  "winner_id": "uuid",
  "scheduled_at": "2026-02-10T15:00:00Z",
  "started_at": "2026-02-10T15:05:00Z",
  "finished_at": "2026-02-10T16:00:00Z",
  "is_live": false,
  "map_name": "de_ancient"
}
```

**Campos permitidos:** team1_score, team2_score, status, match_phase, winner_id, scheduled_at, started_at, finished_at, is_live, map_name

---

### POST /api/matches/[id]/start
Inicia uma partida manualmente.

**Auth:** Admin

**Response:** `{ "success": true, "match": {...} }`

**Side effects:**
- Define `status = "live"`, `started_at = now()`

---

### POST /api/matches/[id]/finish
Finaliza partida e avanca bracket.

**Auth:** Admin

**Body:**
```json
{
  "team1_score": 13,
  "team2_score": 7
}
```

**Validacao:**
- Scores obrigatorios e diferentes entre si
- Partida nao pode ja estar finished

**Side effects:**
- Define `status = "finished"`, `winner_id`, `finished_at`
- Chama `advanceTeamsInBracket()` para mover winner/loser no bracket

---

### GET /api/matches/[id]/config
Gera JSON config para MatchZy. Chamado pelo CS2 server via `matchzy_loadmatch_url`.

**Auth:** Public (CS2 server precisa acessar)

**Response:** MatchZy config JSON
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
    "players": { "76561198000000001": "Player1", ... }
  },
  "team2": { ... },
  "cvars": {
    "matchzy_remote_log_url": "https://gotv-server/api/matchzy/events",
    "matchzy_remote_log_header_key": "Authorization",
    "matchzy_remote_log_header_value": "Bearer token",
    "orbital_match_uuid": "uuid-da-partida"
  }
}
```

**Nota sobre matchid:** UUID convertido para Int32 (primeiros 8 hex chars → decimal mod 2147483647).

---

### POST /api/matches/[id]/load-server
Envia comandos RCON via Pterodactyl para carregar partida no CS2 server.

**Auth:** Admin

**Sequencia de comandos:**
1. `css_endmatch` (encerra partida anterior)
2. Aguarda 2s
3. `matchzy_loadmatch_url "{config_url}"` (com retry: 2s, 3s, 5s)

**Response (sucesso):**
```json
{
  "success": true,
  "message": "Partida carregada no servidor",
  "command": "matchzy_loadmatch_url \"https://...\""
}
```

**Errors:**
- 500: Pterodactyl nao configurado
- 404: Partida nao encontrada
- 400: Partida ja finalizada
- 502: Falha ao conectar com o servidor (apos 3 tentativas)

---

### POST /api/matches/[id]/restore-round
Restaura partida para round anterior via RCON.

**Auth:** Admin

**Body:**
```json
{ "round": 5 }
```

**Validacao:** round >= 0, partida deve estar `status = "live"`

**Comando enviado:** `css_restore {round}`

---

## MatchZy Webhook

### POST /api/matchzy/events
Recebe eventos do plugin MatchZy no CS2 server.

**Auth:** `Authorization: Bearer {MATCHZY_WEBHOOK_SECRET}`

**Eventos processados:**

| Evento | Descricao | DB Impact |
|--------|-----------|-----------|
| `going_live` | Partida comecou | `matches.status=live`, cria `match_maps` |
| `round_end` | Round terminou | Atualiza scores, insere `match_rounds`, upsert `match_player_stats` |
| `player_death` | Jogador morreu | Insere `match_events` (kill) |
| `bomb_planted` | Bomba plantada | Insere `match_events` |
| `bomb_defused` | Bomba desarmada | Insere `match_events` |
| `map_result` | Mapa finalizado | Atualiza `match_maps` winner |
| `series_end` | Serie decidida | `matches.status=finished`, avanca bracket |
| `demo_upload_ended` | Demo uploaded | Salva `match_maps.demo_url` |
| `side_picked` | Time escolheu lado | Log |
| `knife_start` | Knife round | Log |
| `knife_won` | Knife decidiu | Log |

**Body exemplo (round_end):**
```json
{
  "event": "round_end",
  "matchid": "1425325056",
  "map_number": 0,
  "round_number": 5,
  "round_time": 95,
  "reason": 7,
  "winner": "team1",
  "team1_score": 4,
  "team2_score": 1,
  "team1": {
    "id": "team1",
    "name": "Team Alpha",
    "score": 4,
    "score_ct": 4,
    "score_t": 0,
    "players": [
      { "steamid": "76561198...", "name": "Player1", "stats": { "kills": 5, "deaths": 2, ... } }
    ]
  },
  "team2": { ... }
}
```

**Win reasons:** 1=target_bombed, 7=bomb_defused, 8=terrorists_killed, 9=cts_killed, 10=round_time_expired, 12=target_saved

---

## Stats Endpoint

### GET /api/profiles/[id]/stats
Estatisticas de um jogador.

**Auth:** Public

**Query params (opcionais):**
- `matchId` - Filtrar por partida
- `tournamentId` - Filtrar por torneio

**Response:**
```json
{
  "profileId": "uuid",
  "stats": {
    "totalMatches": 15,
    "totalKills": 234,
    "totalDeaths": 198,
    "kdRatio": 1.18,
    "adr": 78.5,
    "kast": 72.3,
    "rating": 1.12,
    "doubleKills": 12,
    "tripleKills": 3,
    "clutchWins": 5,
    "firstKillsT": 8,
    "firstKillsCT": 6,
    "flashAssists": 15
  }
}
```

---

## Admin Endpoints

### POST /api/admin/toggle-admin
Alterna status de admin de um usuario.

**Auth:** Admin
**Body:** `{ "userId": "uuid" }`

### POST /api/admin/delete-tournament
Deleta torneio e todos dados relacionados (cascade).

**Auth:** Admin
**Body:** `{ "tournamentId": "uuid" }`

### POST /api/admin/update-player
Atualiza perfil de qualquer jogador.

**Auth:** Admin
**Body:** `{ "profileId": "uuid", "updates": { "nickname": "...", "steam_id": "..." } }`

---

## Upload Endpoints

### POST /api/upload/banner
Upload de banner de torneio (Supabase Storage).

**Auth:** Admin
**Body:** FormData com campo `file`
**Response:** `{ "success": true, "url": "https://supabase.co/storage/..." }`

### POST /api/upload/logo
Upload de logo de time (Supabase Storage).

**Auth:** Admin
**Body:** FormData com campo `file`

---

## Auth Endpoints

### GET /api/auth/callback
Callback OAuth do Supabase.

**Query:** `?code={auth_code}&next={redirect_path}`
**Response:** Redirect para `next` ou `/campeonatos`

---

## E-commerce Endpoints

### POST /api/checkout
Cria sessao de checkout Stripe.

**Body:**
```json
{
  "items": [{ "variantId": "uuid", "quantity": 1 }],
  "redirectUrl": "https://..."
}
```

**Response:** `{ "success": true, "sessionId": "cs_...", "url": "https://checkout.stripe.com/..." }`

### POST /api/webhook
Webhook do Stripe (payment events).

**Auth:** Validacao HMAC do Stripe
**Eventos:** `checkout.session.completed`, `payment_intent.failed`

---

## GOTV Server Endpoints (Go - porta 8080)

### POST /gotv/{matchId}/{fragment}/{type}
Recebe fragmento GOTV+ do CS2 server.

**Auth:** Header `X-Origin-Auth: {GOTV_AUTH_TOKEN}`
**Types:** `start`, `full`, `delta`

### GET /gotv/{matchId}/sync
Sync info do protocolo GOTV+ (fragmentos disponiveis).

### WebSocket ws://server/ws?match={matchId}
Conexao WebSocket para dados em tempo real.

**Mensagens recebidas:**
- `connected` - Estado inicial da partida
- `match_state` - Atualizacao de estado (scores, players, bomb)
- `event` - Evento do jogo (kill, round_end, bomb)
- `matchzy_state` - Estado do MatchZy (phase, teams, series)
- `fragment` - Notificacao de novo fragmento
- `pong` - Resposta ao ping

**Mensagens enviadas:**
- `{ "type": "ping" }` - Heartbeat (recomendado a cada 30s)

### GET /api/matches
Lista partidas ativas no GOTV server.

### GET /api/match/{matchId}
Estado de uma partida.

### GET /api/events/{matchId}
Eventos de uma partida.

### POST /api/setmap/{matchId}?map={name}
Define mapa manualmente.

### POST /api/teams/refresh
Recarrega cache de times do Supabase.
