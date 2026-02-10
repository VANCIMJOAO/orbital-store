-- =====================================================
-- MIGRAÇÃO: Otimização de Performance RLS
-- Data: 2026-02-09
-- Descrição:
--   1. Trocar auth.uid() por (select auth.uid()) em todas as policies
--      para evitar re-avaliação por linha (auth_rls_initplan)
--   2. Remover policies duplicadas (multiple_permissive_policies)
-- =====================================================

-- ============================================================
-- PARTE 1: Corrigir auth_rls_initplan
-- Trocar auth.uid() por (select auth.uid()) em policies RLS
-- O Supabase não tem ALTER POLICY ... USING, então precisamos
-- DROP + CREATE para cada policy afetada.
-- ============================================================

-- --------------------------------------------------------
-- TABELA: customers
-- --------------------------------------------------------

-- Policy: Usuário vê próprio perfil
DROP POLICY IF EXISTS "Usuário vê próprio perfil" ON public.customers;
CREATE POLICY "Usuário vê próprio perfil"
  ON public.customers FOR SELECT
  USING (id = (select auth.uid()));

-- Policy: Usuário atualiza próprio perfil
DROP POLICY IF EXISTS "Usuário atualiza próprio perfil" ON public.customers;
CREATE POLICY "Usuário atualiza próprio perfil"
  ON public.customers FOR UPDATE
  USING (id = (select auth.uid()));

-- Policy: Criar perfil no signup
DROP POLICY IF EXISTS "Criar perfil no signup" ON public.customers;
CREATE POLICY "Criar perfil no signup"
  ON public.customers FOR INSERT
  WITH CHECK (id = (select auth.uid()));

-- --------------------------------------------------------
-- TABELA: orders
-- --------------------------------------------------------

-- Policy: Usuário vê próprios pedidos
DROP POLICY IF EXISTS "Usuário vê próprios pedidos" ON public.orders;
CREATE POLICY "Usuário vê próprios pedidos"
  ON public.orders FOR SELECT
  USING (customer_id = (select auth.uid()));

-- Policy: Usuário cria próprios pedidos
DROP POLICY IF EXISTS "Usuário cria próprios pedidos" ON public.orders;
CREATE POLICY "Usuário cria próprios pedidos"
  ON public.orders FOR INSERT
  WITH CHECK (customer_id = (select auth.uid()));

-- Policy: Usuário pode atualizar próprios pedidos pendentes
DROP POLICY IF EXISTS "Usuário pode atualizar próprios pedidos pendentes" ON public.orders;
CREATE POLICY "Usuário pode atualizar próprios pedidos pendentes"
  ON public.orders FOR UPDATE
  USING (customer_id = (select auth.uid()) AND status = 'pending');

-- --------------------------------------------------------
-- TABELA: order_items
-- --------------------------------------------------------

-- Policy: Usuário vê itens dos próprios pedidos
DROP POLICY IF EXISTS "Usuário vê itens dos próprios pedidos" ON public.order_items;
CREATE POLICY "Usuário vê itens dos próprios pedidos"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = (select auth.uid())
    )
  );

-- Policy: Usuário pode inserir itens nos próprios pedidos
DROP POLICY IF EXISTS "Usuário pode inserir itens nos próprios pedidos" ON public.order_items;
CREATE POLICY "Usuário pode inserir itens nos próprios pedidos"
  ON public.order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id = (select auth.uid())
    )
  );

-- --------------------------------------------------------
-- TABELA: profiles
-- --------------------------------------------------------

-- Policy: Usuários podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (id = (select auth.uid()));

-- Policy: Usuários podem criar seu próprio perfil
DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem criar seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (id = (select auth.uid()));

-- Policy: Usuário pode criar próprio perfil (duplicada - será removida na Parte 2)
DROP POLICY IF EXISTS "Usuário pode criar próprio perfil" ON public.profiles;
CREATE POLICY "Usuário pode criar próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (id = (select auth.uid()));

-- Policy: Usuário pode atualizar próprio perfil (duplicada - será removida na Parte 2)
DROP POLICY IF EXISTS "Usuário pode atualizar próprio perfil" ON public.profiles;
CREATE POLICY "Usuário pode atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  USING (id = (select auth.uid()));

