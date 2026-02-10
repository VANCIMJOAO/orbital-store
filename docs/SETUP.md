# Guia de Setup

## Pre-requisitos

- Node.js 18+
- npm 9+
- Conta Supabase (https://supabase.com)
- Conta Stripe (https://stripe.com) - para loja
- Go 1.24+ - para GOTV server
- Servidor CS2 com MatchZy instalado + Pterodactyl

## 1. Instalacao do Frontend (orbital-store)

```bash
cd orbital-store
npm install
```

## 2. Configurar Variaveis de Ambiente

```bash
cp .env.example .env.local
```

Editar `.env.local` com seus valores. Ver `.env.example` para descricao de cada variavel.

### Variaveis obrigatorias para dev:

| Variavel | Onde obter |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_GOTV_SERVER_URL` | URL do seu GOTV server (ws:// ou wss://) |
| `GOTV_SERVER_URL` | Mesma URL mas com http:// ou https:// |
| `PTERODACTYL_API_URL` | URL do painel Pterodactyl |
| `PTERODACTYL_API_KEY` | Painel > Account > API Credentials |
| `PTERODACTYL_SERVER_ID` | Visivel na URL do painel: /server/{ID} |
| `MATCHZY_AUTH_TOKEN` | Token definido por voce (compartilhado com CS2 server) |
| `MATCHZY_WEBHOOK_SECRET` | Token definido por voce (validacao de webhooks) |
| `NEXT_PUBLIC_SITE_URL` | URL publica do frontend (CS2 precisa acessar) |

### Variaveis opcionais (loja):

| Variavel | Onde obter |
|----------|-----------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard > Developers > API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Developers > Webhooks |

## 3. Configurar Supabase

### 3.1 Criar projeto
1. Acesse https://supabase.com e crie um novo projeto
2. Copie URL e keys para `.env.local`

### 3.2 Rodar migrations
As migrations estao em `supabase/migrations/`. Rode-as no SQL Editor do Supabase Dashboard na ordem dos timestamps:

1. `20260205_tournament_system.sql` - Schema principal
2. `20260209_fix_rls_performance.sql` - Performance RLS
3. `20260210_enable_rls_stats_tables.sql` - RLS em stats
4. `20260211_cleanup_duplicate_policies.sql` - Limpeza
5. `20260212_index_foreign_keys.sql` - Indices FK

### 3.3 Criar admin
No Supabase SQL Editor:
```sql
UPDATE profiles SET is_admin = true WHERE id = 'SEU_USER_UUID';
```

## 4. Configurar CS2 Server

### 4.1 Instalar MatchZy
1. Instalar CounterStrikeSharp no servidor
2. Instalar plugin MatchZy

### 4.2 Configurar GOTV broadcast
No `server.cfg` ou `gamemode_competitive_server.cfg`:
```
tv_enable 1
tv_broadcast 1
tv_broadcast_url "http://SEU_GOTV_SERVER:8080/gotv"
tv_broadcast_origin_auth "SEU_GOTV_AUTH_TOKEN"
```

### 4.3 Configurar MatchZy webhooks
O webhook e configurado automaticamente via `cvars` no JSON de config gerado pelo sistema. Os cvars sao:
```
matchzy_remote_log_url = "https://SEU_GOTV_SERVER/api/matchzy/events"
matchzy_remote_log_header_key = "Authorization"
matchzy_remote_log_header_value = "Bearer SEU_MATCHZY_AUTH_TOKEN"
```

## 5. Configurar GOTV Server (Go)

### 5.1 Local
```bash
cd gotv-server
go mod download
go run .
```

### 5.2 Deploy Railway
O gotv-server tem `Dockerfile` e `railway.toml` prontos.

Variaveis de ambiente no Railway:
```
PORT=8080
GOTV_AUTH_TOKEN=seu_token
MATCHZY_AUTH_TOKEN=seu_token
FINISH_API_URL=https://seu-site.vercel.app
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=sua_service_role_key
```

## 6. Rodar em Desenvolvimento

```bash
cd orbital-store
npm run dev
```

Acesse http://localhost:3000

## 7. Build para Producao

```bash
npm run build
npm run start
```

## 8. Deploy Vercel

1. Conectar repo ao Vercel
2. Configurar variaveis de ambiente no Vercel Dashboard
3. Push para branch main → auto-deploy

## Troubleshooting

### "Pterodactyl nao configurado"
Verifique se `PTERODACTYL_API_URL`, `PTERODACTYL_API_KEY` e `PTERODACTYL_SERVER_ID` estao definidos no `.env.local`.

### "Falha ao conectar com o servidor" ao carregar partida
1. Verifique se o CS2 server esta rodando no Pterodactyl
2. Verifique se o MatchZy plugin esta instalado
3. O sistema tenta 3 vezes (2s, 3s, 5s de espera)

### WebSocket GOTV nao conecta
1. Verifique se `NEXT_PUBLIC_GOTV_SERVER_URL` esta correto
2. Use `wss://` para producao, `ws://` para local
3. Verifique se o GOTV server esta rodando

### Stats nao aparecem
1. Verifique se `MATCHZY_AUTH_TOKEN` e igual no .env.local e no GOTV server
2. Verifique se os jogadores tem `steam_id` preenchido em `team_players` ou `profiles`
3. Consulte logs do GOTV server para erros de persistencia
