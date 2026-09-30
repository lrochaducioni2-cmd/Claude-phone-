"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inputClass, submitJson } from "@/components/ex-form-fields";
import { computeItemResult, getChecklist, type CheckAnswer, type ChecklistItem } from "@/lib/ex-checklist";
import {
  EX_CHECK_ANSWER_LABELS,
  EX_INSPECTION_STATUS_COLORS,
  EX_INSPECTION_STATUS_LABELS,
  EX_INSPECTION_TYPE_LABELS,
  EX_ITEM_RESULT_COLORS,
  EX_ITEM_RESULT_LABELS,
  INSPECTION_LEVEL_LABELS,
  formatProtectionTypes,
} from "@/lib/labels";

type Inspection = {
  id: string;
  number: number;
  level: string;
  type: string;
  status: string;
  date: string;
  inspectorName: string;
  notes: string;
  facility: { id: string; name: string };
  trabalho: { id: string; crmId: string; status: string } | null;
};

export type InspectionItemRow = {
  id: string;
  equipmentTag: string;
  equipmentDesc: string;
  areaName: string;
  protectionTypes: string[];
  answers: Record<string, CheckAnswer>;
  result: string;
  notes: string;
};

type Filter = "ALL" | "PENDENTE" | "NAO_CONFORME";

