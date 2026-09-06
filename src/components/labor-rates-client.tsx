"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LaborRateFormModal, type LaborRateFormValues } from "@/components/labor-rate-form-modal";

export type LaborRateRow = {
  id: string;
  code: string | null;
  name: string;
  hourlyCost: number;
  active: boolean;
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function LaborRatesClient({ rates }: { rates: LaborRateRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LaborRateFormValues | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openNew() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(rate: LaborRateRow) {
    setEditing({
      id: rate.id,
      code: rate.code ?? "",
      name: rate.name,
      hourlyCost: String(rate.hourlyCost),
      active: rate.active,
    });
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este cargo?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/labor-rates/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tabela de Cargos (HH)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Custo-hora por cargo/atividade, usado nos orçamentos. O preço de venda de cada hora é
            calculado como custo-hora ÷ (1 − margem de mão de obra do orçamento).
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Novo cargo
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {rates.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Nenhum cargo cadastrado ainda. Clique em &quot;Novo cargo&quot; para começar.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Custo-hora</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rates.map((rate) => (
                <tr key={rate.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{rate.name}</td>
                  <td className="px-4 py-3 text-slate-600">{rate.code || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{currency.format(rate.hourlyCost)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        rate.active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {rate.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(rate)}
                      className="mr-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(rate.id)}
                      disabled={deletingId === rate.id}
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

      <LaborRateFormModal
        key={editing?.id ?? "new"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialValues={editing}
      />
    </div>
  );
}
