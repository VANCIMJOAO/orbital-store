import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createLogger } from "@/lib/logger";

const log = createLogger("load-server");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/matches/[id]/load-server (admin only)
// Envia comando matchzy_loadmatch_url para o servidor CS2 via Pterodactyl API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: matchId } = await params;

  // Validar env vars do Pterodactyl
  const pterodactylUrl = process.env.PTERODACTYL_API_URL;
  const pterodactylKey = process.env.PTERODACTYL_API_KEY;
  const serverId = process.env.PTERODACTYL_SERVER_ID;

  if (!pterodactylUrl || !pterodactylKey || !serverId) {
    return NextResponse.json(
      { error: "Pterodactyl não configurado" },
      { status: 500 }
    );
  }

  // Buscar partida
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("id, status, team1_id, team2_id")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) {
    return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
  }

  if (match.status === "finished") {
    return NextResponse.json({ error: "Partida já finalizada" }, { status: 400 });
  }

  // Montar URL do config - sempre usar URL pública (o servidor CS2 precisa acessar pela internet)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://orbital-store.vercel.app").trim();
  const configUrl = `${siteUrl}/api/matches/${matchId}/config`;

  // Helper para enviar comando via Pterodactyl
  const sendCommand = async (cmd: string) => {
    const resp = await fetch(
      `${pterodactylUrl}/api/client/servers/${serverId}/command`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${pterodactylKey}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.pterodactyl.v1+json",
        },
        body: JSON.stringify({ command: cmd }),
      }
    );
    if (!resp.ok) {
      const errorText = await resp.text();
      log.error(`Pterodactyl error for "${cmd}": ${resp.status}`, errorText);
      throw new Error(`Erro ao enviar comando: ${resp.status}`);
    }
    return resp;
  };

  try {
    // 1. Encerrar partida anterior (css_endmatch é o comando correto do CounterStrikeSharp)
    await sendCommand("css_endmatch");
    log.info("css_endmatch enviado");

    // 2. Aguardar o MatchZy processar o endmatch com retry progressivo
    // Tenta carregar até 3 vezes com delays crescentes (2s, 3s, 5s)
    const delays = [2000, 3000, 5000];
    let lastError: Error | null = null;
    let loadCommand = "";

    for (let attempt = 0; attempt < delays.length; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));

      loadCommand = `matchzy_loadmatch_url "${configUrl}"`;
      try {
        await sendCommand(loadCommand);
        log.info(`Comando enviado (tentativa ${attempt + 1}): ${loadCommand}`);
        lastError = null;
        break;
      } catch (err) {
        lastError = err as Error;
        log.warn(`Tentativa ${attempt + 1} falhou, ${attempt < delays.length - 1 ? "retrying..." : "desistindo"}`);
      }
    }

    if (lastError) {
      throw lastError;
    }

    return NextResponse.json({
      success: true,
      message: "Partida carregada no servidor",
      command: loadCommand,
    });
  } catch (error) {
    log.error("Fetch error", error);
    return NextResponse.json(
      { error: "Falha ao conectar com o servidor" },
      { status: 502 }
    );
  }
}
