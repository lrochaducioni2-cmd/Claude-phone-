import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { PrintButton } from "@/components/print-button";
import { getChecklist, type CheckAnswer } from "@/lib/ex-checklist";
import {
  EX_INSPECTION_STATUS_LABELS,
  EX_INSPECTION_TYPE_LABELS,
  EX_ITEM_RESULT_LABELS,
  INSPECTION_LEVEL_LABELS,
  empresaLabel,
  formatProtectionTypes,
} from "@/lib/labels";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

const RESULT_TEXT_COLORS: Record<string, string> = {
  PENDENTE: "text-slate-500",
  CONFORME: "text-green-700",
  NAO_CONFORME: "text-red-700",
};

type Params = { params: Promise<{ id: string }> };

export default async function ExInspectionReportPage({ params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) notFound();

  const inspection = await prisma.exInspection.findFirst({
    where: { id, ownerId: userId },
    include: {
      facility: { include: { empresa: true } },
      trabalho: { select: { crmId: true } },
      items: { orderBy: { order: "asc" } },
    },
  });
  if (!inspection) notFound();

  const items = inspection.items.map((item) => {
    const checklist = getChecklist(item.protectionTypes, inspection.level);
    const answers = (item.answers ?? {}) as Record<string, CheckAnswer>;
    return {
      ...item,
      failedChecks: checklist.filter((check) => answers[check.id] === "NC"),
    };
  });

  const count = (result: string) => items.filter((item) => item.result === result).length;
  const nonConforming = items.filter((item) => item.result === "NAO_CONFORME");
  const empresa = inspection.facility.empresa;

  return (
    <div className="mx-auto max-w-4xl text-sm text-slate-800">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/ex/inspections/${inspection.id}`}
          className="text-sm text-slate-500 hover:text-slate-800 hover:underline"
        >
          ← Voltar para a inspeção
        </Link>
        <PrintButton />
      </div>

      <article className="mt-4 rounded-xl border border-slate-200 bg-white p-8 print:mt-0 print:border-0 print:p-0">
        <header className="border-b border-slate-300 pb-4">
          <h1 className="text-xl font-semibold text-slate-900">
            Relatório de Inspeção de Equipamentos Ex nº {inspection.number}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Inspeção de instalações elétricas em atmosferas explosivas — ABNT NBR IEC 60079-17
          </p>
        </header>

        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1">
          <ReportField label="Instalação" value={inspection.facility.name} />
          <ReportField
            label="Cliente"
            value={empresa ? empresaLabel(empresa) : "—"}
          />
          <ReportField label="Localização" value={inspection.facility.location || "—"} />
          <ReportField label="Data" value={dateFormat.format(inspection.date)} />
          <ReportField label="Nível de inspeção" value={INSPECTION_LEVEL_LABELS[inspection.level]} />
          <ReportField label="Tipo de inspeção" value={EX_INSPECTION_TYPE_LABELS[inspection.type]} />
          <ReportField label="Inspetor responsável" value={inspection.inspectorName || "—"} />
          <ReportField label="Situação" value={EX_INSPECTION_STATUS_LABELS[inspection.status]} />
          {empresa?.cnpj && <ReportField label="CNPJ" value={empresa.cnpj} />}
          {inspection.trabalho && <ReportField label="Trabalho (CRM)" value={`#${inspection.trabalho.crmId}`} />}
        </dl>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-slate-900">1. Resumo</h2>
          <table className="mt-2 w-full max-w-sm border border-slate-300 text-left">
            <tbody className="divide-y divide-slate-200">
              <SummaryRow label="Equipamentos inspecionados" value={items.length} />
              <SummaryRow label="Conformes" value={count("CONFORME")} />
              <SummaryRow label="Não conformes" value={count("NAO_CONFORME")} />
              <SummaryRow label="Pendentes" value={count("PENDENTE")} />
            </tbody>
          </table>
          {inspection.notes && <p className="mt-3 whitespace-pre-line">{inspection.notes}</p>}
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-slate-900">2. Equipamentos inspecionados</h2>
          <table className="mt-2 w-full border border-slate-300 text-left text-xs">
            <thead className="bg-slate-100">
              <tr>
                <th className="border-b border-slate-300 px-2 py-1">TAG</th>
                <th className="border-b border-slate-300 px-2 py-1">Descrição</th>
                <th className="border-b border-slate-300 px-2 py-1">Área</th>
                <th className="border-b border-slate-300 px-2 py-1">Proteção</th>
                <th className="border-b border-slate-300 px-2 py-1">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => (
                <tr key={item.id} className="break-inside-avoid">
                  <td className="px-2 py-1 font-medium">{item.equipmentTag}</td>
                  <td className="px-2 py-1">{item.equipmentDesc}</td>
                  <td className="px-2 py-1">{item.areaName}</td>
                  <td className="px-2 py-1">{formatProtectionTypes(item.protectionTypes)}</td>
                  <td className={`px-2 py-1 font-medium ${RESULT_TEXT_COLORS[item.result]}`}>
                    {EX_ITEM_RESULT_LABELS[item.result]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-slate-900">3. Não conformidades</h2>
          {nonConforming.length === 0 ? (
            <p className="mt-2 text-slate-600">Nenhuma não conformidade registrada.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {nonConforming.map((item) => (
                <div key={item.id} className="break-inside-avoid rounded border border-slate-300 p-3">
                  <div className="font-semibold">
                    {item.equipmentTag} — {item.equipmentDesc}
                    <span className="ml-2 font-normal text-slate-500">({item.areaName})</span>
                  </div>
                  <ul className="mt-1 list-disc pl-5">
                    {item.failedChecks.map((check) => (
                      <li key={check.id}>
                        {check.text} <span className="text-xs text-slate-400">[{check.id}]</span>
                      </li>
                    ))}
                  </ul>
                  {item.notes && <p className="mt-2 whitespace-pre-line text-slate-700">{item.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 grid grid-cols-2 gap-12 break-inside-avoid">
          <Signature label="Inspetor responsável" name={inspection.inspectorName} />
          <Signature label="Responsável pela instalação" />
        </section>
      </article>
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-slate-500">{label}:</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <tr>
      <td className="px-2 py-1">{label}</td>
      <td className="px-2 py-1 text-right font-medium">{value}</td>
    </tr>
  );
}

function Signature({ label, name }: { label: string; name?: string | null }) {
  return (
    <div className="text-center">
      <div className="border-t border-slate-400 pt-1">{name || "\u00a0"}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
