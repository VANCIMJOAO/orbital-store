# Componentes, Hooks e Contexts

## Paginas Principais

### Publicas (/campeonatos/*)

| Rota | Arquivo | Descricao |
|------|---------|-----------|
| `/campeonatos` | `src/app/campeonatos/page.tsx` | Hub: ranking, top players, premiacao, partidas do dia |
| `/campeonatos/ao-vivo` | `src/app/campeonatos/ao-vivo/page.tsx` | Partidas ao vivo (polling via useGOTVMatches) |
| `/campeonatos/partida/[matchId]` | `src/app/campeonatos/partida/[matchId]/page.tsx` | **Pagina principal** - scorebot, scoreboard, game log, kill feed |
| `/campeonatos/partidas` | `src/app/campeonatos/partidas/page.tsx` | Historico de partidas |
| `/campeonatos/jogador/[profileId]` | `src/app/campeonatos/jogador/[profileId]/page.tsx` | Perfil do jogador com stats |
| `/campeonatos/time/[teamId]` | `src/app/campeonatos/time/[teamId]/page.tsx` | Detalhes do time + roster |
| `/campeonatos/estatisticas` | `src/app/campeonatos/estatisticas/page.tsx` | Dashboard de estatisticas |
| `/campeonatos/bracket` | `src/app/campeonatos/bracket/page.tsx` | Bracket visual |
| `/campeonatos/resultados` | `src/app/campeonatos/resultados/page.tsx` | Resultados do torneio |
| `/campeonatos/login` | `src/app/campeonatos/login/page.tsx` | Login |
| `/campeonatos/cadastro` | `src/app/campeonatos/cadastro/page.tsx` | Cadastro |
| `/campeonatos/perfil` | `src/app/campeonatos/perfil/page.tsx` | Perfil do usuario |
| `/campeonatos/regras` | `src/app/campeonatos/regras/page.tsx` | Regras |

### Admin (/admin/*)

| Rota | Descricao |
|------|-----------|
| `/admin` | Dashboard admin |
| `/admin/campeonatos` | Lista de torneios |
| `/admin/campeonatos/novo` | Criar torneio |
| `/admin/campeonatos/[id]` | Editar torneio + bracket + veto |
| `/admin/partidas` | Lista de partidas |
| `/admin/partidas/[id]` | Controles: iniciar, finalizar, restaurar round, load server |
| `/admin/times` | Lista de times |
| `/admin/times/[id]` | Editar roster do time |
| `/admin/jogadores` | Lista de jogadores |

### E-commerce

| Rota | Descricao |
|------|-----------|
| `/` ou `/home` | Landing page |
| `/product/[id]` | Detalhe do produto |
| `/checkout/sucesso` | Pagamento confirmado |
| `/checkout/cancelado` | Pagamento cancelado |
| `/pedidos` | Historico de pedidos |

---

## Componentes Reutilizaveis

### Navegacao

**Navbar.tsx** - Barra de navegacao superior
- Logo, links de navegacao, AuthButton
- Menu hamburger responsivo para mobile
- Highlighting de rota ativa

**Footer.tsx** - Rodape
- Links (regras, sobre, Discord)
- Social media, copyright

**AuthButton.tsx** - Botao login/logout
- Se nao logado: link "Login"
- Se logado: dropdown com perfil, times, pedidos, logout
- Se admin: link para dashboard admin

### Torneio

**TournamentHeader.tsx** - Header de torneio
- Props: `tournament` (nome, datas, premiacao, formato, best_of)
- Renderiza: nome, duracao, prize pool, badge de formato, botao join

**TournamentBracket.tsx** - Bracket visual
- Props: `matches[]`, `teams[]`, `roundOrder[]`
- Renderiza grid visual: quartas → semis → finais (winner + loser)
- State: selectedRound, expandedMatch
- Click em match → navega para pagina da partida

### E-commerce

**ProductCard.tsx** - Card de produto
- Props: `product` (id, name, price, image_url, variants[])
- Renderiza: imagem, nome, preco, seletor de tamanho/cor, botao add to cart
- State: selectedSize, selectedColor

**ProductGrid.tsx** - Grid de produtos
- Props: `products[]`, `loading`, `filters`, `onFilterChange`
- Renderiza: sidebar filtros (categoria, preco, busca) + grid responsivo (1-4 cols)

### Protecao

**ProtectedRoute.tsx** - Gate de autenticacao
- Props: `children`, `fallback?`
- Se nao autenticado → redirect `/campeonatos/login`
- Se carregando → spinner

**RequireAdmin.tsx** - Gate de admin
- Props: `children`
- Se nao admin → "Acesso Negado" ou redirect
- Se admin → renderiza children

**RequireTournamentProfile.tsx** - Gate de perfil de torneio
- Props: `tournamentId`, `children`
- Verifica se usuario tem time no torneio

### Utilidades

**Toast.tsx** - Notificacoes
- Tipos: success (verde), error (vermelho), warning (amarelo), info (azul)
- Auto-dismiss com duracao configuravel
- Portal no body, posicao top-right, stackable

**CountdownDrop.tsx** - Timer de drops
- Props: `drops[]`
- Countdown em tempo real (days, hours, min, sec)
- Atualiza a cada 1s via setInterval

