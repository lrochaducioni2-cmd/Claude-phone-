"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  QUOTE_TYPE_LABELS,
  QUOTE_ITEM_CATEGORY_LABELS,
  INSPECTION_ACCESS_MODE_LABELS,
  INSPECTION_LEVEL_LABELS,
  isInspectionQuoteType,
} from "@/lib/labels";
import {
  computeQuoteTotalsFromItems,
  calculateFuelCost,
  calculateInspectionFieldHours,
  calculateInspectionOfficeHours,
  inspectionKey,
  type QuoteItemLike,
} from "@/lib/quote-calculations";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export type ContactOption = { id: string; name: string; company: string | null };
export type LaborRateOption = { id: string; name: string; hourlyCost: number };
export type InspectionStandardOption = {
  accessMode: string;
  inspectionLevel: string;
  minutesPerUnit: number;
};
export type TravelPolicyValues = {
  dailyHotelRate: number;
  lunchRate: number;
  dinnerRate: number;
  defaultTravelDays: number;
  fuelPricePerLiter: number;
  vehicleConsumptionKmPerLiter: number;
  flightTicketDefault: number;
  rentalCarDailyRate: number;
  parkingDefault: number;
};

type LaborRow = {
  key: string;
  description: string;
  hours: string;
  hourlyCost: string;
};

type ExpenseRow = {
  key: string;
  description: string;
  unitCost: string;
  touched: boolean; // true depois que o usuário edita manualmente (não recalcula mais sozinho)
};

const QUOTE_TYPES = Object.keys(QUOTE_TYPE_LABELS);
const ACCESS_MODES = ["NIVEL_SOLO", "COM_ESCADAS"];
const LEVELS = ["VISUAL", "APURADA", "DETALHADA"];

let rowCounter = 0;
function newKey() {
  rowCounter += 1;
  return `row-${rowCounter}`;
}

