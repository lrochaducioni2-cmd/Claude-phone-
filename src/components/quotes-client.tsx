"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QUOTE_TYPE_LABELS, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from "@/lib/labels";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export type QuoteRow = {
  id: string;
  number: number;
  type: string;
  status: string;
  title: string;
  contact: { name: string; company: string | null };
  total: number;
};

export function QuotesClient({ quotes }: { quotes: QuoteRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este orçamento?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Orçamentos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mão de obra, despesas, margens e ISS calculados automaticamente a partir das
            configurações.
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Novo orçamento
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/settings/travel-policy" className="text-slate-500 hover:text-slate-800 hover:underline">
          Política de viagem
        </Link>
        <span className="text-slate-300">·</span>
        <Link href="/settings/labor-rates" className="text-slate-500 hover:text-slate-800 hover:underline">
          Tabela de cargos (HH)
        </Link>
        <span className="text-slate-300">·</span>
        <Link href="/settings/inspection-time-standards" className="text-slate-500 hover:text-slate-800 hover:underline">
          Tempo padrão de inspeção
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {quotes.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Nenhum orçamento criado ainda. Clique em &quot;Novo orçamento&quot; para começar.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nº</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td className="px-4 py-3 text-slate-500">#{quote.number}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/quotes/${quote.id}`} className="hover:underline">
                      {quote.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{QUOTE_TYPE_LABELS[quote.type]}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {quote.contact.name}
                    {quote.contact.company ? ` (${quote.contact.company})` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${QUOTE_STATUS_COLORS[quote.status]}`}
                    >
                      {QUOTE_STATUS_LABELS[quote.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {currency.format(quote.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="mr-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Ver
                    </Link>
                    <button
                      onClick={() => handleDelete(quote.id)}
                      disabled={deletingId === quote.id}
                      className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
