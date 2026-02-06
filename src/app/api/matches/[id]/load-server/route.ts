import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/matches/[id]/load-server
// Envia comando matchzy_loadmatch_url para o servidor CS2 via Pterodactyl API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (match.status === "live") {
    return NextResponse.json({ error: "Partida já está ao vivo" }, { status: 400 });
  }

  if (match.status === "finished") {
    return NextResponse.json({ error: "Partida já finalizada" }, { status: 400 });
  }

  // Montar URL do config - sempre usar URL pública (o servidor CS2 precisa acessar pela internet)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orbital-store.vercel.app";
  const configUrl = `${siteUrl}/api/matches/${matchId}/config`;

  // Enviar comando para o servidor CS2 via Pterodactyl
  const command = `matchzy_loadmatch_url "${configUrl}"`;

  try {
    const resp = await fetch(
      `${pterodactylUrl}/api/client/servers/${serverId}/command`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${pterodactylKey}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.pterodactyl.v1+json",
        },
        body: JSON.stringify({ command }),
      }
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("[LoadServer] Pterodactyl error:", resp.status, errorText);
      return NextResponse.json(
        { error: `Erro ao enviar comando: ${resp.status}` },
        { status: 502 }
      );
    }

    console.log(`[LoadServer] Comando enviado para o servidor: ${command}`);

    return NextResponse.json({
      success: true,
      message: "Partida carregada no servidor",
      command,
    });
  } catch (error) {
    console.error("[LoadServer] Fetch error:", error);
    return NextResponse.json(
      { error: "Falha ao conectar com o servidor" },
      { status: 502 }
    );
  }
}
