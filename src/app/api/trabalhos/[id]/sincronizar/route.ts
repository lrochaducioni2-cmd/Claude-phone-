import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { pushStatusToCrm } from "@/lib/trabalhos";

type Params = { params: Promise<{ id: string }> };

/** Reenvia ao CRM o status local (usado quando um aviso anterior falhou). */
export async function POST(_request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.trabalho.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Trabalho não encontrado." }, { status: 404 });
  }

  const trabalho = await pushStatusToCrm(id);
  return NextResponse.json(trabalho);
}
