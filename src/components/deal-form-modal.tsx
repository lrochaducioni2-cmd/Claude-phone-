"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type DealFormValues = {
  id?: string;
  title: string;
  value: string;
  contactId: string;
  stageId: string;
};

export function DealFormModal({
  open,
  onClose,
  initialValues,
  contacts,
  stages,
}: {
  open: boolean;
  onClose: () => void;
  initialValues: DealFormValues;
  contacts: { id: string; name: string; company: string | null }[];
  stages: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<DealFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const isEditing = Boolean(values.id);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.contactId) {
      setError("Selecione um contato.");
      return;
    }

    setLoading(true);

    const payload = {
      title: values.title,
      value: values.value,
      contactId: values.contactId,
      stageId: values.stageId,
    };

    const res = await fetch(isEditing ? `/api/deals/${values.id}` : "/api/deals", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar o negócio.");
      return;
    }

    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!values.id) return;
    if (!confirm("Tem certeza que deseja excluir este negócio?")) return;
    setLoading(true);
    const res = await fetch(`/api/deals/${values.id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">
          {isEditing ? "Editar negócio" : "Novo negócio"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Título *</label>
            <input
              required
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Valor (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={values.value}
                onChange={(e) => setValues((v) => ({ ...v, value: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Estágio</label>
              <select
                value={values.stageId}
                onChange={(e) => setValues((v) => ({ ...v, stageId: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Contato *</label>
            <select
              required
              value={values.contactId}
              onChange={(e) => setValues((v) => ({ ...v, contactId: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">Selecione...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                  {contact.company ? ` — ${contact.company}` : ""}
                </option>
              ))}
            </select>
            {contacts.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Cadastre um contato primeiro para poder criar um negócio.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Excluir
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
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
          </div>
        </form>
      </div>
    </div>
  );
}