**PlaceholderImage.tsx** - Imagem com fallback
- Props: `src`, `alt`, `fallback?`
- onError → carrega fallback
- Loading skeleton enquanto carrega

---

## Hooks

### useGOTV (principal)

Conexao WebSocket com GOTV server para dados em tempo real.

```typescript
const {
  isConnected,      // boolean
  isConnecting,     // boolean
  error,            // string | null
  matchState,       // GOTVMatchState | null
  matchZyState,     // MatchZyState | null
  players,          // GOTVPlayerState[]
  events,           // GOTVEvent[]
  killFeed,         // KillFeedEntry[] (ultimos 50)
  roundHistory,     // RoundHistoryEntry[]
  gameLog,          // GameLogEvent[] (ultimos 100)
  team1,            // MatchTeamInfo | null
  team2,            // MatchTeamInfo | null
  phase,            // MatchPhase ('idle'|'warmup'|'knife'|'live'|...)
  isCapturing,      // boolean
  connect,          // () => void
  disconnect,       // () => void
} = useGOTV({
  matchId: "uuid",
  serverUrl: "wss://gotv-server",   // default: env var
  autoReconnect: true,               // default: true
  reconnectInterval: 5000,           // default: 5000ms
});
```

**Auto-reconnect:**
- Se ja conectou 1x: reconecta infinitamente
- Se nunca conectou: max 3 tentativas
- Backoff exponencial

**Heartbeat:** Ping a cada 30s para manter conexao viva.

**Processamento de mensagens:**
- `connected` / `match_state` → setMatchState, setPlayers
- `event` tipo kill → adiciona ao killFeed + gameLog
- `event` tipo round_end → adiciona ao roundHistory + gameLog
- `matchzy_state` → setMatchZyState

### useAuth

State de autenticacao.

```typescript
const {
  user,           // User | null (Supabase Auth)
  profile,        // Profile | null (tabela profiles)
  isAdmin,        // boolean
  isLoggedIn,     // boolean
  isLoading,      // boolean
  login,          // (email, password) => Promise<void>
  logout,         // () => Promise<void>
  refreshProfile, // () => Promise<void>
} = useAuth();
```

Usa `supabase.auth.onAuthStateChange()` para sincronizar automaticamente.

### useCart (Zustand)

Carrinho de compras com persistencia em localStorage.

```typescript
const {
  items,           // CartItem[]
  total,           // number (soma)
  addItem,         // (product, variant, qty) => void
  removeItem,      // (itemId) => void
  updateQuantity,  // (itemId, qty) => void
  clear,           // () => void
} = useCart();
```

### useProducts

Lista e filtragem de produtos.

```typescript
const {
  products,       // Product[]
  isLoading,      // boolean
  filters,        // FilterState
  applyFilter,    // (filters) => void
  clearFilters,   // () => void
  sortProducts,   // (sortBy) => void
} = useProducts();
```

### useDrops

Drops com countdown.

```typescript
const {
  drops,          // Drop[]
  activeDrops,    // Drop[] (apenas ativos)
  timeRemaining,  // { [dropId]: ms }
} = useDrops();
```

Atualiza countdown a cada 1s.

---

## Contexts

### AuthContext

Provider: `AuthProvider` (envolve toda app no root layout)

```typescript
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp(email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}
```

### ToastContext

Provider: `ToastProvider` (envolve toda app no root layout)

```typescript
interface ToastContextType {
  showSuccess(message: string): void;
  showError(message: string): void;
  showInfo(message: string): void;
  showWarning(message: string): void;
}
```

---

## Lib (Utilitarios)

### supabase.ts / supabase-browser.ts / supabase-server.ts
3 clients Supabase:
- `supabase.ts` - Client browser (singleton, anon key)
- `supabase-browser.ts` - SSR-safe browser client
- `supabase-server.ts` - Server-side com service role key (API routes)

### bracket.ts
- `advanceTeamsInBracket()` - Move winner/loser para proximas partidas
- `checkAndActivateMatch()` - Ativa partida quando ambos times definidos

### constants.ts
- `CS2_MAP_POOL` - 7 mapas: mirage, ancient, inferno, nuke, overpass, anubis, dust2
- `MAP_DISPLAY_NAMES` - Nomes amigaveis
- `MAP_COLORS` - Gradientes por mapa
- `VETO_SEQUENCE_BO1` - 6 bans
- `VETO_SEQUENCE_BO3` - 2 bans, 2 picks, 2 bans

### admin-auth.ts
- `requireAdmin()` - Middleware: valida JWT + verifica `profiles.is_admin`
- Retorna `{ user, profile }` ou `NextResponse` de erro (401/403)

### validation.ts
- Validadores de formulario (email, username, password)

### logger.ts
- `createLogger(context)` - Logger com timestamp e contexto
- Metodos: `info()`, `warn()`, `error()`, `debug()` (dev only)

### database.types.ts
- Tipos TypeScript auto-gerados do Supabase
- Type safety para todas operacoes no banco

### gotv/types.ts
- `GOTVMatchState`, `GOTVPlayerState`, `KillFeedEntry`
- `GameLogEvent`, `RoundHistoryEntry`, `MatchZyState`
- `MatchPhase` = 'idle' | 'warmup' | 'knife' | 'live' | 'halftime' | 'overtime' | 'paused' | 'finished'

### stripe.ts
- Configuracao Stripe (price IDs, client instance)
