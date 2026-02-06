-- =====================================================
-- MIGRAÇÃO: Sistema de Campeonato CS2
-- Data: 2026-02-05
-- Descrição: Tabelas para estatísticas de partidas,
--            rounds e configurações de torneio
-- =====================================================

-- 1. Criar tabela match_player_stats
-- Armazena estatísticas individuais de cada jogador por partida
CREATE TABLE IF NOT EXISTS match_player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    match_map_id UUID REFERENCES match_maps(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Stats principais
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    headshots INTEGER DEFAULT 0,
    total_damage INTEGER DEFAULT 0,

    -- Stats calculadas (preenchidas ao final da partida)
    adr DECIMAL(5,2),
    kast_percentage DECIMAL(5,2),
    rating DECIMAL(4,2),

    -- Rounds
    rounds_played INTEGER DEFAULT 0,
    rounds_with_kill INTEGER DEFAULT 0,
    rounds_survived INTEGER DEFAULT 0,

    -- Entry frags
    first_kills INTEGER DEFAULT 0,
    first_deaths INTEGER DEFAULT 0,

    -- Clutches
    clutch_wins INTEGER DEFAULT 0,
    clutch_attempts INTEGER DEFAULT 0,

    -- Multi-kills
    two_kills INTEGER DEFAULT 0,
    three_kills INTEGER DEFAULT 0,
    four_kills INTEGER DEFAULT 0,
    aces INTEGER DEFAULT 0,

    -- Flash assists
    flash_assists INTEGER DEFAULT 0,
    enemies_flashed INTEGER DEFAULT 0,

    -- Economy
    equipment_value_total INTEGER DEFAULT 0,

    -- Stats por lado
    ct_kills INTEGER DEFAULT 0,
    t_kills INTEGER DEFAULT 0,
    ct_deaths INTEGER DEFAULT 0,
    t_deaths INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraint: um jogador só pode ter uma entrada por partida/mapa
    UNIQUE(match_id, match_map_id, profile_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_match_player_stats_match ON match_player_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_match_player_stats_profile ON match_player_stats(profile_id);
CREATE INDEX IF NOT EXISTS idx_match_player_stats_team ON match_player_stats(team_id);


-- 2. Criar tabela match_rounds
-- Armazena dados de cada round da partida
CREATE TABLE IF NOT EXISTS match_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    match_map_id UUID REFERENCES match_maps(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,

    -- Resultado do round
    winner_team_id UUID REFERENCES teams(id),
    win_reason VARCHAR(50),  -- 'elimination', 'bomb_defused', 'bomb_exploded', 'time'

    -- Times em cada lado neste round
    ct_team_id UUID REFERENCES teams(id),
    t_team_id UUID REFERENCES teams(id),

    -- Score após o round
    ct_score INTEGER NOT NULL DEFAULT 0,
    t_score INTEGER NOT NULL DEFAULT 0,

    -- Economics
    ct_equipment_value INTEGER DEFAULT 0,
    t_equipment_value INTEGER DEFAULT 0,

    -- Duração
    duration_seconds INTEGER,

    -- Key moments (profile_ids)
    first_kill_profile_id UUID REFERENCES profiles(id),
    first_death_profile_id UUID REFERENCES profiles(id),
    bomb_planted_by UUID REFERENCES profiles(id),
    bomb_defused_by UUID REFERENCES profiles(id),
    bomb_plant_site VARCHAR(1),  -- 'A' ou 'B'

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraint: um round por partida/mapa
    UNIQUE(match_id, match_map_id, round_number)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_match_rounds_match ON match_rounds(match_id);
CREATE INDEX IF NOT EXISTS idx_match_rounds_winner ON match_rounds(winner_team_id);


-- 3. Criar tabela match_events (opcional, para histórico detalhado)
-- Armazena eventos individuais da partida (kills, bombs, etc)
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    match_map_id UUID REFERENCES match_maps(id) ON DELETE CASCADE,

    event_type VARCHAR(50) NOT NULL,  -- 'kill', 'bomb_planted', 'bomb_defused', etc.
    round_number INTEGER NOT NULL,
    tick INTEGER,

    -- Dados do evento (JSON para flexibilidade)
    event_data JSONB NOT NULL DEFAULT '{}',

    -- Campos desnormalizados para queries comuns
    attacker_profile_id UUID REFERENCES profiles(id),
    victim_profile_id UUID REFERENCES profiles(id),
    weapon VARCHAR(50),
    is_headshot BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_type ON match_events(event_type);
CREATE INDEX IF NOT EXISTS idx_match_events_round ON match_events(match_id, round_number);


-- 4. Alterar tabela matches - adicionar campos do sistema de torneio
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS match_phase VARCHAR(20) DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS matchzy_config JSONB,
ADD COLUMN IF NOT EXISTS best_of INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS maps_won_team1 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS maps_won_team2 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_map_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS veto_data JSONB,
ADD COLUMN IF NOT EXISTS map_name VARCHAR(50);


-- 5. Alterar tabela team_players - adicionar steam_id e nickname
ALTER TABLE team_players
ADD COLUMN IF NOT EXISTS steam_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);


-- 6. Alterar tabela profiles - garantir campos necessários
-- (steam_id já existe, mas vamos garantir que seja único se possível)
-- Nota: Não podemos adicionar UNIQUE constraint se já existem duplicatas
-- ALTER TABLE profiles ADD CONSTRAINT profiles_steam_id_unique UNIQUE (steam_id);

-- Adicionar campos de estatísticas agregadas no perfil
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_kills INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_deaths INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS headshot_percentage DECIMAL(5,2);


-- 7. Criar enum para match_phase se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_phase_type') THEN
        CREATE TYPE match_phase_type AS ENUM (
            'scheduled',
            'warmup',
            'knife',
            'live',
            'halftime',
            'overtime',
            'paused',
            'finished',
            'cancelled'
        );
    END IF;
END$$;


-- 8. Comentários para documentação
COMMENT ON TABLE match_player_stats IS 'Estatísticas individuais de jogadores por partida';
COMMENT ON TABLE match_rounds IS 'Dados de cada round da partida';
COMMENT ON TABLE match_events IS 'Eventos detalhados da partida (kills, bombs, etc)';
COMMENT ON COLUMN matches.match_phase IS 'Fase atual da partida: scheduled, warmup, knife, live, halftime, overtime, paused, finished';
COMMENT ON COLUMN matches.matchzy_config IS 'Configuração JSON enviada para o MatchZy';
COMMENT ON COLUMN matches.best_of IS 'Formato da série: 1 para BO1, 3 para BO3, etc';
