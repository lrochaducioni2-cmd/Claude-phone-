"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContactFormModal, type ContactFormValues } from "@/components/contact-form-modal";
import { LEAD_STATUS_COLORS, LEAD_STATUS_LABELS } from "@/lib/labels";

export type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  status: string;
};

export function ContactsClient({ contacts }: { contacts: ContactRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContactFormValues | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openNew() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(contact: ContactRow) {
    setEditing({
      id: contact.id,
      name: contact.name,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      company: contact.company ?? "",
      notes: contact.notes ?? "",
      status: contact.status,
    });
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este contato?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Contatos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastro de empresas e leads vinculados a você.
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Novo contato
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {contacts.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Nenhum contato cadastrado ainda. Clique em &quot;Novo contato&quot; para começar.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{contact.name}</td>
                  <td className="px-4 py-3 text-slate-600">{contact.company || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{contact.email || "—"}</div>
                    <div className="text-xs text-slate-400">{contact.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${LEAD_STATUS_COLORS[contact.status]}`}
                    >
                      {LEAD_STATUS_LABELS[contact.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(contact)}
                      className="mr-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      disabled={deletingId === contact.id}
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

      <ContactFormModal
        key={editing?.id ?? "new"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialValues={editing}
      />
    </div>
  );
}