-- --------------------------------------------------------
-- TABELA: tournaments (admin policies)
-- --------------------------------------------------------

-- Policy: Admins can manage tournaments
DROP POLICY IF EXISTS "Admins can manage tournaments" ON public.tournaments;
CREATE POLICY "Admins can manage tournaments"
  ON public.tournaments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin insert tournaments
DROP POLICY IF EXISTS "Allow admin insert tournaments" ON public.tournaments;
CREATE POLICY "Allow admin insert tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin update tournaments
DROP POLICY IF EXISTS "Allow admin update tournaments" ON public.tournaments;
CREATE POLICY "Allow admin update tournaments"
  ON public.tournaments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin delete tournaments
DROP POLICY IF EXISTS "Allow admin delete tournaments" ON public.tournaments;
CREATE POLICY "Allow admin delete tournaments"
  ON public.tournaments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- --------------------------------------------------------
-- TABELA: teams (admin policies)
-- --------------------------------------------------------

-- Policy: Admins can manage teams
DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;
CREATE POLICY "Admins can manage teams"
  ON public.teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin insert teams
DROP POLICY IF EXISTS "Allow admin insert teams" ON public.teams;
CREATE POLICY "Allow admin insert teams"
  ON public.teams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin update teams
DROP POLICY IF EXISTS "Allow admin update teams" ON public.teams;
CREATE POLICY "Allow admin update teams"
  ON public.teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin delete teams
DROP POLICY IF EXISTS "Allow admin delete teams" ON public.teams;
CREATE POLICY "Allow admin delete teams"
  ON public.teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- --------------------------------------------------------
-- TABELA: tournament_teams (admin policies)
-- --------------------------------------------------------

-- Policy: Admins can manage tournament_teams
DROP POLICY IF EXISTS "Admins can manage tournament_teams" ON public.tournament_teams;
CREATE POLICY "Admins can manage tournament_teams"
  ON public.tournament_teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin insert tournament_teams
DROP POLICY IF EXISTS "Allow admin insert tournament_teams" ON public.tournament_teams;
CREATE POLICY "Allow admin insert tournament_teams"
  ON public.tournament_teams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin update tournament_teams
DROP POLICY IF EXISTS "Allow admin update tournament_teams" ON public.tournament_teams;
CREATE POLICY "Allow admin update tournament_teams"
  ON public.tournament_teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin delete tournament_teams
DROP POLICY IF EXISTS "Allow admin delete tournament_teams" ON public.tournament_teams;
CREATE POLICY "Allow admin delete tournament_teams"
  ON public.tournament_teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- --------------------------------------------------------
-- TABELA: team_players (admin policies)
-- --------------------------------------------------------

-- Policy: Admins can manage team_players
DROP POLICY IF EXISTS "Admins can manage team_players" ON public.team_players;
CREATE POLICY "Admins can manage team_players"
  ON public.team_players FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin insert team_players
DROP POLICY IF EXISTS "Allow admin insert team_players" ON public.team_players;
CREATE POLICY "Allow admin insert team_players"
  ON public.team_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin update team_players
DROP POLICY IF EXISTS "Allow admin update team_players" ON public.team_players;
CREATE POLICY "Allow admin update team_players"
  ON public.team_players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin delete team_players
DROP POLICY IF EXISTS "Allow admin delete team_players" ON public.team_players;
CREATE POLICY "Allow admin delete team_players"
  ON public.team_players FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- --------------------------------------------------------
-- TABELA: matches (admin policies)
-- --------------------------------------------------------

-- Policy: Admins can manage matches
DROP POLICY IF EXISTS "Admins can manage matches" ON public.matches;
CREATE POLICY "Admins can manage matches"
  ON public.matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin insert matches
DROP POLICY IF EXISTS "Allow admin insert matches" ON public.matches;
CREATE POLICY "Allow admin insert matches"
  ON public.matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin update matches
DROP POLICY IF EXISTS "Allow admin update matches" ON public.matches;
CREATE POLICY "Allow admin update matches"
  ON public.matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin delete matches
