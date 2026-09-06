import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { QuotesClient } from "@/components/quotes-client";
import { computeQuoteTotalsFromItems } from "@/lib/quote-calculations";

export default async function QuotesPage() {
  const userId = await getCurrentUserId();

  const quotes = userId
    ? await prisma.quote.findMany({
        where: { ownerId: userId },
        include: { contact: true, items: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const rows = quotes.map((quote) => {
    const totals = computeQuoteTotalsFromItems(quote.items, {
      laborMarginPct: quote.laborMarginPct,
      expenseMarginPct: quote.expenseMarginPct,
      issPct: quote.issPct,
    });
    return {
      id: quote.id,
      number: quote.number,
      type: quote.type,
      status: quote.status,
      title: quote.title,
      contact: { name: quote.contact.name, company: quote.contact.company },
      total: totals.total,
    };
  });

  return <QuotesClient quotes={rows} />;
}
