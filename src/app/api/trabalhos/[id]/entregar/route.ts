import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { deliverTrabalhoSchema } from "@/lib/validation";
import { parseDateOnly } from "@/lib/ex-dates";
import { deliverTrabalho } from "@/lib/trabalhos";
import { trabalhoErrorResponse } from "@/lib/trabalho-route";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = deliverTrabalhoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const dataEntrega = parseDateOnly(parsed.data.dataEntrega);
  if (!dataEntrega) {
    return NextResponse.json({ error: "Data de entrega inválida." }, { status: 400 });
  }

  try {
    const trabalho = await deliverTrabalho(id, {
      dataEntrega,
      observacoes: parsed.data.observacoes || null,
    });
    return NextResponse.json(trabalho);
  } catch (error) {
    return trabalhoErrorResponse(error);
  }
}
