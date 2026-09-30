"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitJson } from "@/components/ex-form-fields";
import { TRABALHO_STATUS_COLORS, TRABALHO_STATUS_LABELS, empresaLabel } from "@/lib/labels";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

type Disponivel = {
  crmId: string;
  descricaoEscopo: string;
  valor: number | null;
  dataVenda: string | null;
  empresaNome: string | null;
};

type Local = {
  id: string;
  crmId: string;
  descricaoEscopo: string;
  status: string;
  empresa: { razaoSocial: string; nomeFantasia: string | null };
  dataEntrega: string | null;
  inspecoes: number;
  inspecoesConcluidas: number;
  avisoPendente: boolean;
};

function formatCrmDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
}

export function TrabalhosClient({
  crmError,
  disponiveis,
  locais,
}: {
  crmError: string | null;
  disponiveis: Disponivel[];
  locais: Local[];
}) {
  const router = useRouter();
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function iniciar(crmId: string) {
    setImporting(crmId);
    setError(null);
    const result = await submitJson(
      "/api/trabalhos/importar",
      "POST",
      { crmTrabalhoId: crmId },
      "Não foi possível importar o trabalho.",
    );
    setImporting(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/trabalhos/${(result.data as { id: string }).id}`);
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Trabalhos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Serviços vendidos no CRM. Inicie a execução para puxar os dados da empresa; ao entregar, o CRM é
          avisado automaticamente.
        </p>
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Vendidos no CRM — aguardando execução</h2>
          <button
            onClick={() => router.refresh()}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Atualizar
          </button>
        </div>
        {crmError && (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {crmError}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {disponiveis.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              {crmError ? "Não foi possível consultar o CRM." : "Nenhum trabalho vendido aguardando execução."}
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">CRM #</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Escopo</th>
                  <th className="px-4 py-3">Venda</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disponiveis.map((trabalho) => (
                  <tr key={trabalho.crmId}>
                    <td className="px-4 py-3 font-medium text-slate-900">{trabalho.crmId}</td>
                    <td className="px-4 py-3 text-slate-600">{trabalho.empresaNome ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{trabalho.descricaoEscopo}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCrmDate(trabalho.dataVenda)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {trabalho.valor != null ? currency.format(trabalho.valor) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => iniciar(trabalho.crmId)}
                        disabled={importing !== null}
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {importing === trabalho.crmId ? "Iniciando..." : "Iniciar execução"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Em execução e entregues</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {locais.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nenhum trabalho iniciado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">CRM #</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Escopo</th>
                  <th className="px-4 py-3">Inspeções</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locais.map((trabalho) => (
                  <tr key={trabalho.id}>
                    <td className="px-4 py-3">
                      <Link href={`/trabalhos/${trabalho.id}`} className="font-medium text-slate-900 hover:underline">
                        {trabalho.crmId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{empresaLabel(trabalho.empresa)}</td>
                    <td className="px-4 py-3 text-slate-600">{trabalho.descricaoEscopo}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {trabalho.inspecoesConcluidas}/{trabalho.inspecoes} concluídas
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${TRABALHO_STATUS_COLORS[trabalho.status]}`}
                      >
                        {TRABALHO_STATUS_LABELS[trabalho.status]}
                      </span>
                      {trabalho.dataEntrega && (
                        <span className="ml-2 text-xs text-slate-400">
                          {dateFormat.format(new Date(trabalho.dataEntrega))}
                        </span>
                      )}
                      {trabalho.avisoPendente && (
                        <div className="mt-1 text-xs text-red-600">⚠ CRM ainda não foi avisado</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