export function ExInspectionClient({ inspection, items }: { inspection: Inspection; items: InspectionItemRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [results, setResults] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.result])),
  );
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const locked = inspection.status === "CONCLUIDA";

  const counts = useMemo(() => {
    const values = Object.values(results);
    return {
      total: values.length,
      conforme: values.filter((r) => r === "CONFORME").length,
      naoConforme: values.filter((r) => r === "NAO_CONFORME").length,
      pendente: values.filter((r) => r === "PENDENTE").length,
    };
  }, [results]);

  const visibleItems = items.filter((item) => filter === "ALL" || results[item.id] === filter);

  async function changeStatus(status: "EM_ANDAMENTO" | "CONCLUIDA") {
    if (status === "CONCLUIDA" && counts.pendente > 0) {
      const ok = confirm(
        `Ainda há ${counts.pendente} equipamento(s) pendente(s). Concluir mesmo assim? Eles constarão como pendentes no relatório.`,
      );
      if (!ok) return;
    }
    setStatusLoading(true);
    setStatusError(null);
    const result = await submitJson(
      `/api/ex/inspections/${inspection.id}`,
      "PATCH",
      { status },
      "Não foi possível alterar o status.",
    );
    setStatusLoading(false);
    if (result.error) {
      setStatusError(result.error);
      return;
    }
    router.refresh();
  }

  const done = counts.conforme + counts.naoConforme;
  const progressPct = counts.total > 0 ? Math.round((done / counts.total) * 100) : 0;

  return (
    <div>
      <Link
        href={`/ex/facilities/${inspection.facility.id}`}
        className="text-sm text-slate-500 hover:text-slate-800 hover:underline"
      >
        ← {inspection.facility.name}
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Inspeção #{inspection.number} — {INSPECTION_LEVEL_LABELS[inspection.level]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {EX_INSPECTION_TYPE_LABELS[inspection.type]} ·{" "}
            {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${inspection.date}T12:00:00Z`))}
            {inspection.inspectorName ? ` · Inspetor: ${inspection.inspectorName}` : ""}
            {inspection.trabalho ? (
              <>
                {" · "}
                <Link href={`/trabalhos/${inspection.trabalho.id}`} className="hover:underline">
                  Trabalho CRM #{inspection.trabalho.crmId}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${EX_INSPECTION_STATUS_COLORS[inspection.status]}`}
          >
            {EX_INSPECTION_STATUS_LABELS[inspection.status]}
          </span>
          <Link
            href={`/ex/inspections/${inspection.id}/report`}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Relatório
          </Link>
          {inspection.trabalho?.status === "ENTREGUE" ? (
            <span className="text-xs text-slate-500">Trabalho entregue</span>
          ) : locked ? (
            <button
              onClick={() => changeStatus("EM_ANDAMENTO")}
              disabled={statusLoading}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              Reabrir
            </button>
          ) : (
            <button
              onClick={() => changeStatus("CONCLUIDA")}
              disabled={statusLoading}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Concluir inspeção
            </button>
          )}
        </div>
      </div>
      {statusError && <p className="mt-2 text-sm text-red-600">{statusError}</p>}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="text-slate-700">
            <span className="font-semibold">{done}</span> de {counts.total} equipamentos avaliados ({progressPct}%)
          </div>
          <div className="flex gap-3 text-xs">
            <span className="text-green-700">{counts.conforme} conformes</span>
            <span className="text-red-700">{counts.naoConforme} não conformes</span>
            <span className="text-slate-500">{counts.pendente} pendentes</span>
          </div>
        </div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="bg-green-500" style={{ width: `${(counts.conforme / Math.max(counts.total, 1)) * 100}%` }} />
          <div className="bg-red-500" style={{ width: `${(counts.naoConforme / Math.max(counts.total, 1)) * 100}%` }} />
        </div>
      </div>

      <div className="mt-4 flex gap-1 text-sm">
        {(
          [
            ["ALL", `Todos (${counts.total})`],
            ["PENDENTE", `Pendentes (${counts.pendente})`],
            ["NAO_CONFORME", `Não conformes (${counts.naoConforme})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-md px-3 py-1.5 font-medium ${
              filter === value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {/* Cards filtrados ficam só ocultos (não desmontados) para não perder
            respostas ainda não salvas ao trocar de filtro. */}
        {items.map((item) => (
          <InspectionItemCard
            key={item.id}
            hidden={!visibleItems.includes(item)}
            inspectionId={inspection.id}
            level={inspection.level}
            item={item}
            locked={locked}
            onSaved={(result) => {
              setResults((r) => ({ ...r, [item.id]: result }));
              router.refresh();
            }}
          />
        ))}
        {visibleItems.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Nenhum equipamento neste filtro.
          </p>
        )}
      </div>
    </div>
  );
}

function InspectionItemCard({
  hidden,
  inspectionId,
  level,
  item,
  locked,
  onSaved,
}: {
  hidden: boolean;
  inspectionId: string;
  level: string;
  item: InspectionItemRow;
  locked: boolean;
  onSaved: (result: string) => void;
}) {
  const checklist = useMemo(() => getChecklist(item.protectionTypes, level), [item.protectionTypes, level]);
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>(item.answers);
  const [notes, setNotes] = useState(item.notes);
  const [savedResult, setSavedResult] = useState(item.result);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveResult = computeItemResult(checklist, answers);
  const answeredCount = checklist.filter((check) => answers[check.id]).length;

  const sections = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const check of checklist) {
      map.set(check.section, [...(map.get(check.section) ?? []), check]);
    }
    return [...map.entries()];
  }, [checklist]);

  function answer(checkId: string, value: CheckAnswer) {
    setAnswers((a) => {
      const next = { ...a };
      if (next[checkId] === value) delete next[checkId];
      else next[checkId] = value;
      return next;
    });
    setDirty(true);
  }

  function fillRemaining() {
    setAnswers((a) => {
      const next = { ...a };
      for (const check of checklist) if (!next[check.id]) next[check.id] = "C";
      return next;
    });
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const result = await submitJson(
      `/api/ex/inspections/${inspectionId}/items/${item.id}`,
      "PATCH",
      { answers, notes },
      "Não foi possível salvar o item.",
    );
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const saved = result.data as { result: string };
    setSavedResult(saved.result);
    setDirty(false);
    onSaved(saved.result);
  }

  const shownResult = dirty ? liveResult : savedResult;

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${hidden ? "hidden" : ""}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div>
          <span className="font-medium text-slate-900">{item.equipmentTag}</span>
          <span className="ml-2 text-sm text-slate-600">{item.equipmentDesc}</span>
          <div className="text-xs text-slate-400">
            {item.areaName} · {formatProtectionTypes(item.protectionTypes)} · {answeredCount}/{checklist.length}{" "}
            verificações
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-600">não salvo</span>}
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${EX_ITEM_RESULT_COLORS[shownResult]}`}>
            {EX_ITEM_RESULT_LABELS[shownResult]}
          </span>
          <span className="text-slate-400">{open ? "▾" : "▸"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-200 px-4 py-3">
          {checklist.length === 0 ? (
            <p className="text-sm text-amber-700">
              Equipamento sem tipo de proteção cadastrado — não há verificações aplicáveis. Edite o cadastro do
              equipamento e crie uma nova inspeção.
            </p>
          ) : (
            <div className="space-y-4">
              {sections.map(([section, checks]) => (
                <div key={section}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{section}</div>
                  <ul className="mt-1 divide-y divide-slate-100">
                    {checks.map((check) => (
                      <li key={check.id} className="flex items-center justify-between gap-4 py-1.5">
                        <span className="text-sm text-slate-700">{check.text}</span>
                        <div className="flex shrink-0 gap-1">
                          {(["C", "NC", "NA"] as const).map((value) => {
                            const selected = answers[check.id] === value;
                            const color =
                              value === "C"
                                ? "bg-green-600 text-white border-green-600"
                                : value === "NC"
                                  ? "bg-red-600 text-white border-red-600"
                                  : "bg-slate-600 text-white border-slate-600";
                            return (
                              <button
                                key={value}
                                type="button"
                                disabled={locked}
                                onClick={() => answer(check.id, value)}
                                className={`w-11 rounded border px-1 py-1 text-xs font-medium disabled:cursor-not-allowed ${
                                  selected ? color : "border-slate-300 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {EX_CHECK_ANSWER_LABELS[value]}
                              </button>
                            );
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              Observações / não conformidades encontradas
            </label>
            <textarea
              rows={2}
              disabled={locked}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setDirty(true);
              }}
              placeholder="Descreva o defeito e a ação corretiva recomendada."
              className={inputClass}
            />
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          {!locked && (
            <div className="mt-3 flex justify-between">
              <button
                type="button"
                onClick={fillRemaining}
                disabled={checklist.length === 0}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Marcar restantes como C
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !dirty}
                className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
