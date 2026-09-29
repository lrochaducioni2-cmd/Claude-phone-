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

  const { name, location, notes, contactId } = parsed.data;

  if (contactId) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, ownerId: userId } });
    if (!contact) {
      return NextResponse.json({ error: "Contato não encontrado." }, { status: 400 });
    }
  }

  const facility = await prisma.exFacility.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(location !== undefined && { location: location || null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(contactId !== undefined && { contactId: contactId || null }),
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
