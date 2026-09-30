"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FacilityFormModal } from "@/components/ex-facilities-client";
import { Field, FormActions, ModalShell, inputClass, submitJson } from "@/components/ex-form-fields";
import { toDateInputValue } from "@/lib/ex-dates";
import {
  EX_INSPECTION_STATUS_COLORS,
  EX_INSPECTION_STATUS_LABELS,
  INSPECTION_LEVEL_LABELS,
  TRABALHO_STATUS_COLORS,
  TRABALHO_STATUS_LABELS,
  empresaLabel,
} from "@/lib/labels";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

type Trabalho = {
  id: string;
  crmId: string;
  descricaoEscopo: string;
  valor: number | null;
  dataVenda: string | null;
  status: string;
  crmStatus: string;
  crmSyncError: string | null;
  dataEntrega: string | null;
  linkRelatorio: string | null;
  observacoes: string | null;
};

type Empresa = {
  id: string;
  crmId: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  contatoResponsavel: string | null;
};

type FacilityRow = { id: string; name: string; location: string | null; equipmentCount: number };

type InspectionRow = {
  id: string;
  number: number;
  level: string;
  status: string;
  date: string;
  facility: { id: string; name: string };
  total: number;
  naoConforme: number;
};

export function TrabalhoClient({
  trabalho,
  empresa,
  facilities,
  inspections,
}: {
  trabalho: Trabalho;
  empresa: Empresa;
  facilities: FacilityRow[];
  inspections: InspectionRow[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"facility" | "entregar" | null>(null);
  const [syncing, setSyncing] = useState(false);

  const avisoPendente = trabalho.crmStatus !== trabalho.status;
  const emExecucao = trabalho.status === "EM_EXECUCAO";
  const abertas = inspections.filter((inspection) => inspection.status !== "CONCLUIDA").length;
  const podeEntregar = emExecucao && inspections.length > 0 && abertas === 0;
  const motivoBloqueio = !emExecucao
    ? null
    : inspections.length === 0
      ? "Crie ao menos uma inspeção vinculada a este trabalho (a partir de uma instalação)."
      : abertas > 0
        ? `Conclua as ${abertas} inspeção(ões) em andamento para poder entregar.`
        : null;

  async function reenviar() {
    setSyncing(true);
    await fetch(`/api/trabalhos/${trabalho.id}/sincronizar`, { method: "POST" });
    setSyncing(false);
    router.refresh();
  }

  return (
    <div>
      <Link href="/trabalhos" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
        ← Voltar para trabalhos
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Trabalho CRM #{trabalho.crmId} — {empresaLabel(empresa)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{trabalho.descricaoEscopo}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TRABALHO_STATUS_COLORS[trabalho.status]}`}>
            {TRABALHO_STATUS_LABELS[trabalho.status]}
          </span>
          {emExecucao && (
            <button
              onClick={() => setModal("entregar")}
              disabled={!podeEntregar}
              title={motivoBloqueio ?? undefined}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Entregar ao cliente
            </button>
          )}
        </div>
      </div>

      {avisoPendente && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div>
            <strong>O CRM ainda não foi avisado</strong> de que este trabalho está “
            {TRABALHO_STATUS_LABELS[trabalho.status]}” (o CRM registra “{TRABALHO_STATUS_LABELS[trabalho.crmStatus]}”).
            {trabalho.crmSyncError && <div className="mt-1 text-red-700">Motivo: {trabalho.crmSyncError}</div>}
          </div>
          <button
            onClick={reenviar}
            disabled={syncing}
            className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
          >
            {syncing ? "Enviando..." : "Reenviar ao CRM"}
          </button>
        </div>
      )}
      {motivoBloqueio && <p className="mt-4 text-sm text-slate-500">{motivoBloqueio}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Instalações da empresa</h2>
              <button
                onClick={() => setModal("facility")}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Nova instalação
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {facilities.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  Nenhuma instalação desta empresa. Cadastre a instalação, as áreas classificadas e os
                  equipamentos, e crie a inspeção vinculada a este trabalho.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {facilities.map((facility) => (
                    <li key={facility.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <Link href={`/ex/facilities/${facility.id}`} className="font-medium text-slate-900 hover:underline">
                          {facility.name}
                        </Link>
                        <div className="text-xs text-slate-400">{facility.location || ""}</div>
                      </div>
                      <span className="text-slate-500">{facility.equipmentCount} equipamentos</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Inspeções deste trabalho</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {inspections.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  Nenhuma inspeção vinculada. Abra uma instalação e use “Nova inspeção”, escolhendo este trabalho.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Nº</th>
                      <th className="px-4 py-3">Instalação</th>
                      <th className="px-4 py-3">Nível</th>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">NC</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inspections.map((inspection) => (
                      <tr key={inspection.id}>
                        <td className="px-4 py-3">
                          <Link href={`/ex/inspections/${inspection.id}`} className="font-medium text-slate-900 hover:underline">
                            #{inspection.number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{inspection.facility.name}</td>
                        <td className="px-4 py-3 text-slate-600">{INSPECTION_LEVEL_LABELS[inspection.level]}</td>
                        <td className="px-4 py-3 text-slate-600">{dateFormat.format(new Date(inspection.date))}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {inspection.naoConforme}/{inspection.total}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${EX_INSPECTION_STATUS_COLORS[inspection.status]}`}
                          >
                            {EX_INSPECTION_STATUS_LABELS[inspection.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/ex/inspections/${inspection.id}/report`}
                            className="text-sm font-medium text-slate-600 hover:text-slate-900"
                          >
                            Relatório
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <h2 className="font-semibold text-slate-900">Empresa (dados do CRM)</h2>
            <dl className="mt-2 space-y-1 text-slate-600">
              <Info label="Razão social" value={empresa.razaoSocial} />
              <Info label="Nome fantasia" value={empresa.nomeFantasia} />
              <Info label="CNPJ" value={empresa.cnpj} />
              <Info label="Endereço" value={empresa.endereco} />
              <Info label="Telefone" value={empresa.telefone} />
              <Info label="E-mail" value={empresa.email} />
              <Info label="Contato" value={empresa.contatoResponsavel} />
            </dl>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <h2 className="font-semibold text-slate-900">Trabalho</h2>
            <dl className="mt-2 space-y-1 text-slate-600">
              <Info label="Valor" value={trabalho.valor != null ? currency.format(trabalho.valor) : null} />
              <Info label="Venda" value={trabalho.dataVenda ? dateFormat.format(new Date(trabalho.dataVenda)) : null} />
              <Info label="Entrega" value={trabalho.dataEntrega ? dateFormat.format(new Date(trabalho.dataEntrega)) : null} />
              <Info label="Observações" value={trabalho.observacoes} />
              <Info label="Status no CRM" value={TRABALHO_STATUS_LABELS[trabalho.crmStatus]} />
            </dl>
          </div>
        </div>
      </div>

      {modal === "facility" && (
        <FacilityFormModal
          empresas={[empresa]}
          initialValues={{ name: "", location: empresa.endereco ?? "", notes: "", empresaId: empresa.id }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "entregar" && <EntregarModal trabalhoId={trabalho.id} onClose={() => setModal(null)} />}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0">{label}</dt>
      <dd className="text-right text-slate-900">{value || "—"}</dd>
    </div>
  );
}

function EntregarModal({ trabalhoId, onClose }: { trabalhoId: string; onClose: () => void }) {
  const router = useRouter();
  const [dataEntrega, setDataEntrega] = useState(() => toDateInputValue(new Date()));
  const [observacoes, setObservacoes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await submitJson(
      `/api/trabalhos/${trabalhoId}/entregar`,
      "POST",
      { dataEntrega, observacoes },
      "Não foi possível registrar a entrega.",
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
    <ModalShell title="Entregar trabalho ao cliente">
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <p className="text-sm text-slate-600">
          O trabalho será marcado como <strong>entregue</strong> e o CRM será avisado com a data de entrega e o
          link do relatório. As inspeções ficam travadas para edição.
        </p>
        <Field label="Data de entrega *">
          <input
            type="date"
            required
            value={dataEntrega}
            onChange={(e) => setDataEntrega(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Observações para o CRM">
          <textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={inputClass} />
        </Field>
        <FormActions loading={loading} error={error} onClose={onClose} submitLabel="Confirmar entrega" />
      </form>
    </ModalShell>
  );
}
