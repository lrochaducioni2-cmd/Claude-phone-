"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FacilityFormModal, type ContactOption } from "@/components/ex-facilities-client";
import { ExAreaFormModal, type ExAreaFormValues } from "@/components/ex-area-form-modal";
import { ExEquipmentFormModal, type ExEquipmentFormValues } from "@/components/ex-equipment-form-modal";
import { ExInspectionFormModal, type QuoteOption } from "@/components/ex-inspection-form-modal";
import { checkEquipmentSuitability } from "@/lib/ex-suitability";
import {
  EX_ATMOSPHERE_LABELS,
  EX_INSPECTION_STATUS_COLORS,
  EX_INSPECTION_STATUS_LABELS,
  EX_INSPECTION_TYPE_LABELS,
  EX_ZONE_LABELS,
  INSPECTION_LEVEL_LABELS,
  formatProtectionTypes,
} from "@/lib/labels";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

type Equipment = {
  id: string;
  areaId: string;
  tag: string;
  description: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  marking: string | null;
  protectionTypes: string[];
  group: string | null;
  temperatureClass: string | null;
  maxSurfaceTempC: number | null;
  epl: string | null;
  ipRating: string | null;
  certificateNumber: string | null;
  notes: string | null;
};

type Area = {
  id: string;
  name: string;
  atmosphere: string;
  zone: string;
  group: string | null;
  temperatureClass: string | null;
  maxSurfaceTempC: number | null;
  notes: string | null;
  equipment: Equipment[];
};

type InspectionRow = {
  id: string;
  number: number;
  level: string;
  type: string;
  status: string;
  date: string;
  inspectorName: string | null;
  total: number;
  conforme: number;
  naoConforme: number;
};

type Facility = {
  id: string;
  name: string;
  location: string | null;
  notes: string | null;
  contactId: string | null;
  contact: { name: string; company: string | null } | null;
};

type Modal =
  | { kind: "facility" }
  | { kind: "area"; values?: ExAreaFormValues }
  | { kind: "equipment"; values: ExEquipmentFormValues }
  | { kind: "inspection" }
  | null;

function areaSummary(area: Area): string {
  const parts = [EX_ATMOSPHERE_LABELS[area.atmosphere], EX_ZONE_LABELS[area.zone]];
  if (area.group) parts.push(area.group);
  if (area.atmosphere === "GAS" && area.temperatureClass) parts.push(area.temperatureClass);
  if (area.atmosphere === "POEIRA" && area.maxSurfaceTempC != null) parts.push(`T ≤ ${area.maxSurfaceTempC} °C`);
  return parts.join(" · ");
}

function equipmentMarkingSummary(eq: Equipment): string {
  if (eq.marking) return eq.marking;
  const parts = [formatProtectionTypes(eq.protectionTypes)];
  if (eq.group) parts.push(eq.group);
  if (eq.temperatureClass) parts.push(eq.temperatureClass);
  if (eq.maxSurfaceTempC != null) parts.push(`T${eq.maxSurfaceTempC} °C`);
  if (eq.epl) parts.push(eq.epl);
  return parts.join(" ");
}

function toEquipmentFormValues(eq: Equipment): ExEquipmentFormValues {
  return {
    id: eq.id,
    areaId: eq.areaId,
    tag: eq.tag,
    description: eq.description,
    manufacturer: eq.manufacturer ?? "",
    model: eq.model ?? "",
    serialNumber: eq.serialNumber ?? "",
    marking: eq.marking ?? "",
    protectionTypes: eq.protectionTypes,
    group: eq.group ?? "",
    temperatureClass: eq.temperatureClass ?? "",
    maxSurfaceTempC: eq.maxSurfaceTempC != null ? String(eq.maxSurfaceTempC) : "",
    epl: eq.epl ?? "",
    ipRating: eq.ipRating ?? "",
    certificateNumber: eq.certificateNumber ?? "",
    notes: eq.notes ?? "",
  };
}

