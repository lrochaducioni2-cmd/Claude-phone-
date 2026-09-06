import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { quoteUpdateSchema } from "@/lib/validation";
import { computeQuoteTotalsFromItems } from "@/lib/quote-calculations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const quote = await prisma.quote.findFirst({
    where: { id, ownerId: userId },
    include: { contact: true, deal: true, items: { orderBy: { order: "asc" } } },
  });
  if (!quote) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  const totals = computeQuoteTotalsFromItems(quote.items, {
    laborMarginPct: quote.laborMarginPct,
    expenseMarginPct: quote.expenseMarginPct,
    issPct: quote.issPct,
  });

  return NextResponse.json({ ...quote, totals });
}

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.quote.findFirst({ where: { id, ownerId: userId } });
  if (!existing) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = quoteUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { contactId, dealId, validUntil, notes, items, ...rest } = parsed.data;

  if (contactId !== undefined) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, ownerId: userId } });
    if (!contact) {
      return NextResponse.json({ error: "Contato não encontrado." }, { status: 404 });
    }
  }

  if (dealId) {
    const deal = await prisma.deal.findFirst({ where: { id: dealId, ownerId: userId } });
    if (!deal) {
      return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: { id },
      data: {
        ...rest,
        ...(contactId !== undefined && { contactId }),
        ...(dealId !== undefined && { dealId: dealId || null }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    if (items !== undefined) {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });
      await tx.quoteItem.createMany({
        data: items.map((item, index) => ({
          quoteId: id,
          category: item.category,
          description: item.description,
          quantity: item.quantity,
          unitCost: item.unitCost,
          unit: item.unit || "un",
          order: index,
        })),
      });
    }
  });

  const quote = await prisma.quote.findFirstOrThrow({
    where: { id },
    include: { contact: true, deal: true, items: { orderBy: { order: "asc" } } },
  });

  const totals = computeQuoteTotalsFromItems(quote.items, {
    laborMarginPct: quote.laborMarginPct,
    expenseMarginPct: quote.expenseMarginPct,
    issPct: quote.issPct,
  });

  return NextResponse.json({ ...quote, totals });
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.quote.findFirst({ where: { id, ownerId: userId } });
  if (!existing) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  await prisma.quote.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
