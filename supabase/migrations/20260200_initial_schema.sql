-- =====================================================
-- MIGRAÇÃO INICIAL: Schema base do Orbital Roxa
-- Data: 2026-02-00 (executar ANTES de todas as outras)
-- Descrição: Cria todas as tabelas base que as migrations
--            subsequentes assumem que já existem.
-- =====================================================

-- ============================================================
-- 1. PROFILES (extends auth.users 1:1)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    name TEXT,
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    steam_id TEXT UNIQUE,
    discord_id TEXT,
    discord_username TEXT,
    twitch_handle TEXT,
    phone TEXT,
    bio TEXT,
    is_admin BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_store_customer BOOLEAN DEFAULT false,
    is_tournament_player BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis são visíveis para todos"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem criar seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (id = (select auth.uid()));

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. TEAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tag VARCHAR(10),
    logo_url TEXT,
    region TEXT,
    owner_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are viewable by everyone"
  ON public.teams FOR SELECT
  USING (true);

-- ============================================================
-- 3. TOURNAMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    rules TEXT,
    format TEXT DEFAULT 'double_elimination',
    best_of INTEGER DEFAULT 1,
    prize_pool NUMERIC,
    prize_distribution JSONB,
    banner_url TEXT,
    max_teams INTEGER DEFAULT 8,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft',
    organizer_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are viewable by everyone"
  ON public.tournaments FOR SELECT
  USING (true);

-- ============================================================
-- 4. TOURNAMENT_TEAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tournament_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    seed INTEGER,
    status TEXT DEFAULT 'active',
    entry_type TEXT DEFAULT 'direct_invite',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament teams are viewable by everyone"
  ON public.tournament_teams FOR SELECT
  USING (true);

-- ============================================================
-- 5. TEAM_PLAYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'player',
    jersey_number INTEGER,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_team_players_team ON public.team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_profile ON public.team_players(profile_id);

ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team players are viewable by everyone"
  ON public.team_players FOR SELECT
  USING (true);

-- ============================================================
-- 6. MATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team1_id UUID REFERENCES public.teams(id),
    team2_id UUID REFERENCES public.teams(id),
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled',
    round TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    is_live BOOLEAN DEFAULT false,
    winner_id UUID REFERENCES public.teams(id),
    stream_url TEXT,
    gotv_match_id TEXT,
    gotv_server_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_round ON public.matches(round);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone"
  ON public.matches FOR SELECT
  USING (true);

-- ============================================================
-- 7. MATCH_MAPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.match_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    map_name TEXT,
    map_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES public.teams(id),
    picked_by UUID REFERENCES public.teams(id),
    demo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.match_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match maps are viewable by everyone"
  ON public.match_maps FOR SELECT
  USING (true);

-- ============================================================
-- 8. DROPS (coleções de produtos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.drops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    release_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drops are viewable by everyone"
  ON public.drops FOR SELECT
  USING (true);

-- ============================================================
-- 9. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT,
    image_url TEXT,
    images TEXT[],
    collection TEXT,
    drop_id UUID REFERENCES public.drops(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

-- ============================================================
-- 10. PRODUCT_VARIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT,
    color TEXT,
    sku TEXT UNIQUE,
    stock INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants are viewable by everyone"
  ON public.product_variants FOR SELECT
  USING (true);

-- ============================================================
-- 11. CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    discord_id TEXT,
    discord_username TEXT,
    is_member BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprio perfil"
  ON public.customers FOR SELECT
  USING (id = (select auth.uid()));

CREATE POLICY "Criar perfil no signup"
  ON public.customers FOR INSERT
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Usuário atualiza próprio perfil"
  ON public.customers FOR UPDATE
  USING (id = (select auth.uid()));

-- ============================================================
-- 12. ORDERS
-- ============================================================
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id),
    total NUMERIC DEFAULT 0,
    status order_status DEFAULT 'pending',
    payment_method TEXT,
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    tracking_code TEXT,
    shipping_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprios pedidos"
  ON public.orders FOR SELECT
  USING (customer_id = (select auth.uid()));

CREATE POLICY "Usuário cria próprios pedidos"
  ON public.orders FOR INSERT
  WITH CHECK (customer_id = (select auth.uid()));

CREATE POLICY "Usuário pode atualizar próprios pedidos pendentes"
  ON public.orders FOR UPDATE
  USING (customer_id = (select auth.uid()) AND status = 'pending');

-- ============================================================
-- 13. ORDER_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES public.product_variants(id),
    product_name TEXT,
    product_size TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê itens dos próprios pedidos"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = (select auth.uid())
    )
  );

CREATE POLICY "Usuário pode inserir itens nos próprios pedidos"
  ON public.order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = (select auth.uid())
    )
  );

-- ============================================================
-- Storage buckets para logos e banners
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;
