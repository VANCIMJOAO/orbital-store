-- =====================================================
-- MIGRAÇÃO: Habilitar RLS em tabelas de stats/rounds/events
-- Data: 2026-02-09
-- Descrição: Tabelas match_player_stats, match_rounds e
--            match_events estavam sem RLS habilitado.
--            Dados são públicos para leitura, mas apenas
--            service_role (webhooks) pode escrever.
-- =====================================================

-- 1. Habilitar RLS
ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- 2. Leitura pública (todos podem ver stats de partidas)
CREATE POLICY "Stats são visíveis por todos"
  ON public.match_player_stats FOR SELECT
  USING (true);

CREATE POLICY "Rounds são visíveis por todos"
  ON public.match_rounds FOR SELECT
  USING (true);

CREATE POLICY "Eventos são visíveis por todos"
  ON public.match_events FOR SELECT
  USING (true);

-- 3. Escrita apenas para admins (via client autenticado)
CREATE POLICY "Admins podem gerenciar stats"
  ON public.match_player_stats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins podem gerenciar rounds"
  ON public.match_rounds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins podem gerenciar eventos"
  ON public.match_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.is_admin = true
    )
  );

-- Nota: O webhook do MatchZy usa SUPABASE_SERVICE_ROLE_KEY
-- que faz bypass do RLS automaticamente, então não precisa
-- de policy específica para escrita via webhook.
