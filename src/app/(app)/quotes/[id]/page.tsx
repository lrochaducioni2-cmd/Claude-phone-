import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { computeQuoteTotalsFromItems } from "@/lib/quote-calculations";
import { QUOTE_TYPE_LABELS, QUOTE_ITEM_CATEGORY_LABELS } from "@/lib/labels";
import { QuoteStatusSelect } from "@/components/quote-status-select";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormat = new Intl.DateTimeFormat("pt-BR");

type Params = { params: Promise<{ id: string }> };

export default async function QuoteDetailPage({ params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) notFound();

  const quote = await prisma.quote.findFirst({
    where: { id, ownerId: userId },
    include: { contact: true, deal: true, items: { orderBy: { order: "asc" } } },
  });
  if (!quote) notFound();

  const totals = computeQuoteTotalsFromItems(quote.items, {
    laborMarginPct: quote.laborMarginPct,
    expenseMarginPct: quote.expenseMarginPct,
    issPct: quote.issPct,
  });

  const laborItems = quote.items.filter((item) => item.category === "MAO_DE_OBRA");
  const otherItems = quote.items.filter((item) => item.category !== "MAO_DE_OBRA");

  return (
    <div>
      <Link href="/quotes" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
        ← Voltar para orçamentos
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            #{quote.number} — {quote.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {QUOTE_TYPE_LABELS[quote.type]} · {quote.contact.name}
            {quote.contact.company ? ` (${quote.contact.company})` : ""}
            {quote.validUntil ? ` · válido até ${dateFormat.format(quote.validUntil)}` : ""}
          </p>
        </div>
        <QuoteStatusSelect quoteId={quote.id} status={quote.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              {QUOTE_ITEM_CATEGORY_LABELS.MAO_DE_OBRA}
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Descrição</th>
                  <th className="px-4 py-2 text-right">Horas</th>
                  <th className="px-4 py-2 text-right">Custo-hora</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {laborItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-slate-700">{item.description}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{currency.format(item.unitCost)}</td>
                    <td className="px-4 py-2 text-right font-medium text-slate-900">
                      {currency.format(item.quantity * item.unitCost)}
                    </td>
                  </tr>
                ))}
                {laborItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm text-slate-400">
                      Nenhum item de mão de obra.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              Despesas e outros itens
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Descrição</th>
                  <th className="px-4 py-2">Categoria</th>
                  <th className="px-4 py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {otherItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-slate-700">{item.description}</td>
                    <td className="px-4 py-2 text-slate-500">{QUOTE_ITEM_CATEGORY_LABELS[item.category]}</td>
                    <td className="px-4 py-2 text-right font-medium text-slate-900">
                      {currency.format(item.quantity * item.unitCost)}
                    </td>
                  </tr>
                ))}
                {otherItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm text-slate-400">
                      Nenhuma despesa cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {quote.notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <div className="mb-1 font-semibold text-slate-900">Observações</div>
              {quote.notes}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <h2 className="font-semibold text-slate-900">Parâmetros</h2>
            <dl className="mt-2 space-y-1 text-slate-600">
              <div className="flex justify-between">
                <dt>Margem mão de obra</dt>
                <dd>{(quote.laborMarginPct * 100).toFixed(0)}%</dd>
              </div>
              <div className="flex justify-between">
                <dt>Margem despesas</dt>
                <dd>{(quote.expenseMarginPct * 100).toFixed(0)}%</dd>
              </div>
              <div className="flex justify-between">
                <dt>ISS</dt>
                <dd>{(quote.issPct * 100).toFixed(0)}%</dd>
              </div>
              <div className="flex justify-between">
                <dt>Dias de campo</dt>
                <dd>{quote.fieldDays}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Dias de deslocamento</dt>
                <dd>{quote.travelDays}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-900 p-4 text-white">
            <h2 className="text-sm font-semibold">Resumo financeiro</h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Mão de obra (custo)</dt>
                <dd>{currency.format(totals.laborSubtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Mão de obra c/ margem + ISS</dt>
                <dd>{currency.format(totals.laborFinal)}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/20 pt-2">
                <dt>Despesas (custo)</dt>
                <dd>{currency.format(totals.expenseSubtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Despesas c/ margem + ISS</dt>
                <dd>{currency.format(totals.expenseFinal)}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/20 pt-2 text-base font-semibold">
                <dt>Total da proposta</dt>
                <dd>{currency.format(totals.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
