"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DealFormModal, type DealFormValues } from "@/components/deal-form-modal";

export type StageColumn = {
  id: string;
  name: string;
  order: number;
  color: string;
};

export type DealCard = {
  id: string;
  title: string;
  value: number;
  order: number;
  stageId: string;
  contact: { id: string; name: string; company: string | null };
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function PipelineBoard({
  stages,
  deals,
  contacts,
}: {
  stages: StageColumn[];
  deals: DealCard[];
  contacts: { id: string; name: string; company: string | null }[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DealFormValues | undefined>(undefined);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  function openNew(stageId: string) {
    setEditing({ title: "", value: "0", contactId: "", stageId });
    setModalOpen(true);
  }

  function openEdit(deal: DealCard) {
    setEditing({
      id: deal.id,
      title: deal.title,
      value: String(deal.value),
      contactId: deal.contact.id,
      stageId: deal.stageId,
    });
    setModalOpen(true);
  }

  async function moveDeal(dealId: string, stageId: string) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stageId === stageId) return;

    await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    });
    router.refresh();
  }

  const dealsByStage = new Map<string, DealCard[]>();
  for (const stage of stages) dealsByStage.set(stage.id, []);
  for (const deal of deals) {
    dealsByStage.get(deal.stageId)?.push(deal);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pipeline de Vendas</h1>
          <p className="mt-1 text-sm text-slate-500">Arraste os cartões entre os estágios.</p>
        </div>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = dealsByStage.get(stage.id) ?? [];
          const total = stageDeals.reduce((sum, d) => sum + d.value, 0);
          const isDragOver = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage.id);
              }}
              onDragLeave={() => setDragOverStage((s) => (s === stage.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStage(null);
                if (draggingId) moveDeal(draggingId, stage.id);
              }}
              className={`flex w-72 shrink-0 flex-col rounded-xl border bg-slate-50 ${
                isDragOver ? "border-slate-400 bg-slate-100" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h2 className="text-sm font-semibold text-slate-900">{stage.name}</h2>
                  <span className="text-xs text-slate-400">({stageDeals.length})</span>
                </div>
                <button
                  onClick={() => openNew(stage.id)}
                  className="text-slate-400 hover:text-slate-700"
                  title="Novo negócio"
                >
                  +
                </button>
              </div>
              <div className="px-3 pb-2 text-xs text-slate-500">
                {currencyFormatter.format(total)}
              </div>

              <div className="flex-1 space-y-2 px-3 pb-3">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => setDraggingId(deal.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => openEdit(deal)}
                    className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300 active:cursor-grabbing ${
                      draggingId === deal.id ? "opacity-50" : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">{deal.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{deal.contact.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {currencyFormatter.format(deal.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <DealFormModal
          key={editing.id ?? `new-${editing.stageId}`}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initialValues={editing}
          contacts={contacts}
          stages={stages}
        />
      )}
    </div>
  );
}
