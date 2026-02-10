-- =====================================================
-- MIGRAÇÃO: Criar índices para foreign keys descobertas
-- Data: 2026-02-12
-- Problema: Foreign keys sem covering index causam
--   full table scans em JOINs e ON DELETE CASCADE.
-- Solução: CREATE INDEX IF NOT EXISTS para cada FK.
-- =====================================================

-- match_events
CREATE INDEX IF NOT EXISTS idx_match_events_attacker_profile ON public.match_events(attacker_profile_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match_map ON public.match_events(match_map_id);
CREATE INDEX IF NOT EXISTS idx_match_events_victim_profile ON public.match_events(victim_profile_id);

-- match_maps
CREATE INDEX IF NOT EXISTS idx_match_maps_match ON public.match_maps(match_id);
CREATE INDEX IF NOT EXISTS idx_match_maps_picked_by ON public.match_maps(picked_by);
CREATE INDEX IF NOT EXISTS idx_match_maps_winner ON public.match_maps(winner_id);

-- match_player_stats
CREATE INDEX IF NOT EXISTS idx_match_player_stats_match_map ON public.match_player_stats(match_map_id);

-- match_rounds
CREATE INDEX IF NOT EXISTS idx_match_rounds_bomb_defused_by ON public.match_rounds(bomb_defused_by);
CREATE INDEX IF NOT EXISTS idx_match_rounds_bomb_planted_by ON public.match_rounds(bomb_planted_by);
CREATE INDEX IF NOT EXISTS idx_match_rounds_ct_team ON public.match_rounds(ct_team_id);
CREATE INDEX IF NOT EXISTS idx_match_rounds_first_death ON public.match_rounds(first_death_profile_id);
CREATE INDEX IF NOT EXISTS idx_match_rounds_first_kill ON public.match_rounds(first_kill_profile_id);
CREATE INDEX IF NOT EXISTS idx_match_rounds_match_map ON public.match_rounds(match_map_id);
CREATE INDEX IF NOT EXISTS idx_match_rounds_t_team ON public.match_rounds(t_team_id);

-- matches
CREATE INDEX IF NOT EXISTS idx_matches_team1 ON public.matches(team1_id);
CREATE INDEX IF NOT EXISTS idx_matches_team2 ON public.matches(team2_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_winner ON public.matches(winner_id);

-- order_items
CREATE INDEX IF NOT EXISTS idx_order_items_product_variant ON public.order_items(product_variant_id);

-- team_players
CREATE INDEX IF NOT EXISTS idx_team_players_profile ON public.team_players(profile_id);

-- tournament_teams
CREATE INDEX IF NOT EXISTS idx_tournament_teams_team ON public.tournament_teams(team_id);
