# Arquitetura do Sistema

## Visao Geral

```
                                    ┌──────────────────┐
                                    │   Usuarios        │
                                    │   (Browser)       │
                                    └────────┬─────────┘
                                             │
                              HTTPS          │          WSS
                         ┌───────────────────┼──────────────────┐
                         │                   │                  │
                         v                   v                  v
              ┌──────────────────┐  ┌──────────────┐  ┌────────────────┐
              │   Vercel         │  │   Vercel     │  │  Railway       │
              │   Next.js Pages  │  │   API Routes │  │  GOTV Server   │
              │   (Frontend)     │  │   (Backend)  │  │  (Go/WebSocket)│
              └──────────────────┘  └──────┬───────┘  └───────┬────────┘
                                           │                  │
                                           │ REST             │ REST
                                           v                  v
                                    ┌──────────────────────────────┐
                                    │      Supabase                │
                                    │  PostgreSQL + Auth + Storage │
                                    └──────────────────────────────┘
                                                  ^
                                                  │ REST (stats)
              ┌──────────────────┐                │
              │  Pterodactyl     │     ┌──────────┴────────┐
              │  Panel           │     │  GOTV Server (Go) │
              │  (CS2 Control)   │     │  - BroadcastParser│
              └────────┬─────────┘     │  - MatchZyHandler │
                       │ RCON          │  - StatsPersister │
                       v               └──────────┬────────┘
              ┌──────────────────┐                │
              │  CS2 Server      │  GOTV+ Frags   │
              │  + MatchZy       ├────────────────┘
              │  Plugin          │  Webhooks
              └──────────────────┘
```

## Componentes

### 1. Frontend (Next.js - Vercel)

**Tipo:** App Router (Next.js 16)
**Framework:** React 19 + TypeScript
**Styling:** Tailwind CSS 4
**State:** Zustand (cart), React Context (auth, toasts)

**Paginas publicas** (`/campeonatos/*`):
- Hub do torneio com ranking, top players, premiacao
- Partida ao vivo com scorebot, scoreboard, game log
- Perfil de jogador com estatisticas
- Bracket visual
- Login/Cadastro/Perfil

**Paginas admin** (`/admin/*`):
- Gerenciamento de torneios, times, jogadores
- Controle de partidas (veto, iniciar, finalizar, restaurar round)
- Bracket com edicao

**E-commerce** (`/product/*`, `/checkout/*`, `/pedidos/*`):
- Catalogo de produtos
- Checkout Stripe
- Historico de pedidos

### 2. API Routes (Next.js - Vercel)

**Auth:** Supabase Auth (JWT cookies) + middleware `requireAdmin()`

Endpoints principais:
- `GET/PATCH /api/matches/[id]` - CRUD de partidas
- `POST /api/matches/[id]/start` - Iniciar partida
- `POST /api/matches/[id]/finish` - Finalizar + avancar bracket
- `POST /api/matches/[id]/load-server` - Carregar config via Pterodactyl RCON
- `POST /api/matches/[id]/restore-round` - Restaurar round via RCON
- `GET /api/matches/[id]/config` - Gerar JSON config para MatchZy
- `POST /api/matchzy/events` - Webhook receiver (MatchZy)
- `GET /api/profiles/[id]/stats` - Estatisticas do jogador

### 3. GOTV Server (Go - Railway)

**Porta:** 8080 (configuravel via `PORT` ou `GOTV_PORT`)

**Responsabilidades:**
1. Receber fragmentos GOTV+ do CS2 server (`POST /gotv/{matchId}/{fragment}/{type}`)
2. Parsear broadcasts com demoinfocs-golang (kills, rounds, bomb, player states)
3. Transmitir estado via WebSocket para frontends (`ws://server/ws?match={id}`)
4. Receber webhooks MatchZy (`POST /api/matchzy/events`)
5. Persistir stats no Supabase (match_player_stats, match_rounds, match_events)
6. Identificar times via SteamID lookup contra roster do Supabase
7. Chamar finish API do Next.js para avancar bracket

**Modulos:**
- `main.go` - HTTP server, WebSocket, fragment management
- `parser.go` - BroadcastParser (demoinfocs-golang)
- `matchzy.go` - MatchZyHandler (webhook processing, state management)
- `persistence.go` - StatsPersister, EventPersister (Supabase writes)
- `teams.go` - TeamIdentifier, TeamRegistryCache (SteamID → team mapping)
- `supabase.go` - SupabaseClient (REST API wrapper)
- `map_extractor.go` - Extracao de mapa dos fragmentos

