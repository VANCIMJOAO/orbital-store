# Database Schema

Banco: **Supabase PostgreSQL 17** com Row Level Security (RLS).

## Diagrama de Relacionamentos

```
tournaments
  │ 1:N
  ├── tournament_teams (team_id FK)
  │     └── teams
  │
  └── matches (team1_id, team2_id FK → teams)
        │ 1:N
        ├── match_maps
        │     │ 1:N
        │     ├── match_rounds
        │     ├── match_events
        │     └── match_player_stats
        │
        └── (winner_id FK → teams)

teams
  │ 1:N
  └── team_players (profile_id FK → profiles)

profiles ← auth.users (1:1)
  │ 1:N
  └── match_player_stats

products
  │ 1:N
  └── product_variants
        │ 1:N
        └── order_items

customers
  │ 1:N
  └── orders
        │ 1:N
        └── order_items
```

---

## Tabelas de Torneio

### tournaments
```sql
id              UUID PRIMARY KEY
name            TEXT NOT NULL
slug            TEXT UNIQUE
description     TEXT
rules           TEXT
format          TEXT                -- 'double_elimination', 'round_robin'
best_of         INTEGER             -- 1, 3, 5
prize_pool      NUMERIC
start_date      TIMESTAMP
end_date        TIMESTAMP
status          TEXT                -- 'draft', 'open', 'in_progress', 'finished'
organizer_id    UUID FK → profiles
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()
```

### teams
```sql
id              UUID PRIMARY KEY
name            TEXT NOT NULL
tag             TEXT                -- Abreviacao (2-4 chars)
logo_url        TEXT
region          TEXT
owner_id        UUID FK → profiles
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()
```

### tournament_teams
```sql
tournament_id   UUID FK → tournaments  (PK composta)
team_id         UUID FK → teams        (PK composta)
seed            INTEGER                -- Posicao no bracket
entry_type      TEXT                   -- 'open', 'direct_invite'
joined_at       TIMESTAMP DEFAULT now()
```

### team_players
```sql
id              UUID PRIMARY KEY
team_id         UUID FK → teams
profile_id      UUID FK → profiles
steam_id        TEXT                   -- Override do steam_id do profile
nickname        TEXT                   -- Nome dentro do time
role            TEXT                   -- 'player', 'manager', 'coach'
is_active       BOOLEAN DEFAULT true
joined_at       TIMESTAMP DEFAULT now()

INDEXES: team_id, profile_id
```

**Nota:** `steam_id` aqui tem prioridade sobre `profiles.steam_id` na geracao da config MatchZy.

---

## Tabelas de Match

### matches
```sql
id              UUID PRIMARY KEY
tournament_id   UUID FK → tournaments
team1_id        UUID FK → teams (NULLABLE - preenchido pelo bracket)
team2_id        UUID FK → teams (NULLABLE)
team1_score     INTEGER DEFAULT 0
team2_score     INTEGER DEFAULT 0
status          TEXT DEFAULT 'scheduled'  -- 'scheduled', 'live', 'finished', 'cancelled'
round           TEXT                      -- 'winner_quarter_1', 'loser_final', 'grand_final', etc.
best_of         INTEGER DEFAULT 1
match_phase     TEXT                      -- 'warmup', 'knife', 'live', 'paused', 'finished'
scheduled_at    TIMESTAMP
started_at      TIMESTAMP
finished_at     TIMESTAMP
is_live         BOOLEAN DEFAULT false
winner_id       UUID FK → teams (NULLABLE)
map_name        TEXT                      -- 'de_mirage', 'de_ancient', etc.
veto_data       JSONB                     -- { first_team, steps[], maps[], completed }
matchzy_config  JSONB                     -- Config JSON enviado ao MatchZy
stream_url      TEXT
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()

INDEXES: tournament_id, team1_id, team2_id, round, status
```

**Valores de `round`:**
- Winner: `winner_quarter_1`, `winner_quarter_2`, `winner_quarter_3`, `winner_quarter_4`, `winner_semi_1`, `winner_semi_2`, `winner_final`
- Loser: `loser_round1_1`, `loser_round1_2`, `loser_round2_1`, `loser_round2_2`, `loser_semi`, `loser_final`
- Grand Final: `grand_final`

