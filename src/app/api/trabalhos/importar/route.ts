import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { importTrabalhoSchema } from "@/lib/validation";
import { importTrabalho } from "@/lib/trabalhos";
import { trabalhoErrorResponse } from "@/lib/trabalho-route";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = importTrabalhoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const trabalho = await importTrabalho(parsed.data.crmTrabalhoId);
    return NextResponse.json(trabalho, { status: 201 });
  } catch (error) {
    return trabalhoErrorResponse(error);
  }
}
