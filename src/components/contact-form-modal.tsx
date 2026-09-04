"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STATUS_LABELS } from "@/lib/labels";

export type ContactFormValues = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  status: string;
};

const EMPTY_VALUES: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
  status: "NEW",
};

export function ContactFormModal({
  open,
  onClose,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  initialValues?: ContactFormValues;
}) {
  const router = useRouter();
  // Keying this component by contact id (see ContactsClient) ensures a fresh
  // `values` state whenever we switch between "new" and editing a different
  // contact, without needing an effect to resync state from props.
  const [values, setValues] = useState<ContactFormValues>(initialValues ?? EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const isEditing = Boolean(values.id);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      company: values.company,
      notes: values.notes,
      status: values.status,
    };

    const res = await fetch(isEditing ? `/api/contacts/${values.id}` : "/api/contacts", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar o contato.");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">
          {isEditing ? "Editar contato" : "Novo contato"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome *</label>
            <input
              required
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">E-mail</label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Telefone</label>
              <input
                value={values.phone}
                onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Empresa</label>
              <input
                value={values.company}
                onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select
                value={values.status}
                onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Observações</label>
            <textarea
              value={values.notes}
              onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