### match_maps
```sql
id              UUID PRIMARY KEY
match_id        UUID FK → matches
map_name        TEXT                -- 'de_ancient', 'de_inferno', etc.
map_order       INTEGER             -- 0, 1, 2 (para BO3)
status          TEXT                -- 'pending', 'in_progress', 'finished'
team1_score     INTEGER DEFAULT 0
team2_score     INTEGER DEFAULT 0
winner_id       UUID FK → teams (NULLABLE)
demo_url        TEXT                -- URL do demo apos upload
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()

INDEXES: match_id
```

### match_rounds
```sql
id                  UUID PRIMARY KEY
match_id            UUID FK → matches
match_map_id        UUID FK → match_maps
round_number        INTEGER
winner_team_id      UUID FK → teams
win_reason          TEXT              -- 'target_bombed', 'bomb_defused', 'terrorists_killed', etc.
ct_team_id          UUID FK → teams
t_team_id           UUID FK → teams
ct_score            INTEGER
t_score             INTEGER
ct_equipment_value  INTEGER
t_equipment_value   INTEGER
duration_seconds    INTEGER
bomb_planted_by     UUID FK → profiles (NULLABLE)
bomb_defused_by     UUID FK → profiles (NULLABLE)
first_kill_by       UUID FK → profiles (NULLABLE)
created_at          TIMESTAMP DEFAULT now()

UNIQUE: (match_id, round_number)
INDEXES: match_id, round_number
```

### match_events
```sql
id                      UUID PRIMARY KEY
match_id                UUID FK → matches
match_map_id            UUID FK → match_maps
round_number            INTEGER
event_type              TEXT          -- 'kill', 'bomb_planted', 'bomb_defused', 'bomb_exploded'
attacker_profile_id     UUID FK → profiles (NULLABLE)
victim_profile_id       UUID FK → profiles (NULLABLE)
assister_profile_id     UUID FK → profiles (NULLABLE)
weapon                  TEXT          -- 'ak47', 'awp', 'knife', etc.
bomb_site               TEXT          -- 'A', 'B'
metadata                JSONB         -- { headshot, wallbang, throughSmoke, noScope, etc. }
timestamp               TIMESTAMP
created_at              TIMESTAMP DEFAULT now()

INDEXES: match_id, round_number, event_type
```

### match_player_stats
```sql
id                  UUID PRIMARY KEY
match_id            UUID FK → matches
match_map_id        UUID FK → match_maps
profile_id          UUID FK → profiles
team_id             UUID FK → teams
kills               INTEGER DEFAULT 0
deaths              INTEGER DEFAULT 0
assists             INTEGER DEFAULT 0
headshots           INTEGER DEFAULT 0
total_damage        INTEGER DEFAULT 0
adr                 DECIMAL                -- Average Damage per Round
kast_percentage     DECIMAL                -- % rounds com Kill/Assist/Survive/Trade
rating              DECIMAL                -- HLTV Rating 2.0
rounds_played       INTEGER DEFAULT 0
rounds_with_kill    INTEGER DEFAULT 0
rounds_survived     INTEGER DEFAULT 0
first_kills         INTEGER DEFAULT 0
first_deaths        INTEGER DEFAULT 0
clutch_wins         INTEGER DEFAULT 0
clutch_attempts     INTEGER DEFAULT 0
two_kills           INTEGER DEFAULT 0
three_kills         INTEGER DEFAULT 0
four_kills          INTEGER DEFAULT 0
aces                INTEGER DEFAULT 0
flash_assists       INTEGER DEFAULT 0
enemies_flashed     INTEGER DEFAULT 0
ct_kills            INTEGER DEFAULT 0
t_kills             INTEGER DEFAULT 0
ct_deaths           INTEGER DEFAULT 0
t_deaths            INTEGER DEFAULT 0
created_at          TIMESTAMP DEFAULT now()

UNIQUE: (match_id, match_map_id, profile_id)
INDEXES: match_id, profile_id, team_id
```

**Rating HLTV 2.0:**
```
rating = (0.0073 * ADR) + (0.3591 * KPR) + (-0.5329 * DPR) + (0.2372 * KAST/100) + (0.0032 * RMK) + 0.1587

Onde:
  KPR = kills / rounds_played
  DPR = deaths / rounds_played
  ADR = total_damage / rounds_played
  RMK = (1k + 4*2k + 9*3k + 16*4k + 25*ace) / rounds_played
  KAST = kast_percentage (0-100)
```

