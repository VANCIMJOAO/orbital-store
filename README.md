# Orbital Roxa - CS2 Tournament System

Sistema completo de gerenciamento de torneios CS2 com scoreboard ao vivo, bracket double elimination, estatisticas de jogadores e loja streetwear.

## Stack

| Componente | Tecnologia | Deploy |
|-----------|-----------|--------|
| Frontend + API | Next.js 16.1.6, React 19, TypeScript | Vercel |
| GOTV Server | Go 1.24, gorilla/websocket, demoinfocs-golang | Railway |
| Banco de Dados | Supabase (PostgreSQL 17) | Supabase Cloud |
| Pagamentos | Stripe | - |
| CS2 Server | MatchZy (CounterStrikeSharp) | Pterodactyl |

## Estrutura do Projeto

```
orbitalroxa/
  orbital-store/     # Next.js app (frontend + API)
  gotv-server/       # Go WebSocket server (real-time)
  orbital-ads/       # Python billboard generator (CS2 sponsors)
```

## Quick Start

```bash
# 1. Clonar e instalar
cd orbital-store
npm install

# 2. Configurar ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 3. Rodar dev server
npm run dev
# Abrir http://localhost:3000
```

## Documentacao

| Documento | Descricao |
|-----------|-----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura do sistema, fluxo de dados, diagramas |
| [docs/SETUP.md](docs/SETUP.md) | Guia completo de instalacao e configuracao |
| [docs/API.md](docs/API.md) | Todos os endpoints REST e WebSocket |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema do banco, tabelas, relacionamentos |
| [docs/GOTV.md](docs/GOTV.md) | Integracao GOTV server (Go + WebSocket) |
| [docs/MATCHZY.md](docs/MATCHZY.md) | Integracao MatchZy, comandos, lifecycle |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | Componentes React, hooks, contexts |

## Funcionalidades Principais

### Torneios
- Bracket Double Elimination (8 times)
- Veto de mapas (BO1/BO3)
- Avanco automatico de bracket
- Scoreboard ao vivo estilo HLTV
- Estatisticas detalhadas (ADR, KAST, Rating 2.0)
- Game log com todos eventos por round
- Kill feed em tempo real

### Admin
- Gerenciamento de torneios, times e jogadores
- Controle manual de partidas (iniciar, finalizar, restaurar round)
- Carregamento automatico de config no servidor CS2
- Bracket visual com edicao

### Loja
- Catalogo de produtos streetwear
- Checkout com Stripe
- Sistema de drops com countdown
- Gerenciamento de pedidos

## Design System

| Token | Cor | Uso |
|-------|-----|-----|
| Background Primary | `#0A0A0A` | Fundo principal |
| Background Secondary | `#0f0f15` | Cards, sections |
| Background Tertiary | `#12121a` | Elementos elevados |
| Accent | `#A855F7` | Destaques, botoes, links |
| CT | `#3b82f6` | Counter-Terrorists |
| T | `#f59e0b` | Terrorists |
| Text Primary | `#F5F5DC` | Texto principal |
| Text Secondary | `#A1A1AA` | Texto secundario |

## Scripts

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Build para producao
npm run start    # Servir build de producao
npm run lint     # ESLint
```

## Variaveis de Ambiente

Ver [.env.example](.env.example) para lista completa. Documentacao detalhada em [docs/SETUP.md](docs/SETUP.md).
