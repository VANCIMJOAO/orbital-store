"use client";

import { useEffect, useState } from "react";
import { supabase, Drop } from "@/lib/supabase";

export function useNextDrop() {
  const [drop, setDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNextDrop();
  }, []);

  async function fetchNextDrop() {
    try {
      setLoading(true);

      // Buscar próximo drop (não ativo ainda, ordenado por data)
      const { data, error: fetchError } = await supabase
        .from("drops")
        .select("*")
        .eq("is_active", false)
        .gte("release_date", new Date().toISOString())
        .order("release_date", { ascending: true })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      setDrop(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar drop");
    } finally {
      setLoading(false);
    }
  }

  return { drop, loading, error, refetch: fetchNextDrop };
}

export function useActiveDrops() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveDrops();
  }, []);

  async function fetchActiveDrops() {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from("drops")
        .select("*")
        .eq("is_active", true)
        .order("release_date", { ascending: false });

      if (fetchError) throw fetchError;

      setDrops(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar drops");
    } finally {
      setLoading(false);
    }
  }

  return { drops, loading, error, refetch: fetchActiveDrops };
}
