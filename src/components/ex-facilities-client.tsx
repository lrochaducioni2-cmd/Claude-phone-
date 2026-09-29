"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field, FormActions, ModalShell, inputClass, submitJson } from "@/components/ex-form-fields";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export type ContactOption = { id: string; name: string; company: string | null };

export type ExFacilityRow = {
  id: string;
  name: string;
  location: string | null;
  notes: string | null;
  contactId: string | null;
  contact: { name: string; company: string | null } | null;
  areaCount: number;
  equipmentCount: number;
  lastInspection: string | null;
};

type FacilityFormValues = {
  id?: string;
  name: string;
  location: string;
  notes: string;
  contactId: string;
};

const EMPTY_VALUES: FacilityFormValues = { name: "", location: "", notes: "", contactId: "" };

export function ExFacilitiesClient({
  facilities,
  contacts,
}: {
  facilities: ExFacilityRow[];
  contacts: ContactOption[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FacilityFormValues | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openNew() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(facility: ExFacilityRow) {
    setEditing({
      id: facility.id,
      name: facility.name,
      location: facility.location ?? "",
      notes: facility.notes ?? "",
      contactId: facility.contactId ?? "",
    });
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta instalação? Áreas, equipamentos e inspeções dela também serão excluídos.")) {
      return;
    }
    setDeletingId(id);
    const res = await fetch(`/api/ex/facilities/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inspeção Ex</h1>
          <p className="mt-1 text-sm text-slate-500">
            Instalações, áreas classificadas e equipamentos Ex — inspeções conforme ABNT NBR IEC
            60079-17.
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Nova instalação
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {facilities.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Nenhuma instalação cadastrada ainda. Clique em &quot;Nova instalação&quot; para começar.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Instalação</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-right">Áreas</th>
                <th className="px-4 py-3 text-right">Equipamentos</th>
                <th className="px-4 py-3">Última inspeção</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facilities.map((facility) => (
                <tr key={facility.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/ex/facilities/${facility.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {facility.name}
                    </Link>
                    <div className="text-xs text-slate-400">{facility.location || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {facility.contact
                      ? `${facility.contact.name}${facility.contact.company ? ` (${facility.contact.company})` : ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{facility.areaCount}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{facility.equipmentCount}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {facility.lastInspection ? dateFormat.format(new Date(facility.lastInspection)) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(facility)}
                      className="mr-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(facility.id)}
                      disabled={deletingId === facility.id}
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

      {modalOpen && (
        <FacilityFormModal
          key={editing?.id ?? "new"}
          contacts={contacts}
          initialValues={editing}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

export function FacilityFormModal({
  contacts,
  initialValues,
  onClose,
}: {
  contacts: ContactOption[];
  initialValues?: FacilityFormValues;
  onClose: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FacilityFormValues>(initialValues ?? EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(values.id);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { id, ...payload } = values;
    const result = await submitJson(
      isEditing ? `/api/ex/facilities/${id}` : "/api/ex/facilities",
      isEditing ? "PATCH" : "POST",
      payload,
      "Não foi possível salvar a instalação.",
    );
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <ModalShell title={isEditing ? "Editar instalação" : "Nova instalação"}>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <Field label="Nome *">
          <input
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="Ex.: Unidade de Tancagem — Planta Sul"
            className={inputClass}
          />
        </Field>
        <Field label="Cliente">
          <select
            value={values.contactId}
            onChange={(e) => setValues((v) => ({ ...v, contactId: e.target.value }))}
            className={inputClass}
          >
            <option value="">— Nenhum —</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
                {contact.company ? ` (${contact.company})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Localização">
          <input
            value={values.location}
            onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
            placeholder="Cidade/UF, endereço"
            className={inputClass}
          />
        </Field>
        <Field label="Observações">
          <textarea
            rows={3}
            value={values.notes}
            onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
            className={inputClass}
          />
        </Field>
        <FormActions loading={loading} error={error} onClose={onClose} />
      </form>
    </ModalShell>
  );
}
