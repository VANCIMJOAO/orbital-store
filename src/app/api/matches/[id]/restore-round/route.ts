import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createLogger } from "@/lib/logger";

const log = createLogger("restore-round");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/matches/[id]/restore-round (admin only)
// Envia comando .restore <round> para o servidor CS2 via Pterodactyl API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: matchId } = await params;

  // Validar body
  const body = await request.json();
  const roundNumber = body.round;

  if (roundNumber == null || roundNumber < 0) {
    return NextResponse.json(
      { error: "Número do round é obrigatório (>= 0)" },
      { status: 400 }
    );
  }

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
    .select("id, status")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) {
    return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
  }

  if (match.status !== "live") {
    return NextResponse.json({ error: "Partida não está ao vivo" }, { status: 400 });
  }

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
    // Comando css_restore <round> restaura o backup do round especificado
    const restoreCommand = `css_restore ${roundNumber}`;
    await sendCommand(restoreCommand);
    log.info(`Restore round enviado: ${restoreCommand} (match: ${matchId})`);

    return NextResponse.json({
      success: true,
      message: `Round ${roundNumber} restaurado`,
      command: restoreCommand,
    });
  } catch (error) {
    log.error("Erro ao restaurar round", error);
    return NextResponse.json(
      { error: "Falha ao conectar com o servidor" },
      { status: 502 }
    );
  }
}
