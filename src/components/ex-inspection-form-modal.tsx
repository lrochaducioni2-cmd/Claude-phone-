"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormActions, ModalShell, inputClass, submitJson } from "@/components/ex-form-fields";
import { EX_INSPECTION_TYPE_LABELS, INSPECTION_LEVEL_LABELS } from "@/lib/labels";
import { toDateInputValue } from "@/lib/ex-dates";

export type QuoteOption = { id: string; number: number; title: string };

type AreaOption = { id: string; name: string; equipmentCount: number };

export function ExInspectionFormModal({
  facilityId,
  areas,
  quotes,
  onClose,
}: {
  facilityId: string;
  areas: AreaOption[];
  quotes: QuoteOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [level, setLevel] = useState("VISUAL");
  const [type, setType] = useState("PERIODICA");
  const [inspectorName, setInspectorName] = useState("");
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [quoteId, setQuoteId] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>(
    areas.filter((area) => area.equipmentCount > 0).map((area) => area.id),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedEquipment = areas
    .filter((area) => selectedAreaIds.includes(area.id))
    .reduce((sum, area) => sum + area.equipmentCount, 0);

  function toggleArea(id: string) {
    setSelectedAreaIds((ids) => (ids.includes(id) ? ids.filter((a) => a !== id) : [...ids, id]));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedAreaIds.length === 0) {
      setError("Selecione ao menos uma área.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await submitJson(
      "/api/ex/inspections",
      "POST",
      { facilityId, level, type, inspectorName, date, quoteId, notes, areaIds: selectedAreaIds },
      "Não foi possível criar a inspeção.",
    );
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const created = result.data as { id: string };
    router.push(`/ex/inspections/${created.id}`);
  }

  return (
    <ModalShell title="Nova inspeção Ex" wide>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nível de inspeção">
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
              {Object.entries(INSPECTION_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              {Object.entries(EX_INSPECTION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inspetor responsável">
            <input value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Data">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Orçamento vinculado">
          <select value={quoteId} onChange={(e) => setQuoteId(e.target.value)} className={inputClass}>
            <option value="">— Nenhum —</option>
            {quotes.map((quote) => (
              <option key={quote.id} value={quote.id}>
                #{quote.number} — {quote.title}
              </option>
            ))}
          </select>
        </Field>

        <fieldset>
          <legend className="block text-sm font-medium text-slate-700">
            Áreas incluídas ({selectedEquipment} equipamentos)
          </legend>
          <div className="mt-1 max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
            {areas.map((area) => (
              <label key={area.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedAreaIds.includes(area.id)}
                  onChange={() => toggleArea(area.id)}
                  disabled={area.equipmentCount === 0}
                />
                {area.name}
                <span className="text-xs text-slate-400">({area.equipmentCount})</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Observações">
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </Field>

        <FormActions loading={loading} error={error} onClose={onClose} submitLabel="Criar inspeção" />
      </form>
    </ModalShell>
  );
}
