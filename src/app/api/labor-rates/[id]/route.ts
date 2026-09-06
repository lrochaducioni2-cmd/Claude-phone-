import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { laborRateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.laborRate.findFirst({ where: { id, ownerId: userId } });
  if (!existing) {
    return NextResponse.json({ error: "Cargo não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = laborRateSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { code, name, hourlyCost, active } = parsed.data;

  const rate = await prisma.laborRate.update({
    where: { id },
    data: {
      ...(code !== undefined && { code: code || null }),
      ...(name !== undefined && { name }),
      ...(hourlyCost !== undefined && { hourlyCost }),
      ...(active !== undefined && { active }),
    },
  });

  return NextResponse.json(rate);
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.laborRate.findFirst({ where: { id, ownerId: userId } });
  if (!existing) {
    return NextResponse.json({ error: "Cargo não encontrado." }, { status: 404 });
  }

  await prisma.laborRate.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