### 4. CS2 Server (Pterodactyl)

**Plugin:** MatchZy (CounterStrikeSharp)
**Painel:** Pterodactyl Client API

**Configuracao do CS2:**
```
tv_enable 1
tv_broadcast 1
tv_broadcast_url "http://GOTV_SERVER:8080/gotv"
tv_broadcast_origin_auth "GOTV_AUTH_TOKEN"
```

**Configuracao do MatchZy:**
```
matchzy_remote_log_url "http://GOTV_SERVER:8080/api/matchzy/events"
matchzy_remote_log_header_key "Authorization"
matchzy_remote_log_header_value "Bearer MATCHZY_AUTH_TOKEN"
```

### 5. Supabase

- **PostgreSQL 17:** Banco relacional com RLS (Row Level Security)
- **Auth:** OAuth + email/password, JWT cookies
- **Storage:** Banners de torneio, logos de times

## Fluxo de Dados: Match Lifecycle

```
1. VETO (Admin UI)
   Admin bans 6 mapas → salva veto_data no DB
   → Auto-trigger: POST /api/matches/{id}/load-server

2. LOAD SERVER (Next.js → Pterodactyl → CS2)
   css_endmatch → wait 2s → matchzy_loadmatch_url "config_url"
   CS2 faz GET /api/matches/{id}/config → recebe JSON config

3. WARMUP (CS2 Server)
   Jogadores conectam, fazem .ready

4. GOING LIVE (CS2 → GOTV Server webhook)
   MatchZy envia going_live → DB: status=live, is_live=true
   GOTV+ fragments comecam a chegar

5. ROUNDS (CS2 → GOTV Server → Frontends)
   Cada round_end: atualiza scores, persiste stats
   Parser: extrai kills, bomb events → broadcast WebSocket
   Frontend: useGOTV hook recebe e renderiza em tempo real

6. MAP RESULT (CS2 → GOTV Server → DB)
   map_result: atualiza match_maps, scores finais do mapa

7. SERIES END (CS2 → GOTV Server → Next.js API)
   series_end: persiste stats finais
   GOTV Server chama POST /api/matches/{id}/finish
   Next.js: marca finished, define winner, advanceTeamsInBracket()

8. BRACKET ADVANCE (Next.js → DB)
   Winner → proxima partida no winner bracket
   Loser → proxima partida no loser bracket
   Se ambos times definidos → ativa partida (status=scheduled)
```

## Bracket Double Elimination (8 Times)

```
WINNER BRACKET                    LOSER BRACKET

winner_quarter_1 ─┐               loser_round1_1 ─┐
                   ├─ winner_semi_1                 ├─ loser_round2_1 ─┐
winner_quarter_2 ─┘               loser_round1_2 ─┘                   │
                                                                       ├─ loser_semi ─┐
winner_quarter_3 ─┐               (losers from semi)                  │               │
                   ├─ winner_semi_2                 ┌─ loser_round2_2 ─┘               │
winner_quarter_4 ─┘               (losers from qf) ┘                                  │
                                                                                       │
winner_semi_1 ─┐                                                                       │
               ├─ winner_final ──── GRAND FINAL                                        │
winner_semi_2 ─┘                        ^          loser_semi winner ─ loser_final ─────┘
                                        │                                    │
                                        └────────────────────────────────────┘
```

**Round names no DB (`matches.round`):**
- Winner: `winner_quarter_1-4`, `winner_semi_1-2`, `winner_final`
- Loser: `loser_round1_1-2`, `loser_round2_1-2`, `loser_semi`, `loser_final`
- Grand Final: `grand_final`

## Autenticacao e Autorizacao

1. **Supabase Auth:** Login por email/senha, OAuth. Gera JWT no cookie.
2. **requireAdmin():** Middleware server-side. Valida JWT + checa `profiles.is_admin`.
3. **ProtectedRoute:** Wrapper client-side. Redireciona se nao autenticado.
4. **RequireAdmin:** Wrapper client-side. Redireciona se nao admin.
5. **Webhook auth:** Bearer token no header Authorization (MatchZy → GOTV/Next.js).
6. **GOTV fragment auth:** Header X-Origin-Auth (CS2 → GOTV Server).

## Deploy

| Servico | Plataforma | Build |
|---------|-----------|-------|
| orbital-store | Vercel | `npm run build` (auto-deploy no push) |
| gotv-server | Railway | Docker multi-stage (Go compile → Alpine runtime) |
| Supabase | Supabase Cloud | Migrations em `supabase/migrations/` |
