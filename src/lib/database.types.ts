export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string | null
          discord_id: string | null
          discord_username: string | null
          email: string
          id: string
          is_member: boolean | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discord_id?: string | null
          discord_username?: string | null
          email: string
          id: string
          is_member?: boolean | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discord_id?: string | null
          discord_username?: string | null
          email?: string
          id?: string
          is_member?: boolean | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      drops: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          release_date: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          release_date: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          release_date?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_name: string
          product_size: string
          product_variant_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_name: string
          product_size: string
          product_variant_id?: string | null
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_name?: string
          product_size?: string
          product_variant_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          shipping_address: Json | null
          status: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          total: number
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total?: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          max_stock: number
          product_id: string
          size: string
          sku: string | null
          stock: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_stock?: number
          product_id: string
          size: string
          sku?: string | null
          stock?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_stock?: number
          product_id?: string
          size?: string
          sku?: string | null
          stock?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          collection: string | null
          created_at: string | null
          description: string | null
          drop_id: string | null
          id: string
          images: string[] | null
          name: string
          price: number
          slug: string
          updated_at: string | null
        }
        Insert: {
          collection?: string | null
          created_at?: string | null
          description?: string | null
          drop_id?: string | null
          id?: string
          images?: string[] | null
          name: string
          price: number
          slug: string
          updated_at?: string | null
        }
        Update: {
          collection?: string | null
          created_at?: string | null
          description?: string | null
          drop_id?: string | null
          id?: string
          images?: string[] | null
          name?: string
          price?: number
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          discord_id: string | null
          discord_username: string | null
          id: string
          is_admin: boolean | null
          is_store_customer: boolean | null
          is_tournament_player: boolean | null
          level: number | null
          name: string | null
          phone: string | null
          steam_id: string | null
          updated_at: string | null
          username: string
          xp: number | null
          // Stats agregadas
          total_kills: number | null
          total_deaths: number | null
          total_matches: number | null
          average_rating: number | null
          headshot_percentage: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id: string
          is_admin?: boolean | null
          is_store_customer?: boolean | null
          is_tournament_player?: boolean | null
          level?: number | null
          name?: string | null
          phone?: string | null
          steam_id?: string | null
          updated_at?: string | null
          username: string
          xp?: number | null
          total_kills?: number | null
          total_deaths?: number | null
          total_matches?: number | null
          average_rating?: number | null
          headshot_percentage?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id?: string
          is_admin?: boolean | null
          is_store_customer?: boolean | null
          is_tournament_player?: boolean | null
          level?: number | null
          name?: string | null
          phone?: string | null
          steam_id?: string | null
          updated_at?: string | null
          username?: string
          xp?: number | null
          total_kills?: number | null
          total_deaths?: number | null
          total_matches?: number | null
          average_rating?: number | null
          headshot_percentage?: number | null
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          game: string | null
          format: string | null
          prize_pool: number | null
          prize_distribution: Record<string, number> | null
          start_date: string | null
          end_date: string | null
          max_teams: number | null
          status: string | null
          rules: string | null
          banner_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          game?: string
          format?: string
          prize_pool?: number | null
          prize_distribution?: Record<string, number> | null
          start_date?: string | null
          end_date?: string | null
          max_teams?: number | null
          status?: string
          rules?: string | null
          banner_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          game?: string
          format?: string
          prize_pool?: number | null
          prize_distribution?: Record<string, number> | null
          start_date?: string | null
          end_date?: string | null
          max_teams?: number | null
          status?: string
          rules?: string | null
          banner_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          name: string
          tag: string
          logo_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          tag: string
          logo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          tag?: string
          logo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tournament_teams: {
        Row: {
          id: string
          tournament_id: string
          team_id: string
          seed: number | null
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          tournament_id: string
          team_id: string
          seed?: number | null
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          tournament_id?: string
          team_id?: string
          seed?: number | null
          status?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      team_players: {
        Row: {
          id: string
          team_id: string
          profile_id: string
          role: string | null
          jersey_number: number | null
          joined_at: string | null
          left_at: string | null
          is_active: boolean | null
          steam_id: string | null
          nickname: string | null
        }
        Insert: {
          id?: string
          team_id: string
          profile_id: string
          role?: string | null
          jersey_number?: number | null
          joined_at?: string | null
          left_at?: string | null
          is_active?: boolean | null
          steam_id?: string | null
          nickname?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          profile_id?: string
          role?: string | null
          jersey_number?: number | null
          joined_at?: string | null
          left_at?: string | null
          is_active?: boolean | null
          steam_id?: string | null
          nickname?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      matches: {
        Row: {
          id: string
          tournament_id: string
          team1_id: string | null
          team2_id: string | null
          team1_score: number
          team2_score: number
          winner_id: string | null
          status: string
          round: string | null
          scheduled_at: string | null
          started_at: string | null
          finished_at: string | null
          stream_url: string | null
          gotv_match_id: string | null
          gotv_server_url: string | null
          is_live: boolean | null
          created_at: string | null
          updated_at: string | null
          // Novos campos para sistema de torneio
          match_phase: string | null
          matchzy_config: Json | null
          best_of: number
          maps_won_team1: number
          maps_won_team2: number
          current_map_index: number
          veto_data: Json | null
          map_name: string | null
        }
        Insert: {
          id?: string
          tournament_id: string
          team1_id?: string | null
          team2_id?: string | null
          team1_score?: number
          team2_score?: number
          winner_id?: string | null
          status?: string
          round?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          finished_at?: string | null
          stream_url?: string | null
          gotv_match_id?: string | null
          gotv_server_url?: string | null
          is_live?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          match_phase?: string | null
          matchzy_config?: Json | null
          best_of?: number
          maps_won_team1?: number
          maps_won_team2?: number
          current_map_index?: number
          veto_data?: Json | null
          map_name?: string | null
        }
        Update: {
          id?: string
          tournament_id?: string
          team1_id?: string
          team2_id?: string
          team1_score?: number
          team2_score?: number
          winner_id?: string | null
          status?: string
          round?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          finished_at?: string | null
          stream_url?: string | null
          gotv_match_id?: string | null
          gotv_server_url?: string | null
          is_live?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          match_phase?: string | null
          matchzy_config?: Json | null
          best_of?: number
          maps_won_team1?: number
          maps_won_team2?: number
          current_map_index?: number
          veto_data?: Json | null
          map_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      match_maps: {
        Row: {
          id: string
          match_id: string
          map_name: string
          map_number: number
          team1_score: number
          team2_score: number
          winner_id: string | null
          status: string
          demo_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          match_id: string
          map_name: string
          map_number: number
          team1_score?: number
          team2_score?: number
          winner_id?: string | null
          status?: string
          demo_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          match_id?: string
          map_name?: string
          map_number?: number
          team1_score?: number
          team2_score?: number
          winner_id?: string | null
          status?: string
          demo_url?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_maps_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_maps_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      match_player_stats: {
        Row: {
          id: string
          match_id: string
          match_map_id: string | null
          profile_id: string
          team_id: string
          kills: number
          deaths: number
          assists: number
          headshots: number
          total_damage: number
          adr: number | null
          kast_percentage: number | null
          rating: number | null
          rounds_played: number
          rounds_with_kill: number
          rounds_survived: number
          first_kills: number
          first_deaths: number
          clutch_wins: number
          clutch_attempts: number
          two_kills: number
          three_kills: number
          four_kills: number
          aces: number
          flash_assists: number
          enemies_flashed: number
          equipment_value_total: number
          ct_kills: number
          t_kills: number
          ct_deaths: number
          t_deaths: number
          created_at: string | null
        }
        Insert: {
          id?: string
          match_id: string
          match_map_id?: string | null
          profile_id: string
          team_id: string
          kills?: number
          deaths?: number
          assists?: number
          headshots?: number
          total_damage?: number
          adr?: number | null
          kast_percentage?: number | null
          rating?: number | null
          rounds_played?: number
          rounds_with_kill?: number
          rounds_survived?: number
          first_kills?: number
          first_deaths?: number
          clutch_wins?: number
          clutch_attempts?: number
          two_kills?: number
          three_kills?: number
          four_kills?: number
          aces?: number
          flash_assists?: number
          enemies_flashed?: number
          equipment_value_total?: number
          ct_kills?: number
          t_kills?: number
          ct_deaths?: number
          t_deaths?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          match_id?: string
          match_map_id?: string | null
          profile_id?: string
          team_id?: string
          kills?: number
          deaths?: number
          assists?: number
          headshots?: number
          total_damage?: number
          adr?: number | null
          kast_percentage?: number | null
          rating?: number | null
          rounds_played?: number
          rounds_with_kill?: number
          rounds_survived?: number
          first_kills?: number
          first_deaths?: number
          clutch_wins?: number
          clutch_attempts?: number
          two_kills?: number
          three_kills?: number
          four_kills?: number
          aces?: number
          flash_assists?: number
          enemies_flashed?: number
          equipment_value_total?: number
          ct_kills?: number
          t_kills?: number
          ct_deaths?: number
          t_deaths?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_player_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_stats_match_map_id_fkey"
            columns: ["match_map_id"]
            isOneToOne: false
            referencedRelation: "match_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_stats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      match_rounds: {
        Row: {
          id: string
          match_id: string
          match_map_id: string | null
          round_number: number
          winner_team_id: string | null
          win_reason: string | null
          ct_team_id: string | null
          t_team_id: string | null
          ct_score: number
          t_score: number
          ct_equipment_value: number | null
          t_equipment_value: number | null
          duration_seconds: number | null
          first_kill_profile_id: string | null
          first_death_profile_id: string | null
          bomb_planted_by: string | null
          bomb_defused_by: string | null
          bomb_plant_site: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          match_id: string
          match_map_id?: string | null
          round_number: number
          winner_team_id?: string | null
          win_reason?: string | null
          ct_team_id?: string | null
          t_team_id?: string | null
          ct_score?: number
          t_score?: number
          ct_equipment_value?: number | null
          t_equipment_value?: number | null
          duration_seconds?: number | null
          first_kill_profile_id?: string | null
          first_death_profile_id?: string | null
          bomb_planted_by?: string | null
          bomb_defused_by?: string | null
          bomb_plant_site?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          match_id?: string
          match_map_id?: string | null
          round_number?: number
          winner_team_id?: string | null
          win_reason?: string | null
          ct_team_id?: string | null
          t_team_id?: string | null
          ct_score?: number
          t_score?: number
          ct_equipment_value?: number | null
          t_equipment_value?: number | null
          duration_seconds?: number | null
          first_kill_profile_id?: string | null
          first_death_profile_id?: string | null
          bomb_planted_by?: string | null
          bomb_defused_by?: string | null
          bomb_plant_site?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_rounds_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_rounds_match_map_id_fkey"
            columns: ["match_map_id"]
            isOneToOne: false
            referencedRelation: "match_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_rounds_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      match_events: {
        Row: {
          id: string
          match_id: string
          match_map_id: string | null
          event_type: string
          round_number: number
          tick: number | null
          event_data: Json
          attacker_profile_id: string | null
          victim_profile_id: string | null
          weapon: string | null
          is_headshot: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          match_id: string
          match_map_id?: string | null
          event_type: string
          round_number: number
          tick?: number | null
          event_data?: Json
          attacker_profile_id?: string | null
          victim_profile_id?: string | null
          weapon?: string | null
          is_headshot?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          match_id?: string
          match_map_id?: string | null
          event_type?: string
          round_number?: number
          tick?: number | null
          event_data?: Json
          attacker_profile_id?: string | null
          victim_profile_id?: string | null
          weapon?: string | null
          is_headshot?: boolean
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_match_map_id_fkey"
            columns: ["match_map_id"]
            isOneToOne: false
            referencedRelation: "match_maps"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
