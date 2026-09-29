"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormActions, ModalShell, inputClass, submitJson } from "@/components/ex-form-fields";
import {
  EX_EPL_VALUES,
  EX_GROUP_VALUES,
  EX_PROTECTION_TYPE_LABELS,
  EX_TEMPERATURE_CLASS_VALUES,
} from "@/lib/labels";

export type ExEquipmentFormValues = {
  id?: string;
  areaId: string;
  tag: string;
  description: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  marking: string;
  protectionTypes: string[];
  group: string;
  temperatureClass: string;
  maxSurfaceTempC: string;
  epl: string;
  ipRating: string;
  certificateNumber: string;
  notes: string;
};

type AreaOption = { id: string; name: string; atmosphere: string };

export function ExEquipmentFormModal({
  areas,
  initialValues,
  onClose,
}: {
  areas: AreaOption[];
  initialValues: ExEquipmentFormValues;
  onClose: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ExEquipmentFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(values.id);

  function set<K extends keyof ExEquipmentFormValues>(key: K, value: ExEquipmentFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleProtection(type: string) {
    setValues((v) => ({
      ...v,
      protectionTypes: v.protectionTypes.includes(type)
        ? v.protectionTypes.filter((t) => t !== type)
        : [...v.protectionTypes, type],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { id, ...payload } = values;
    const result = await submitJson(
      isEditing ? `/api/ex/equipment/${id}` : "/api/ex/equipment",
      isEditing ? "PATCH" : "POST",
      payload,
      "Não foi possível salvar o equipamento.",
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
    <ModalShell title={isEditing ? `Editar equipamento ${initialValues.tag}` : "Novo equipamento Ex"} wide>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Field label="TAG *">
            <input required value={values.tag} onChange={(e) => set("tag", e.target.value)} className={inputClass} />
          </Field>
          <div className="col-span-2">
            <Field label="Descrição *">
              <input
                required
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Ex.: Motor da bomba B-101"
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <Field label="Área">
          <select value={values.areaId} onChange={(e) => set("areaId", e.target.value)} className={inputClass}>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Fabricante">
            <input value={values.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Modelo">
            <input value={values.model} onChange={(e) => set("model", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Nº de série">
            <input value={values.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} className={inputClass} />
          </Field>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-slate-700">Tipos de proteção</legend>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(EX_PROTECTION_TYPE_LABELS).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={values.protectionTypes.includes(value)}
                  onChange={() => toggleProtection(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Marcação completa (como na plaqueta)">
          <input
            value={values.marking}
            onChange={(e) => set("marking", e.target.value)}
            placeholder="Ex.: Ex db eb IIC T4 Gb"
            className={`${inputClass} font-mono`}
          />
        </Field>

        <div className="grid grid-cols-4 gap-3">
          <Field label="Grupo">
            <select value={values.group} onChange={(e) => set("group", e.target.value)} className={inputClass}>
              <option value="">—</option>
              {EX_GROUP_VALUES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Classe T">
            <select
              value={values.temperatureClass}
              onChange={(e) => set("temperatureClass", e.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {EX_TEMPERATURE_CLASS_VALUES.map((tc) => (
                <option key={tc} value={tc}>
                  {tc}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Temp. sup. (°C)">
            <input
              type="number"
              step="any"
              value={values.maxSurfaceTempC}
              onChange={(e) => set("maxSurfaceTempC", e.target.value)}
              placeholder="poeira"
              className={inputClass}
            />
          </Field>
          <Field label="EPL">
            <select value={values.epl} onChange={(e) => set("epl", e.target.value)} className={inputClass}>
              <option value="">—</option>
              {EX_EPL_VALUES.map((epl) => (
                <option key={epl} value={epl}>
                  {epl}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Grau de proteção (IP)">
            <input
              value={values.ipRating}
              onChange={(e) => set("ipRating", e.target.value)}
              placeholder="Ex.: IP66"
              className={inputClass}
            />
          </Field>
          <Field label="Certificado de conformidade">
            <input
              value={values.certificateNumber}
              onChange={(e) => set("certificateNumber", e.target.value)}
              placeholder="Ex.: INMETRO / IECEx nº"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Observações">
          <textarea rows={2} value={values.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} />
        </Field>

        <FormActions loading={loading} error={error} onClose={onClose} />
      </form>
    </ModalShell>
  );
}