export function QuoteForm({
  contacts,
  laborRates,
  travelPolicy,
  inspectionStandards,
}: {
  contacts: ContactOption[];
  laborRates: LaborRateOption[];
  travelPolicy: TravelPolicyValues;
  inspectionStandards: InspectionStandardOption[];
}) {
  const router = useRouter();

  const [type, setType] = useState(QUOTE_TYPES[0]);
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [laborMarginPct, setLaborMarginPct] = useState("0.5");
  const [expenseMarginPct, setExpenseMarginPct] = useState("0.3");
  const [issPct, setIssPct] = useState("0.07");
  const [fieldDays, setFieldDays] = useState("1");
  const [travelDays, setTravelDays] = useState(String(travelPolicy.defaultTravelDays));
  const [kmRoundTrip, setKmRoundTrip] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [laborRows, setLaborRows] = useState<LaborRow[]>([
    { key: newKey(), description: laborRates[0]?.name ?? "", hours: "0", hourlyCost: String(laborRates[0]?.hourlyCost ?? 0) },
  ]);

  const [equipmentQuantities, setEquipmentQuantities] = useState<Record<string, string>>({});

  const totalDaysForRates = (Number(fieldDays) || 0) + (Number(travelDays) || 0);

  // Valores sugeridos (padrão da Política de Viagem), recalculados sempre que
  // dias de campo/deslocamento ou km mudam. Reativo via useMemo — não depende
  // de closures presas a um valor antigo de estado.
  const defaultExpenseValues = useMemo<Record<string, string>>(
    () => ({
      passagem: String(travelPolicy.flightTicketDefault * 2),
      aluguel_carro: String(travelPolicy.rentalCarDailyRate * totalDaysForRates),
      combustivel: String(
        calculateFuelCost({
          kmRoundTrip: Number(kmRoundTrip) || 0,
          consumptionKmPerLiter: travelPolicy.vehicleConsumptionKmPerLiter,
          pricePerLiter: travelPolicy.fuelPricePerLiter,
        }),
      ),
      hospedagem: String(travelPolicy.dailyHotelRate * totalDaysForRates),
      almoco: String(travelPolicy.lunchRate * totalDaysForRates),
      janta: String(travelPolicy.dinnerRate * totalDaysForRates),
      estacionamento: String(travelPolicy.parkingDefault),
    }),
    [travelPolicy, totalDaysForRates, kmRoundTrip],
  );

  function buildDefaultExpenseRows(): ExpenseRow[] {
    return [
      { key: "passagem", description: "Passagem aérea (ida e volta)", unitCost: defaultExpenseValues.passagem, touched: false },
      { key: "aluguel_carro", description: "Aluguel de carro", unitCost: defaultExpenseValues.aluguel_carro, touched: false },
      { key: "combustivel", description: "Combustível", unitCost: defaultExpenseValues.combustivel, touched: false },
      { key: "hospedagem", description: "Hospedagem", unitCost: defaultExpenseValues.hospedagem, touched: false },
      { key: "almoco", description: "Almoço", unitCost: defaultExpenseValues.almoco, touched: false },
      { key: "janta", description: "Janta", unitCost: defaultExpenseValues.janta, touched: false },
      { key: "estacionamento", description: "Estacionamento", unitCost: defaultExpenseValues.estacionamento, touched: false },
    ];
  }

  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>(buildDefaultExpenseRows);

  // Valor efetivo de uma linha: enquanto não editada manualmente (touched),
  // segue o padrão calculado ao vivo (dias/km/política) sem precisar
  // sincronizar estado em um efeito — só uma linha tocada guarda seu próprio
  // valor. Linhas customizadas (sem entrada em defaultExpenseValues) sempre
  // usam o que está em unitCost.
  function effectiveUnitCost(row: ExpenseRow): string {
    if (row.touched) return row.unitCost;
    return defaultExpenseValues[row.key] ?? row.unitCost;
  }

  function updateExpenseValue(key: string, value: string) {
    setExpenseRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, unitCost: value, touched: true } : row)),
    );
  }

  function resetExpenseToDefault(key: string) {
    setExpenseRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, touched: false } : row)),
    );
  }

  function addCustomExpense() {
    setExpenseRows((rows) => [
      ...rows,
      { key: newKey(), description: "", unitCost: "0", touched: true },
    ]);
  }

  function removeExpense(key: string) {
    setExpenseRows((rows) => rows.filter((row) => row.key !== key));
  }

  function updateExpenseDescription(key: string, description: string) {
    setExpenseRows((rows) => rows.map((row) => (row.key === key ? { ...row, description } : row)));
  }

  function addLaborRow() {
    setLaborRows((rows) => [
      ...rows,
      { key: newKey(), description: laborRates[0]?.name ?? "", hours: "0", hourlyCost: String(laborRates[0]?.hourlyCost ?? 0) },
    ]);
  }

  function removeLaborRow(key: string) {
    setLaborRows((rows) => rows.filter((row) => row.key !== key));
  }

  function updateLaborRow(key: string, patch: Partial<LaborRow>) {
    setLaborRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function selectLaborRate(key: string, laborRateId: string) {
    const rate = laborRates.find((r) => r.id === laborRateId);
    if (!rate) return;
    updateLaborRow(key, { description: rate.name, hourlyCost: String(rate.hourlyCost) });
  }

  function applyInspectionCalculator() {
    const standards = inspectionStandards;
    const quantities = equipmentQuantities;
    const { hours: campoHoras, totalUnits } = calculateInspectionFieldHours(
      standards,
      Object.fromEntries(Object.entries(quantities).map(([k, v]) => [k, Number(v) || 0])),
    );
    const escritorioHoras = calculateInspectionOfficeHours(totalUnits);

    const campoRate = laborRates.find((r) => r.name.toLowerCase().includes("campo"));
    const escritorioRate = laborRates.find((r) => r.name.toLowerCase().includes("escrit"));

    setLaborRows([
      {
        key: newKey(),
        description: campoRate?.name ?? "HH de campo",
        hours: String(campoHoras),
        hourlyCost: String(campoRate?.hourlyCost ?? 0),
      },
      {
        key: newKey(),
        description: escritorioRate?.name ?? "HH de escritório",
        hours: String(escritorioHoras),
        hourlyCost: String(escritorioRate?.hourlyCost ?? 0),
      },
    ]);

    setFieldDays(String(Math.ceil(campoHoras / 8) + 2));
  }

  const items: QuoteItemLike[] = useMemo(() => {
    const labor = laborRows.map((row) => ({
      category: "MAO_DE_OBRA",
      quantity: Number(row.hours) || 0,
      unitCost: Number(row.hourlyCost) || 0,
    }));
    const expenses = expenseRows.map((row) => ({
      category: "DESPESA",
      quantity: 1,
      unitCost: Number(row.touched ? row.unitCost : (defaultExpenseValues[row.key] ?? row.unitCost)) || 0,
    }));
    return [...labor, ...expenses];
  }, [laborRows, expenseRows, defaultExpenseValues]);

  const totals = useMemo(
    () =>
      computeQuoteTotalsFromItems(items, {
        laborMarginPct: Number(laborMarginPct) || 0,
        expenseMarginPct: Number(expenseMarginPct) || 0,
        issPct: Number(issPct) || 0,
      }),
    [items, laborMarginPct, expenseMarginPct, issPct],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      type,
      contactId,
      title,
      validUntil,
      laborMarginPct,
      expenseMarginPct,
      issPct,
      fieldDays,
      travelDays,
      items: [
        ...laborRows.map((row) => ({
          category: "MAO_DE_OBRA",
          description: row.description,
          quantity: row.hours,
          unitCost: row.hourlyCost,
          unit: "h",
        })),
        ...expenseRows
          .filter((row) => row.description.trim())
          .map((row) => ({
            category: "DESPESA",
            description: row.description,
            quantity: "1",
            unitCost: effectiveUnitCost(row),
            unit: "un",
          })),
      ],
    };

    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar o orçamento.");
      return;
    }

    const created = await res.json();
    router.push(`/quotes/${created.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Dados gerais</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Tipo de orçamento *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {QUOTE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {QUOTE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Contato/Empresa *</label>
            <select
              required
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="" disabled>
                Selecione...
              </option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Título *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Inspeção apurada - Planta X"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Válido até</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {isInspectionQuoteType(type) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Calculadora de horas (Inspeção)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Informe a quantidade de equipamentos por combinação — as horas de campo e de
            escritório são calculadas automaticamente a partir do tempo padrão cadastrado.
          </p>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-1 pr-4">Modo de acesso</th>
                  {LEVELS.map((level) => (
                    <th key={level} className="py-1 pr-4">
                      {INSPECTION_LEVEL_LABELS[level]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ACCESS_MODES.map((accessMode) => (
                  <tr key={accessMode}>
                    <td className="py-1 pr-4 font-medium text-slate-700">
                      {INSPECTION_ACCESS_MODE_LABELS[accessMode]}
                    </td>
                    {LEVELS.map((level) => {
                      const key = inspectionKey(accessMode, level);
                      return (
                        <td key={key} className="py-1 pr-4">
                          <input
                            type="number"
                            min={0}
                            value={equipmentQuantities[key] ?? ""}
                            onChange={(e) =>
                              setEquipmentQuantities((q) => ({ ...q, [key]: e.target.value }))
                            }
                            placeholder="0"
                            className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={applyInspectionCalculator}
            className="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Aplicar cálculo às horas de mão de obra
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            {QUOTE_ITEM_CATEGORY_LABELS.MAO_DE_OBRA}
          </h2>
          <button
            type="button"
            onClick={addLaborRow}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            + adicionar cargo
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {laborRows.map((row) => (
            <div key={row.key} className="grid grid-cols-12 items-center gap-2">
              <select
                value={laborRates.find((r) => r.name === row.description)?.id ?? ""}
                onChange={(e) => selectLaborRate(row.key, e.target.value)}
                className="col-span-5 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="" disabled>
                  Selecione o cargo...
                </option>
                {laborRates.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="0.5"
                value={row.hours}
                onChange={(e) => updateLaborRow(row.key, { hours: e.target.value })}
                placeholder="Horas"
                className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={row.hourlyCost}
                onChange={(e) => updateLaborRow(row.key, { hourlyCost: e.target.value })}
                placeholder="Custo-hora"
                className="col-span-3 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              />
              <span className="col-span-1 text-right text-xs text-slate-500">
                {currency.format((Number(row.hours) || 0) * (Number(row.hourlyCost) || 0))}
              </span>
              <button
                type="button"
                onClick={() => removeLaborRow(row.key)}
                className="col-span-1 text-right text-xs font-medium text-red-600 hover:text-red-800"
              >
                remover
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Despesas de deslocamento</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Valores pré-preenchidos pela Política de Viagem × (dias de campo + dias de
              deslocamento). Edite se este orçamento for diferente do padrão.
            </p>
          </div>
          <button
            type="button"
            onClick={addCustomExpense}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            + adicionar item
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3 rounded-md bg-slate-50 p-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-600">Dias de campo</label>
            <input
              type="number"
              min={0}
              step="0.5"
              value={fieldDays}
              onChange={(e) => setFieldDays(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Dias de deslocamento</label>
            <input
              type="number"
              min={0}
              step="0.5"
              value={travelDays}
              onChange={(e) => setTravelDays(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Km rodado (ida e volta)</label>
            <input
              type="number"
              min={0}
              value={kmRoundTrip}
              onChange={(e) => setKmRoundTrip(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {expenseRows.map((row) => (
            <div key={row.key} className="grid grid-cols-12 items-center gap-2">
              <input
                value={row.description}
                onChange={(e) => updateExpenseDescription(row.key, e.target.value)}
                placeholder="Descrição"
                className="col-span-6 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={
                  row.touched
                    ? row.unitCost
                    : (Number(effectiveUnitCost(row)) || 0).toFixed(2)
                }
                onChange={(e) => updateExpenseValue(row.key, e.target.value)}
                className="col-span-3 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              />
              <span className="col-span-1 text-xs text-slate-400">
                {row.touched ? "editado" : "padrão"}
              </span>
              <div className="col-span-2 flex justify-end gap-2">
                {row.touched && (
                  <button
                    type="button"
                    onClick={() => resetExpenseToDefault(row.key)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    restaurar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeExpense(row.key)}
                  className="text-xs font-medium text-red-600 hover:text-red-800"
                >
                  remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Margens e impostos</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Margem mão de obra</label>
            <input
              type="number"
              min={0}
              max={0.99}
              step="0.01"
              value={laborMarginPct}
              onChange={(e) => setLaborMarginPct(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Margem despesas</label>
            <input
              type="number"
              min={0}
              max={0.99}
              step="0.01"
              value={expenseMarginPct}
              onChange={(e) => setExpenseMarginPct(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">ISS</label>
            <input
              type="number"
              min={0}
              max={1}
              step="0.01"
              value={issPct}
              onChange={(e) => setIssPct(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-900 bg-slate-900 p-4 text-white">
        <h2 className="text-sm font-semibold">Resumo</h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Mão de obra (com margem + ISS)</dt>
            <dd>{currency.format(totals.laborFinal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Despesas (com margem + ISS)</dt>
            <dd>{currency.format(totals.expenseFinal)}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-white/20 pt-2 text-base font-semibold">
            <dt>Total da proposta</dt>
            <dd>{currency.format(totals.total)}</dd>
          </div>
        </dl>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar orçamento"}
        </button>
      </div>
    </form>
  );
}
