// Adequação do equipamento Ex à área classificada onde está instalado
// (ABNT NBR IEC 60079-14 — seleção de equipamentos):
//   - EPL x Zona:   Zona 0 → Ga | Zona 1 → Ga/Gb | Zona 2 → Ga/Gb/Gc
//                   Zona 20 → Da | Zona 21 → Da/Db | Zona 22 → Da/Db/Dc
//   - Grupo:        IIC serve IIC/IIB/IIA; IIB serve IIB/IIA; "II" (sem
//                   subdivisão) serve qualquer subgrupo. Idem III.
//   - Classe T:     equipamento T-n serve área que exige T-m se n ≥ m
//                   (T6 é a mais restritiva).
//   - Poeira:       temperatura máxima de superfície do equipamento ≤
//                   limite admissível da área.
// Campos não informados não geram problema — só o que dá para comparar.

export type AreaLike = {
  atmosphere: string;
  zone: string;
  group: string | null;
  temperatureClass: string | null;
  maxSurfaceTempC: number | null;
};

export type EquipmentLike = {
  group: string | null;
  temperatureClass: string | null;
  maxSurfaceTempC: number | null;
  epl: string | null;
};

const ALLOWED_EPL_BY_ZONE: Record<string, string[]> = {
  ZONA_0: ["Ga"],
  ZONA_1: ["Ga", "Gb"],
  ZONA_2: ["Ga", "Gb", "Gc"],
  ZONA_20: ["Da"],
  ZONA_21: ["Da", "Db"],
  ZONA_22: ["Da", "Db", "Dc"],
};

// Ordem de severidade dentro de cada família (índice maior = mais restritivo).
const GAS_GROUPS = ["IIA", "IIB", "IIC"];
const DUST_GROUPS = ["IIIA", "IIIB", "IIIC"];

function groupFamily(group: string): "II" | "III" {
  return group.startsWith("III") ? "III" : "II";
}

function groupSatisfies(equipmentGroup: string, areaGroup: string): boolean {
  const family = groupFamily(equipmentGroup);
  if (family !== groupFamily(areaGroup)) return false;
  // Grupo sem subdivisão ("II"/"III") no equipamento ou na área: qualquer
  // subgrupo da mesma família atende.
  if (equipmentGroup === family || areaGroup === family) return true;
  const order = family === "II" ? GAS_GROUPS : DUST_GROUPS;
  return order.indexOf(equipmentGroup) >= order.indexOf(areaGroup);
}

function temperatureClassNumber(value: string): number {
  return Number(value.replace("T", ""));
}

export function checkEquipmentSuitability(area: AreaLike, equipment: EquipmentLike): string[] {
  const issues: string[] = [];

  if (equipment.epl) {
    const allowed = ALLOWED_EPL_BY_ZONE[area.zone] ?? [];
    if (!allowed.includes(equipment.epl)) {
      issues.push(`EPL ${equipment.epl} não é adequado para a zona (exige ${allowed.join(" ou ")}).`);
    }
  }

  if (equipment.group && area.group && !groupSatisfies(equipment.group, area.group)) {
    issues.push(`Grupo ${equipment.group} não atende o grupo ${area.group} da área.`);
  }

  if (area.atmosphere === "GAS" && equipment.temperatureClass && area.temperatureClass) {
    if (temperatureClassNumber(equipment.temperatureClass) < temperatureClassNumber(area.temperatureClass)) {
      issues.push(
        `Classe ${equipment.temperatureClass} não atende a classe ${area.temperatureClass} exigida pela área.`,
      );
    }
  }

  if (
    area.atmosphere === "POEIRA" &&
    equipment.maxSurfaceTempC != null &&
    area.maxSurfaceTempC != null &&
    equipment.maxSurfaceTempC > area.maxSurfaceTempC
  ) {
    issues.push(
      `Temperatura de superfície ${equipment.maxSurfaceTempC} °C acima do limite da área (${area.maxSurfaceTempC} °C).`,
    );
  }

  return issues;
}
