"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type TaskFormValues = {
  id?: string;
  title: string;
  description: string;
  dueDate: string; // yyyy-mm-dd, for <input type="date">
  contactId: string;
};

export function TaskFormModal({
  open,
  onClose,
  initialValues,
  contacts,
}: {
  open: boolean;
  onClose: () => void;
  initialValues: TaskFormValues;
  contacts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const isEditing = Boolean(values.id);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      title: values.title,
      description: values.description,
      dueDate: values.dueDate,
      contactId: values.contactId,
    };

    const res = await fetch(isEditing ? `/api/tasks/${values.id}` : "/api/tasks", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar a tarefa.");
      return;
    }

    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!values.id) return;
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    setLoading(true);
    const res = await fetch(`/api/tasks/${values.id}`, { method: "DELETE" });
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
          {isEditing ? "Editar tarefa" : "Nova tarefa"}
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

          <div>
            <label className="block text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Vencimento</label>
              <input
                type="date"
                value={values.dueDate}
                onChange={(e) => setValues((v) => ({ ...v, dueDate: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Contato</label>
              <select
                value={values.contactId}
                onChange={(e) => setValues((v) => ({ ...v, contactId: e.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="">Nenhum</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>
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
