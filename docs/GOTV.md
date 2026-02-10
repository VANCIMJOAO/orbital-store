# GOTV Server - Integracao

## Visao Geral

O GOTV server e um aplicativo Go que:
1. Recebe fragmentos GOTV+ do CS2 server
2. Parseia broadcasts em tempo real com demoinfocs-golang
3. Extrai eventos (kills, rounds, bomb, player states)
4. Transmite via WebSocket para frontends
5. Recebe webhooks do MatchZy
6. Persiste estatisticas no Supabase

## Arquitetura

```
CS2 Server
    │
    │ POST /gotv/{matchId}/{fragment}/{type}
    │ (GOTV+ binary fragments)
    v
┌────────────────────────────────┐
│         GOTV Server (Go)       │
│                                │
│  main.go                       │
│  ├─ HTTP routes                │
│  ├─ WebSocket manager          │
│  ├─ Fragment storage           │
│  └─ Cleanup goroutines         │
│                                │
│  parser.go                     │
│  └─ BroadcastParser            │
│     (demoinfocs-golang)        │
│     ├─ Kill events             │
│     ├─ Round events            │
│     ├─ Bomb events             │
│     └─ Player state updates    │
│                                │
│  matchzy.go                    │
│  └─ MatchZyHandler             │
│     ├─ going_live              │
│     ├─ round_end               │
│     ├─ series_end              │
│     └─ State management        │
│                                │
│  teams.go                      │
│  └─ TeamIdentifier             │
│     └─ SteamID → Team lookup   │
│                                │
│  persistence.go                │
│  ├─ StatsPersister             │
│  └─ EventPersister             │
│                                │
│  supabase.go                   │
│  └─ REST client                │
└────────────┬───────────────────┘
             │
    ┌────────┼─────────┐
    │        │         │
    v        v         v
Frontend  Supabase  Next.js API
(WebSocket) (REST)  (finish API)
```

## Endpoints HTTP

| Metodo | Endpoint | Auth | Descricao |
|--------|----------|------|-----------|
| POST | `/gotv/{matchId}/{fragment}/{type}` | X-Origin-Auth | Receber fragmento GOTV+ |
| GET | `/gotv/{matchId}/sync` | - | Sync info (GOTV+ protocol) |
| GET | `/api/matches` | - | Listar partidas ativas |
| GET | `/api/match/{matchId}` | - | Estado de uma partida |
| GET | `/api/events/{matchId}` | - | Eventos de uma partida |
| POST | `/api/setmap/{matchId}?map={name}` | - | Definir mapa manualmente |
| POST | `/api/teams/refresh` | - | Recarregar cache de times |
| GET | `/ws?match={matchId}` | - | WebSocket connection |
| POST | `/api/matchzy/events` | Bearer token | Webhook do MatchZy |

## Fragment Flow

1. CS2 envia `start` fragment (keyframe inicial, ~1MB)
2. CS2 envia `full` fragments continuamente (~50KB cada)
3. CS2 envia `delta` fragments (incrementais, menores)
4. Server armazena ate **30 fragments** por tipo (FIFO)
5. Apos `start` + **3 full fragments**, inicia o BroadcastParser
6. Parser conecta de volta em `http://127.0.0.1:{port}/gotv/{matchId}` para ler fragments
7. Parser extrai game state e eventos, chama callbacks

## WebSocket Protocol

### Conexao

```javascript
const ws = new WebSocket('wss://gotv-server/ws?match=MATCH_ID');
```

**Resolucao de match ID:**
1. Busca direta pelo ID
2. Tenta mapear UUID → GOTV ID via MatchZy mapping
3. Fallback: se so 1 match ativo, usa esse

### Mensagens Recebidas

**connected** - Enviada na conexao. Inclui estado atual + replay de eventos.
```json
{
  "type": "connected",
  "matchId": "abc123",
  "data": { /* MatchState */ },
  "timestamp": 1707561825000
}
```

**match_state** - Atualizacao de estado (frequente).
```json
{
  "type": "match_state",
  "matchId": "abc123",
  "data": {
    "matchId": "abc123",
    "status": "live",
    "mapName": "de_inferno",
    "scoreCT": 5,
    "scoreT": 3,
    "currentRound": 9,
    "roundPhase": "live",
    "players": [
      {
        "steamId": "76561198...",
        "name": "Player1",
        "team": "CT",
        "health": 89,
        "armor": 100,
        "hasHelmet": true,
        "hasDefuser": true,
        "money": 1900,
        "isAlive": true,
        "activeWeapon": "ak47",
        "kills": 3,
        "deaths": 2,
        "assists": 1,
        "headshots": 2
      }
    ],
    "bomb": {
      "state": "planted",
      "site": "A",
      "timeRemaining": 25.3
    },
    "teamCT": { "id": "uuid", "name": "Team Alpha", "tag": "ALPH", "logoUrl": "..." },
    "teamT": { "id": "uuid", "name": "Team Beta", "tag": "BETA", "logoUrl": "..." }
  },
  "timestamp": 1707561825000
}
```

