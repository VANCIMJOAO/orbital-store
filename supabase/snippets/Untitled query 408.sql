-- =====================================================
-- FIX: Trigger handle_new_user agora inclui steam_id e
-- campos extras do signup (is_tournament_player, level, xp)
-- Resolve: BUG #1 (steam_id perdido) e BUG #3 (conflito INSERT)
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    avatar_url,
    steam_id,
    is_tournament_player,
    is_store_customer,
    level,
    xp
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'steam_id',
    COALESCE((NEW.raw_user_meta_data->>'is_tournament_player')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'is_store_customer')::boolean, false),
    1,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