---

## Tabelas de Usuario

### profiles
Estende `auth.users` do Supabase Auth (1:1 por `id`).

```sql
id              UUID PRIMARY KEY FK → auth.users
username        TEXT UNIQUE
avatar_url      TEXT
level           INTEGER
steam_id        TEXT UNIQUE         -- Steam64 ID
discord_id      TEXT
twitch_handle   TEXT
bio             TEXT
is_admin        BOOLEAN DEFAULT false
is_verified     BOOLEAN DEFAULT false
total_kills     INTEGER DEFAULT 0   -- Agregado
total_deaths    INTEGER DEFAULT 0   -- Agregado
total_matches   INTEGER DEFAULT 0   -- Agregado
average_rating  FLOAT DEFAULT 0     -- Agregado
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()

INDEXES: username, steam_id, discord_id
```

---

## Tabelas de E-commerce

### products
```sql
id              UUID PRIMARY KEY
name            TEXT
description     TEXT
price           NUMERIC
category        TEXT          -- 'apparel', 'accessories'
image_url       TEXT
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()
```

### product_variants
```sql
id              UUID PRIMARY KEY
product_id      UUID FK → products
size            TEXT          -- 'XS', 'S', 'M', 'L', 'XL', 'XXL'
color           TEXT
sku             TEXT UNIQUE
stock_quantity  INTEGER
created_at      TIMESTAMP DEFAULT now()
```

### customers
```sql
id                  UUID PRIMARY KEY
email               TEXT UNIQUE
name                TEXT
phone               TEXT
discord_id          TEXT
discord_username    TEXT
is_member           BOOLEAN DEFAULT false
created_at          TIMESTAMP DEFAULT now()
updated_at          TIMESTAMP DEFAULT now()
```

### orders
```sql
id                  UUID PRIMARY KEY
customer_id         UUID FK → customers
total_amount        NUMERIC
status              TEXT          -- 'pending', 'paid', 'shipped', 'delivered'
payment_method      TEXT          -- 'stripe', 'pix'
stripe_session_id   TEXT
created_at          TIMESTAMP DEFAULT now()
updated_at          TIMESTAMP DEFAULT now()
```

### order_items
```sql
id                  UUID PRIMARY KEY
order_id            UUID FK → orders
product_variant_id  UUID FK → product_variants
product_name        TEXT
product_size        TEXT
quantity            INTEGER
unit_price          NUMERIC
created_at          TIMESTAMP DEFAULT now()
```

### drops
```sql
id              UUID PRIMARY KEY
name            TEXT
slug            TEXT UNIQUE
description     TEXT
release_date    TIMESTAMP
is_active       BOOLEAN DEFAULT false
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()
```

---

## Row Level Security (RLS)

| Tabela | Leitura | Escrita |
|--------|---------|---------|
| tournaments | Publica | Organizador |
| teams | Publica | Owner |
| tournament_teams | Publica | Organizador do torneio |
| team_players | Publica | Owner do time |
| matches | Publica | Organizador do torneio |
| match_maps | Publica | Admin |
| match_rounds | Publica | Admin |
| match_events | Publica | Admin |
| match_player_stats | Publica | Admin |
| profiles | Publica | Self ou Admin |
| products | Publica | Admin |
| product_variants | Publica | Admin |
| customers | Create publica, Read self | Admin |
| orders | Read self | Admin |
| order_items | Read self | Admin |

---

## Migrations

Localizadas em `supabase/migrations/`, rodar na ordem:

1. `20260205_tournament_system.sql` - Schema principal (todas tabelas)
2. `20260209_fix_rls_performance.sql` - Otimizacao de queries RLS
3. `20260210_enable_rls_stats_tables.sql` - RLS em match_player_stats, match_rounds, match_events
4. `20260211_cleanup_duplicate_policies.sql` - Remove politicas duplicadas
5. `20260212_index_foreign_keys.sql` - Indices em foreign keys

## Map Pool CS2

Constantes definidas em `src/lib/constants.ts`:

```
de_mirage, de_ancient, de_inferno, de_nuke, de_overpass, de_anubis, de_dust2
```

Sequencias de veto:
- **BO1:** 6 bans alternados, 1 mapa restante
- **BO3:** 2 bans, 2 picks, 2 bans, 1 decider