DROP POLICY IF EXISTS "Allow admin delete matches" ON public.matches;
CREATE POLICY "Allow admin delete matches"
  ON public.matches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- --------------------------------------------------------
-- TABELA: match_maps (admin policies)
-- --------------------------------------------------------

-- Policy: Admins can manage match_maps
DROP POLICY IF EXISTS "Admins can manage match_maps" ON public.match_maps;
CREATE POLICY "Admins can manage match_maps"
  ON public.match_maps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin insert match_maps
DROP POLICY IF EXISTS "Allow admin insert match_maps" ON public.match_maps;
CREATE POLICY "Allow admin insert match_maps"
  ON public.match_maps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin update match_maps
DROP POLICY IF EXISTS "Allow admin update match_maps" ON public.match_maps;
CREATE POLICY "Allow admin update match_maps"
  ON public.match_maps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Policy: Allow admin delete match_maps
DROP POLICY IF EXISTS "Allow admin delete match_maps" ON public.match_maps;
CREATE POLICY "Allow admin delete match_maps"
  ON public.match_maps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );


-- ============================================================
-- PARTE 2: Remover policies duplicadas
-- Cada tabela admin tem "Admins can manage X" (FOR ALL) que
-- já cobre INSERT/UPDATE/DELETE/SELECT. As policies individuais
-- "Allow admin insert/update/delete X" são redundantes.
-- Também há duplicatas de SELECT público em match_maps e matches.
-- ============================================================

-- --------------------------------------------------------
-- tournaments: remover policies individuais (FOR ALL já cobre)
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin insert tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow admin update tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow admin delete tournaments" ON public.tournaments;

-- --------------------------------------------------------
-- teams: remover policies individuais
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin insert teams" ON public.teams;
DROP POLICY IF EXISTS "Allow admin update teams" ON public.teams;
DROP POLICY IF EXISTS "Allow admin delete teams" ON public.teams;

-- --------------------------------------------------------
-- tournament_teams: remover policies individuais
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin insert tournament_teams" ON public.tournament_teams;
DROP POLICY IF EXISTS "Allow admin update tournament_teams" ON public.tournament_teams;
DROP POLICY IF EXISTS "Allow admin delete tournament_teams" ON public.tournament_teams;

-- --------------------------------------------------------
-- team_players: remover policies individuais
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin insert team_players" ON public.team_players;
DROP POLICY IF EXISTS "Allow admin update team_players" ON public.team_players;
DROP POLICY IF EXISTS "Allow admin delete team_players" ON public.team_players;

-- --------------------------------------------------------
-- matches: remover policies individuais + SELECT duplicada
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin insert matches" ON public.matches;
DROP POLICY IF EXISTS "Allow admin update matches" ON public.matches;
DROP POLICY IF EXISTS "Allow admin delete matches" ON public.matches;
-- Manter apenas uma policy de SELECT público
DROP POLICY IF EXISTS "Allow public read access to matches" ON public.matches;
-- "Matches are viewable by everyone" e "Admins can manage matches" ficam

-- --------------------------------------------------------
-- match_maps: remover policies individuais + SELECT duplicadas
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin insert match_maps" ON public.match_maps;
DROP POLICY IF EXISTS "Allow admin update match_maps" ON public.match_maps;
DROP POLICY IF EXISTS "Allow admin delete match_maps" ON public.match_maps;
-- Manter apenas uma policy de SELECT público
DROP POLICY IF EXISTS "Allow public read access to match_maps" ON public.match_maps;
-- "Match maps are viewable by everyone" e "Admins can manage match_maps" ficam

-- --------------------------------------------------------
-- profiles: remover policies duplicadas de INSERT e UPDATE
-- Manter "Usuários podem criar/atualizar seu próprio perfil"
-- Remover "Usuário pode criar/atualizar próprio perfil" (duplicada)
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Usuário pode criar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuário pode atualizar próprio perfil" ON public.profiles;


-- ============================================================
-- VERIFICAÇÃO: Rodar esta query após a migração para confirmar
-- que não há mais warnings
-- ============================================================
-- SELECT * FROM extensions.pg_lint;
