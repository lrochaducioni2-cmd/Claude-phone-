"use client";

import { useState } from "react";
import {
  INSPECTION_ACCESS_MODE_LABELS,
  INSPECTION_LEVEL_LABELS,
} from "@/lib/labels";

type Standard = {
  accessMode: string;
  inspectionLevel: string;
  minutesPerUnit: number;
};

const ACCESS_MODES = ["NIVEL_SOLO", "COM_ESCADAS"];
const LEVELS = ["VISUAL", "APURADA", "DETALHADA"];

function keyOf(accessMode: string, inspectionLevel: string) {
  return `${accessMode}:${inspectionLevel}`;
}

export function InspectionTimeStandardsForm({ initialStandards }: { initialStandards: Standard[] }) {
  const initialMap: Record<string, string> = {};
  for (const s of initialStandards) {
    initialMap[keyOf(s.accessMode, s.inspectionLevel)] = String(s.minutesPerUnit);
  }

  const [values, setValues] = useState<Record<string, string>>(initialMap);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    const payload = ACCESS_MODES.flatMap((accessMode) =>
      LEVELS.map((inspectionLevel) => ({
        accessMode,
        inspectionLevel,
        minutesPerUnit: values[keyOf(accessMode, inspectionLevel)] ?? "0",
      })),
    );

    const res = await fetch("/api/inspection-time-standards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar.");
      return;
    }

    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Modo de acesso</th>
              {LEVELS.map((level) => (
                <th key={level} className="px-4 py-3">
                  {INSPECTION_LEVEL_LABELS[level]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ACCESS_MODES.map((accessMode) => (
              <tr key={accessMode}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {INSPECTION_ACCESS_MODE_LABELS[accessMode]}
                </td>
                {LEVELS.map((level) => {
                  const key = keyOf(accessMode, level);
                  return (
                    <td key={key} className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={values[key] ?? "0"}
                        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
                      />
                      <span className="ml-1 text-xs text-slate-400">min/equip.</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-green-600">Tempos salvos.</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Salvar tempos"}
      </button>
    </form>
  );
}