**event** - Evento do jogo (kill, round_end, bomb).
```json
{
  "type": "event",
  "matchId": "abc123",
  "data": {
    "type": "kill",
    "tick": 6400,
    "round": 5,
    "timestamp": "2026-02-10T15:30:45Z",
    "data": {
      "attacker": { "steamId": "111", "name": "Player1", "team": "T" },
      "victim": { "steamId": "222", "name": "Player2", "team": "CT" },
      "weapon": "ak47",
      "headshot": true,
      "penetrated": false,
      "throughSmoke": false
    }
  },
  "timestamp": 1707561825000
}
```

**matchzy_state** - Estado do MatchZy (phase, teams, series).
```json
{
  "type": "matchzy_state",
  "matchId": "abc123",
  "data": {
    "matchId": "uuid",
    "phase": "live",
    "isCapturing": true,
    "bestOf": 1,
    "currentMap": 1,
    "currentRound": 9,
    "team1": { "id": "uuid", "name": "Team Alpha", "tag": "ALPH", "score": 5 },
    "team2": { "id": "uuid", "name": "Team Beta", "tag": "BETA", "score": 3 }
  }
}
```

### Mensagens Enviadas

```json
{ "type": "ping", "timestamp": 1707561825000 }
```

Recomendado enviar ping a cada 30s. Server responde com `pong`.

### Timeouts
- **Read:** 5 minutos (reset em cada mensagem recebida)
- **Write:** 10 segundos por mensagem
- **Reconnect:** Se conexao cair, tentar reconectar com backoff

## Team Identification

O server identifica times automaticamente:

1. Extrai SteamIDs dos jogadores conectados
2. Busca no Supabase: `team_players` → `teams`
3. Agrupa por time: conta quantos jogadores de cada time estao em CT/T
4. Requer minimo **3 jogadores** do mesmo time no mesmo lado
5. Cache de times refresh a cada 5 minutos

## Configuracao

### Variaveis de Ambiente

| Variavel | Default | Descricao |
|----------|---------|-----------|
| `PORT` | 8080 | Porta HTTP (Railway usa esta) |
| `GOTV_PORT` | 8080 | Porta HTTP (alternativa) |
| `GOTV_AUTH_TOKEN` | `orbital_gotv_secret` | Auth para fragmentos GOTV+ |
| `MATCHZY_AUTH_TOKEN` | `orbital_secret_token` | Auth para webhooks MatchZy |
| `FINISH_API_URL` | `https://orbital-store.vercel.app` | URL do Next.js para finish API |
| `SUPABASE_URL` | (required) | URL do Supabase |
| `SUPABASE_KEY` | (required) | Service role key |

### Configuracao CS2 Server

```
tv_enable 1
tv_broadcast 1
tv_broadcast_url "http://GOTV_IP:8080/gotv"
tv_broadcast_origin_auth "GOTV_AUTH_TOKEN"
```

## Constantes

```go
MaxFragments           = 30               // Fragmentos por tipo em memoria
MaxEvents              = 500              // Eventos por partida
MaxMatchZyEvents       = 200              // Eventos MatchZy por partida
MatchExpirationTime    = 30 * time.Minute // Cleanup automatico
WSReadTimeout          = 5 * time.Minute
WSWriteTimeout         = 10 * time.Second
CleanupInterval        = 5 * time.Minute
MemoryLogInterval      = 2 * time.Minute
```

## Deploy

### Docker (Railway)

```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -o gotv-server .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/gotv-server .
EXPOSE 8080
CMD ["./gotv-server"]
```

### Local

```bash
cd gotv-server
go run .
```

## Monitoring

O server loga metricas de memoria a cada 2 minutos:
```
[MEM] Alloc: 156MB | Sys: 245MB | GC: 23 | Goroutines: 45 | Matches: 3 | Fragments: 85 | Clients: 12
```

**Metricas chave:**
- `Alloc` - Memoria alocada
- `Goroutines` - Goroutines ativas (detecta leaks)
- `Matches` - Partidas em memoria
- `Fragments` - Total de fragmentos armazenados
- `Clients` - Conexoes WebSocket ativas

## Troubleshooting

### Parser nao inicia
- Precisa de `start` fragment (CS2 so envia 1x no inicio do broadcast)
- Precisa de 3+ `full` fragments alem do start
- Se GOTV server reiniciar no meio da partida, precisa reiniciar broadcast no CS2: `tv_broadcast 1`

### Match nao aparece
- Verificar se CS2 tem `tv_broadcast 1` habilitado
- Verificar se `tv_broadcast_url` aponta para o GOTV server correto
- Verificar `tv_broadcast_origin_auth` bate com `GOTV_AUTH_TOKEN`

### Times nao identificados
- Verificar se jogadores tem `steam_id` preenchido em `team_players` ou `profiles`
- Forcar refresh: `POST /api/teams/refresh`
- Minimo 3 jogadores do mesmo time no mesmo lado
