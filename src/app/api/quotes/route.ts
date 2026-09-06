import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { quoteSchema } from "@/lib/validation";
import { computeQuoteTotalsFromItems } from "@/lib/quote-calculations";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const quotes = await prisma.quote.findMany({
    where: { ownerId: userId },
    include: { contact: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  const withTotals = quotes.map((quote) => ({
    ...quote,
    totals: computeQuoteTotalsFromItems(quote.items, {
      laborMarginPct: quote.laborMarginPct,
      expenseMarginPct: quote.expenseMarginPct,
      issPct: quote.issPct,
    }),
  }));

  return NextResponse.json(withTotals);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { contactId, dealId, validUntil, notes, items, ...rest } = parsed.data;

  const contact = await prisma.contact.findFirst({ where: { id: contactId, ownerId: userId } });
  if (!contact) {
    return NextResponse.json({ error: "Contato não encontrado." }, { status: 404 });
  }

  if (dealId) {
    const deal = await prisma.deal.findFirst({ where: { id: dealId, ownerId: userId } });
    if (!deal) {
      return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
    }
  }

  const quote = await prisma.quote.create({
    data: {
      ...rest,
      contactId,
      dealId: dealId || null,
      validUntil: validUntil ? new Date(validUntil) : null,
      notes: notes || null,
      ownerId: userId,
      items: {
        create: items.map((item, index) => ({
          category: item.category,
          description: item.description,
          quantity: item.quantity,
          unitCost: item.unitCost,
          unit: item.unit || "un",
          order: index,
        })),
      },
    },
    include: { contact: true, items: true },
  });

  const totals = computeQuoteTotalsFromItems(quote.items, {
    laborMarginPct: quote.laborMarginPct,
    expenseMarginPct: quote.expenseMarginPct,
    issPct: quote.issPct,
  });

  return NextResponse.json({ ...quote, totals }, { status: 201 });
}
