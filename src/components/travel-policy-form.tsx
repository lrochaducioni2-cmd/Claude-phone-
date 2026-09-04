"use client";

import { useState } from "react";

type PolicyValues = {
  originCity: string;
  dailyHotelRate: string;
  dailyMealRate: string;
  kmRate: string;
  flightTicketDefault: string;
  rentalCarDailyRate: string;
  fuelDefault: string;
  parkingDefault: string;
};

const FIELDS: { key: keyof PolicyValues; label: string; hint?: string }[] = [
  { key: "dailyHotelRate", label: "Diária de hotel (R$/dia)" },
  { key: "dailyMealRate", label: "Diária de alimentação (R$/dia)" },
  { key: "kmRate", label: "Carro próprio (R$/km rodado)" },
  { key: "flightTicketDefault", label: "Passagem aérea (R$, valor de referência)", hint: "Editável em cada orçamento" },
  { key: "rentalCarDailyRate", label: "Carro alugado no destino (R$/dia)" },
  { key: "fuelDefault", label: "Combustível (R$, valor de referência)", hint: "Para carro alugado" },
  { key: "parkingDefault", label: "Estacionamento (R$, valor de referência)" },
];

export function TravelPolicyForm({ initialValues }: { initialValues: PolicyValues }) {
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    const res = await fetch("/api/travel-policy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar a política.");
      return;
    }

    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Cidade de origem</label>
        <input
          value={values.originCity}
          onChange={(e) => setValues((v) => ({ ...v, originCity: e.target.value }))}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-500">
          Não há regra fixa de carro vs. avião — em cada orçamento você escolhe livremente quais
          componentes usar (podem ser combinados, ex.: avião + carro alugado + combustível +
          estacionamento). Os valores abaixo são os padrões sugeridos; cada um pode ser ajustado
          por orçamento quando necessário.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700">{field.label}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={values[field.key]}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              {field.hint && <p className="mt-0.5 text-xs text-slate-400">{field.hint}</p>}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Política salva.</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Salvar política"}
      </button>
    </form>
  );
}
