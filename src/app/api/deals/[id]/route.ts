import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { dealUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.deal.findFirst({ where: { id, ownerId: userId } });
  if (!existing) {
    return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = dealUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { title, value, contactId, stageId, order } = parsed.data;

  if (contactId) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, ownerId: userId } });
    if (!contact) {
      return NextResponse.json({ error: "Contato inválido." }, { status: 400 });
    }
  }

  // Moving to a new stage without an explicit order: append to the end of that column.
  let nextOrder = order;
  if (stageId && stageId !== existing.stageId && nextOrder === undefined) {
    nextOrder = await prisma.deal.count({ where: { stageId, ownerId: userId } });
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(value !== undefined && { value }),
      ...(contactId !== undefined && { contactId }),
      ...(stageId !== undefined && { stageId }),
      ...(nextOrder !== undefined && { order: nextOrder }),
    },
    include: { contact: { select: { id: true, name: true, company: true } } },
  });

  return NextResponse.json(deal);
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.deal.findFirst({ where: { id, ownerId: userId } });
  if (!existing) {
    return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
  }

  await prisma.deal.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
