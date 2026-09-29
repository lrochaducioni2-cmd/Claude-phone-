"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormActions, ModalShell, inputClass, submitJson } from "@/components/ex-form-fields";
import {
  EX_ATMOSPHERE_LABELS,
  EX_GROUPS_BY_ATMOSPHERE,
  EX_TEMPERATURE_CLASS_VALUES,
  EX_ZONES_BY_ATMOSPHERE,
  EX_ZONE_LABELS,
} from "@/lib/labels";

export type ExAreaFormValues = {
  id?: string;
  facilityId: string;
  name: string;
  atmosphere: string;
  zone: string;
  group: string;
  temperatureClass: string;
  maxSurfaceTempC: string;
  notes: string;
};

export function ExAreaFormModal({
  facilityId,
  initialValues,
  onClose,
}: {
  facilityId: string;
  initialValues?: ExAreaFormValues;
  onClose: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ExAreaFormValues>(
    initialValues ?? {
      facilityId,
      name: "",
      atmosphere: "GAS",
      zone: "ZONA_1",
      group: "",
      temperatureClass: "",
      maxSurfaceTempC: "",
      notes: "",
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(values.id);
  const isGas = values.atmosphere === "GAS";

  function changeAtmosphere(atmosphere: string) {
    // Zona e grupo dependem da atmosfera: reinicia para valores válidos.
    setValues((v) => ({
      ...v,
      atmosphere,
      zone: EX_ZONES_BY_ATMOSPHERE[atmosphere][1],
      group: "",
      temperatureClass: atmosphere === "GAS" ? v.temperatureClass : "",
      maxSurfaceTempC: atmosphere === "POEIRA" ? v.maxSurfaceTempC : "",
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { id, facilityId: areaFacilityId, ...rest } = values;
    const result = await submitJson(
      isEditing ? `/api/ex/areas/${id}` : "/api/ex/areas",
      isEditing ? "PATCH" : "POST",
      isEditing ? rest : { ...rest, facilityId: areaFacilityId },
      "Não foi possível salvar a área.",
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
    <ModalShell title={isEditing ? "Editar área classificada" : "Nova área classificada"}>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <Field label="Nome da área *">
          <input
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="Ex.: Casa de bombas — Tanque TQ-01"
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Atmosfera">
            <select value={values.atmosphere} onChange={(e) => changeAtmosphere(e.target.value)} className={inputClass}>
              {Object.entries(EX_ATMOSPHERE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Zona *">
            <select
              value={values.zone}
              onChange={(e) => setValues((v) => ({ ...v, zone: e.target.value }))}
              className={inputClass}
            >
              {EX_ZONES_BY_ATMOSPHERE[values.atmosphere].map((zone) => (
                <option key={zone} value={zone}>
                  {EX_ZONE_LABELS[zone]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={isGas ? "Grupo de gás" : "Grupo de poeira"}>
            <select
              value={values.group}
              onChange={(e) => setValues((v) => ({ ...v, group: e.target.value }))}
              className={inputClass}
            >
              <option value="">— Não informado —</option>
              {EX_GROUPS_BY_ATMOSPHERE[values.atmosphere].map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </Field>
          {isGas ? (
            <Field label="Classe de temperatura exigida">
              <select
                value={values.temperatureClass}
                onChange={(e) => setValues((v) => ({ ...v, temperatureClass: e.target.value }))}
                className={inputClass}
              >
                <option value="">— Não informada —</option>
                {EX_TEMPERATURE_CLASS_VALUES.map((tc) => (
                  <option key={tc} value={tc}>
                    {tc}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Temp. máx. de superfície (°C)">
              <input
                type="number"
                step="any"
                value={values.maxSurfaceTempC}
                onChange={(e) => setValues((v) => ({ ...v, maxSurfaceTempC: e.target.value }))}
                className={inputClass}
              />
            </Field>
          )}
        </div>
        <Field label="Observações">
          <textarea
            rows={2}
            value={values.notes}
            onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
            placeholder="Fonte de risco, substância, referência do estudo de classificação..."
            className={inputClass}
          />
        </Field>
        <FormActions loading={loading} error={error} onClose={onClose} />
      </form>
    </ModalShell>
  );
}