export function ExFacilityClient({
  facility,
  areas,
  inspections,
  contacts,
  quotes,
}: {
  facility: Facility;
  areas: Area[];
  inspections: InspectionRow[];
  contacts: ContactOption[];
  quotes: QuoteOption[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const equipmentCount = areas.reduce((sum, area) => sum + area.equipment.length, 0);
  const unsuitableCount = areas.reduce(
    (sum, area) => sum + area.equipment.filter((eq) => checkEquipmentSuitability(area, eq).length > 0).length,
    0,
  );

  async function handleDelete(url: string, id: string, message: string) {
    if (!confirm(message)) return;
    setBusyId(id);
    const res = await fetch(url, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) router.refresh();
  }

  const closeModal = () => setModal(null);

  return (
    <div>
      <Link href="/ex" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
        ← Voltar para instalações
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{facility.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {facility.contact
              ? `${facility.contact.name}${facility.contact.company ? ` (${facility.contact.company})` : ""}`
              : "Sem cliente vinculado"}
            {facility.location ? ` · ${facility.location}` : ""}
          </p>
        </div>
        <button
          onClick={() => setModal({ kind: "facility" })}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Editar instalação
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Áreas classificadas" value={areas.length} />
        <Stat label="Equipamentos Ex" value={equipmentCount} />
        <Stat
          label="Equipamentos inadequados à área"
          value={unsuitableCount}
          tone={unsuitableCount > 0 ? "danger" : "default"}
        />
      </div>

      {/* --- Inspeções ------------------------------------------------- */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Inspeções</h2>
          <button
            onClick={() => setModal({ kind: "inspection" })}
            disabled={equipmentCount === 0}
            title={equipmentCount === 0 ? "Cadastre equipamentos antes de criar uma inspeção." : undefined}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Nova inspeção
          </button>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {inspections.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nenhuma inspeção registrada.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nº</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Nível / Tipo</th>
                  <th className="px-4 py-3">Inspetor</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspections.map((inspection) => (
                  <tr key={inspection.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/ex/inspections/${inspection.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        #{inspection.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{dateFormat.format(new Date(inspection.date))}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {INSPECTION_LEVEL_LABELS[inspection.level]}
                      <div className="text-xs text-slate-400">{EX_INSPECTION_TYPE_LABELS[inspection.type]}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inspection.inspectorName || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-green-700">{inspection.conforme} C</span>
                      {" · "}
                      <span className="text-red-700">{inspection.naoConforme} NC</span>
                      {" · "}
                      <span className="text-slate-500">
                        {inspection.total - inspection.conforme - inspection.naoConforme} pend.
                      </span>
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
                        className="mr-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        Relatório
                      </Link>
                      <button
                        onClick={() =>
                          handleDelete(
                            `/api/ex/inspections/${inspection.id}`,
                            inspection.id,
                            "Excluir esta inspeção e todos os registros dela?",
                          )
                        }
                        disabled={busyId === inspection.id}
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
      </section>

      {/* --- Áreas e equipamentos -------------------------------------- */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Áreas classificadas e equipamentos</h2>
          <button
            onClick={() => setModal({ kind: "area" })}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Nova área
          </button>
        </div>

        {areas.length === 0 && (
          <p className="mt-3 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Nenhuma área cadastrada. Cadastre as áreas conforme o estudo de classificação de áreas
            da instalação.
          </p>
        )}

        <div className="mt-3 space-y-4">
          {areas.map((area) => (
            <div key={area.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                <div>
                  <span className="text-sm font-semibold text-slate-800">{area.name}</span>
                  <span className="ml-2 text-xs text-slate-500">{areaSummary(area)}</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <button
                    onClick={() =>
                      setModal({
                        kind: "equipment",
                        values: { ...EMPTY_EQUIPMENT, areaId: area.id },
                      })
                    }
                    className="font-medium text-slate-700 hover:text-slate-900"
                  >
                    + Equipamento
                  </button>
                  <button
                    onClick={() =>
                      setModal({
                        kind: "area",
                        values: {
                          id: area.id,
                          facilityId: facility.id,
                          name: area.name,
                          atmosphere: area.atmosphere,
                          zone: area.zone,
                          group: area.group ?? "",
                          temperatureClass: area.temperatureClass ?? "",
                          maxSurfaceTempC: area.maxSurfaceTempC != null ? String(area.maxSurfaceTempC) : "",
                          notes: area.notes ?? "",
                        },
                      })
                    }
                    className="font-medium text-slate-500 hover:text-slate-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(
                        `/api/ex/areas/${area.id}`,
                        area.id,
                        "Excluir esta área e todos os equipamentos dela?",
                      )
                    }
                    disabled={busyId === area.id}
                    className="font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
                  >
                    Excluir
                  </button>
                </div>
              </div>

              {area.equipment.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">Nenhum equipamento nesta área.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2">TAG</th>
                      <th className="px-4 py-2">Descrição</th>
                      <th className="px-4 py-2">Marcação</th>
                      <th className="px-4 py-2">Certificado</th>
                      <th className="px-4 py-2">Adequação</th>
                      <th className="px-4 py-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {area.equipment.map((eq) => {
                      const issues = checkEquipmentSuitability(area, eq);
                      return (
                        <tr key={eq.id} className="align-top">
                          <td className="px-4 py-2 font-medium text-slate-900">{eq.tag}</td>
                          <td className="px-4 py-2 text-slate-600">
                            {eq.description}
                            <div className="text-xs text-slate-400">
                              {[eq.manufacturer, eq.model].filter(Boolean).join(" · ")}
                            </div>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-700">
                            {equipmentMarkingSummary(eq)}
                            {eq.ipRating && <div className="text-slate-400">{eq.ipRating}</div>}
                          </td>
                          <td className="px-4 py-2 text-slate-600">{eq.certificateNumber || "—"}</td>
                          <td className="px-4 py-2">
                            {issues.length === 0 ? (
                              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                Adequado
                              </span>
                            ) : (
                              <ul className="space-y-0.5 text-xs text-red-700">
                                {issues.map((issue) => (
                                  <li key={issue}>⚠ {issue}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-right">
                            <button
                              onClick={() => setModal({ kind: "equipment", values: toEquipmentFormValues(eq) })}
                              className="mr-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(`/api/ex/equipment/${eq.id}`, eq.id, `Excluir o equipamento ${eq.tag}?`)
                              }
                              disabled={busyId === eq.id}
                              className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </section>

      {modal?.kind === "facility" && (
        <FacilityFormModal
          contacts={contacts}
          initialValues={{
            id: facility.id,
            name: facility.name,
            location: facility.location ?? "",
            notes: facility.notes ?? "",
            contactId: facility.contactId ?? "",
          }}
          onClose={closeModal}
        />
      )}
      {modal?.kind === "area" && (
        <ExAreaFormModal facilityId={facility.id} initialValues={modal.values} onClose={closeModal} />
      )}
      {modal?.kind === "equipment" && (
        <ExEquipmentFormModal
          areas={areas.map((area) => ({ id: area.id, name: area.name, atmosphere: area.atmosphere }))}
          initialValues={modal.values}
          onClose={closeModal}
        />
      )}
      {modal?.kind === "inspection" && (
        <ExInspectionFormModal
          facilityId={facility.id}
          areas={areas.map((area) => ({ id: area.id, name: area.name, equipmentCount: area.equipment.length }))}
          quotes={quotes}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

const EMPTY_EQUIPMENT: ExEquipmentFormValues = {
  areaId: "",
  tag: "",
  description: "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  marking: "",
  protectionTypes: [],
  group: "",
  temperatureClass: "",
  maxSurfaceTempC: "",
  epl: "",
  ipRating: "",
  certificateNumber: "",
  notes: "",
};

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone === "danger" ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}
