import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { dealSchema } from "@/lib/validation";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const deals = await prisma.deal.findMany({
    where: { ownerId: userId },
    include: { contact: { select: { id: true, name: true, company: true } } },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(deals);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = dealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { title, value, contactId, stageId } = parsed.data;

  const contact = await prisma.contact.findFirst({ where: { id: contactId, ownerId: userId } });
  if (!contact) {
    return NextResponse.json({ error: "Contato inválido." }, { status: 400 });
  }

  const dealsInStage = await prisma.deal.count({ where: { stageId, ownerId: userId } });

  const deal = await prisma.deal.create({
    data: {
      title,
      value,
      contactId,
      stageId,
      ownerId: userId,
      order: dealsInStage,
    },
    include: { contact: { select: { id: true, name: true, company: true } } },
  });

  return NextResponse.json(deal, { status: 201 });
}
