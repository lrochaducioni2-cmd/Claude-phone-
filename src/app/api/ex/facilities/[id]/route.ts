import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { exFacilitySchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.exFacility.findFirst({ where: { id, ownerId: userId } });
  if (!existing) {
    return NextResponse.json({ error: "Instalação não encontrada." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = exFacilitySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, location, notes, empresaId } = parsed.data;

  if (empresaId) {
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 400 });
    }
  }

  const facility = await prisma.exFacility.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(location !== undefined && { location: location || null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(empresaId !== undefined && { empresaId: empresaId || null }),
    },
  });

  return NextResponse.json(facility);
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.exFacility.findFirst({ where: { id, ownerId: userId } });
  if (!existing) {
    return NextResponse.json({ error: "Instalação não encontrada." }, { status: 404 });
  }

  await prisma.exFacility.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
