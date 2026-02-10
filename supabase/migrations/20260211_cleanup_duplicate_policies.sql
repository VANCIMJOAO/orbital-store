-- =====================================================
-- MIGRAÇÃO: Remover policies duplicadas de SELECT
-- Data: 2026-02-11
-- Problema: Tabelas com "Admins can manage X" (FOR ALL)
--   + "X are viewable by everyone" (SELECT true)
--   + "Allow public read access to X" (SELECT true)
--   causam multiple_permissive_policies warnings.
-- Solução: Trocar "Admins can manage X" (FOR ALL) por
--   policies específicas de INSERT/UPDATE/DELETE apenas,
--   e manter uma única policy de SELECT público.
-- =====================================================

-- ============================================================
-- match_events: remover FOR ALL admin, manter apenas SELECT público
-- ============================================================
DROP POLICY IF EXISTS "Admins podem gerenciar eventos" ON public.match_events;
CREATE POLICY "Admins podem gerenciar eventos"
  ON public.match_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins podem atualizar eventos"
  ON public.match_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins podem deletar eventos"
  ON public.match_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================
-- match_player_stats: remover FOR ALL admin, manter apenas SELECT público
-- ============================================================
DROP POLICY IF EXISTS "Admins podem gerenciar stats" ON public.match_player_stats;
CREATE POLICY "Admins podem gerenciar stats"
  ON public.match_player_stats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins podem atualizar stats"
  ON public.match_player_stats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins podem deletar stats"
  ON public.match_player_stats FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================
-- match_rounds: remover FOR ALL admin, manter apenas SELECT público
-- ============================================================
DROP POLICY IF EXISTS "Admins podem gerenciar rounds" ON public.match_rounds;
CREATE POLICY "Admins podem gerenciar rounds"
  ON public.match_rounds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins podem atualizar rounds"
  ON public.match_rounds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins podem deletar rounds"
  ON public.match_rounds FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================
-- match_maps: remover FOR ALL admin, manter "Match maps are viewable by everyone"
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage match_maps" ON public.match_maps;
CREATE POLICY "Admins can insert match_maps"
  ON public.match_maps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can update match_maps"
  ON public.match_maps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can delete match_maps"
  ON public.match_maps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================
-- matches: remover FOR ALL admin, manter "Matches are viewable by everyone"
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage matches" ON public.matches;
CREATE POLICY "Admins can insert matches"
  ON public.matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can update matches"
  ON public.matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can delete matches"
  ON public.matches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================
-- teams: remover FOR ALL admin + duplicata SELECT, manter "Teams are viewable by everyone"
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;
DROP POLICY IF EXISTS "Allow public read access to teams" ON public.teams;
CREATE POLICY "Admins can insert teams"
  ON public.teams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can update teams"
  ON public.teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can delete teams"
  ON public.teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================
-- tournament_teams: remover FOR ALL admin + duplicata SELECT, manter "Tournament teams are viewable by everyone"
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage tournament_teams" ON public.tournament_teams;
DROP POLICY IF EXISTS "Allow public read access to tournament_teams" ON public.tournament_teams;
CREATE POLICY "Admins can insert tournament_teams"
  ON public.tournament_teams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can update tournament_teams"
  ON public.tournament_teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can delete tournament_teams"
  ON public.tournament_teams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================
-- team_players: remover FOR ALL admin + duplicata SELECT, manter "Team players are viewable by everyone"
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage team_players" ON public.team_players;
DROP POLICY IF EXISTS "Allow public read access to team_players" ON public.team_players;
CREATE POLICY "Admins can insert team_players"
  ON public.team_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can update team_players"
  ON public.team_players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can delete team_players"
  ON public.team_players FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================
-- tournaments: remover FOR ALL admin + duplicata SELECT, manter "Tournaments are viewable by everyone"
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow public read access to tournaments" ON public.tournaments;
CREATE POLICY "Admins can insert tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can update tournaments"
  ON public.tournaments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admins can delete tournaments"
  ON public.tournaments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- ============================================================
-- profiles: remover duplicata SELECT
-- Manter "Perfis são visíveis para todos", remover "Perfis são públicos para leitura"
-- ============================================================
DROP POLICY IF EXISTS "Perfis são públicos para leitura" ON public.profiles;
