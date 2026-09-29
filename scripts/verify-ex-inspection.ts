// Verifica as regras do módulo de Inspeção Ex:
//   - adequação equipamento × área (src/lib/ex-suitability.ts)
//   - checklist por tipo de proteção/nível e resultado do item
//     (src/lib/ex-checklist.ts)
//
// Roda com: npx tsx scripts/verify-ex-inspection.ts

import { checkEquipmentSuitability, type AreaLike, type EquipmentLike } from "../src/lib/ex-suitability";
import { EX_CHECKLIST, computeItemResult, getChecklist } from "../src/lib/ex-checklist";

function assert(label: string, condition: boolean, detail = "") {
  if (!condition) {
    console.error(`FALHOU: ${label}${detail ? ` — ${detail}` : ""}`);
    process.exitCode = 1;
    return;
  }
  console.log(`OK: ${label}`);
}

const gasArea = (overrides: Partial<AreaLike> = {}): AreaLike => ({
  atmosphere: "GAS",
  zone: "ZONA_1",
  group: "IIB",
  temperatureClass: "T3",
  maxSurfaceTempC: null,
  ...overrides,
});

const equipment = (overrides: Partial<EquipmentLike> = {}): EquipmentLike => ({
  group: "IIC",
  temperatureClass: "T4",
  maxSurfaceTempC: null,
  epl: "Gb",
  ...overrides,
});

console.log("\n=== Adequação equipamento × área ===");
assert("Ex db IIC T4 Gb em Zona 1 IIB T3 é adequado", checkEquipmentSuitability(gasArea(), equipment()).length === 0);
assert("Gc em Zona 1 não é adequado", checkEquipmentSuitability(gasArea(), equipment({ epl: "Gc" })).length === 1);
assert("Gb em Zona 0 não é adequado", checkEquipmentSuitability(gasArea({ zone: "ZONA_0" }), equipment()).length === 1);
assert("Ga em Zona 2 é adequado", checkEquipmentSuitability(gasArea({ zone: "ZONA_2" }), equipment({ epl: "Ga" })).length === 0);
assert("IIA em área IIB não é adequado", checkEquipmentSuitability(gasArea(), equipment({ group: "IIA" })).length === 1);
assert("IIB em área IIB é adequado", checkEquipmentSuitability(gasArea(), equipment({ group: "IIB" })).length === 0);
assert("II (sem subdivisão) em área IIC é adequado", checkEquipmentSuitability(gasArea({ group: "IIC" }), equipment({ group: "II" })).length === 0);
assert("Grupo de poeira em área de gás não é adequado", checkEquipmentSuitability(gasArea(), equipment({ group: "IIIC" })).length === 1);
assert("T2 em área T3 não é adequado", checkEquipmentSuitability(gasArea(), equipment({ temperatureClass: "T2" })).length === 1);
assert("T6 em área T3 é adequado", checkEquipmentSuitability(gasArea(), equipment({ temperatureClass: "T6" })).length === 0);
assert(
  "Campos em branco não geram problema",
  checkEquipmentSuitability(gasArea({ group: null, temperatureClass: null }), {
    group: null,
    temperatureClass: null,
    maxSurfaceTempC: null,
    epl: null,
  }).length === 0,
);

const dustArea: AreaLike = { atmosphere: "POEIRA", zone: "ZONA_21", group: "IIIB", temperatureClass: null, maxSurfaceTempC: 135 };
assert(
  "Ex tb IIIC T85°C Db em Zona 21 IIIB ≤135°C é adequado",
  checkEquipmentSuitability(dustArea, { group: "IIIC", temperatureClass: null, maxSurfaceTempC: 85, epl: "Db" }).length === 0,
);
assert(
  "Temperatura de superfície 150°C acima do limite 135°C",
  checkEquipmentSuitability(dustArea, { group: "IIIC", temperatureClass: null, maxSurfaceTempC: 150, epl: "Db" }).length === 1,
);
assert(
  "Gb em zona de poeira não é adequado",
  checkEquipmentSuitability(dustArea, { group: "IIIC", temperatureClass: null, maxSurfaceTempC: 85, epl: "Gb" }).length === 1,
);

console.log("\n=== Checklist ===");
const ids = EX_CHECKLIST.map((item) => item.id);
assert("IDs do checklist são únicos", new Set(ids).size === ids.length);
assert(
  "Todo item tem ao menos um nível e um tipo de proteção",
  EX_CHECKLIST.every((item) => item.levels.length > 0 && item.protection.length > 0),
);

const exdVisual = getChecklist(["D"], "VISUAL");
const exdDetailed = getChecklist(["D"], "DETALHADA");
assert("Ex d: Detalhada tem mais verificações que Visual", exdDetailed.length > exdVisual.length);
assert("Ex d Detalhada inclui interstício das juntas (T1-A16)", exdDetailed.some((c) => c.id === "T1-A16"));
assert("Ex d Visual não inclui interstício das juntas", !exdVisual.some((c) => c.id === "T1-A16"));
assert("Ex e Detalhada não inclui interstício das juntas", !getChecklist(["E"], "DETALHADA").some((c) => c.id === "T1-A16"));
assert("Ex i usa a Tabela 2", getChecklist(["I"], "DETALHADA").every((c) => c.id.startsWith("T2-")));
assert("Ex p usa a Tabela 3", getChecklist(["P"], "APURADA").every((c) => c.id.startsWith("T3-")));
const exde = getChecklist(["D", "E"], "DETALHADA");
assert("Ex d e: união sem duplicar itens", new Set(exde.map((c) => c.id)).size === exde.length);
assert("Ex d e inclui itens de d e de e", exde.some((c) => c.id === "T1-A16") && exde.some((c) => c.id === "T1-A17"));
const exdi = getChecklist(["D", "I"], "VISUAL");
assert(
  "Ex d + i: textos repetidos entre tabelas aparecem uma vez",
  new Set(exdi.map((c) => `${c.section}|${c.text}`)).size === exdi.length,
);
assert("Sem tipo de proteção → checklist vazio", getChecklist([], "DETALHADA").length === 0);

console.log("\n=== Resultado do item ===");
const allC = Object.fromEntries(exdVisual.map((c) => [c.id, "C" as const]));
assert("Tudo C → CONFORME", computeItemResult(exdVisual, allC) === "CONFORME");
assert("Um NC → NAO_CONFORME", computeItemResult(exdVisual, { ...allC, [exdVisual[0].id]: "NC" }) === "NAO_CONFORME");
const { [exdVisual[0].id]: _removed, ...missingOne } = allC;
void _removed;
assert("Faltando resposta → PENDENTE", computeItemResult(exdVisual, missingOne) === "PENDENTE");
assert("NC com respostas faltando → NAO_CONFORME", computeItemResult(exdVisual, { [exdVisual[0].id]: "NC" }) === "NAO_CONFORME");
assert("N/A conta como respondido", computeItemResult(exdVisual, { ...allC, [exdVisual[0].id]: "NA" }) === "CONFORME");
assert("Checklist vazio → PENDENTE", computeItemResult([], {}) === "PENDENTE");

if (process.exitCode === 1) {
  console.error("\nVerificação FALHOU — ver mensagens acima.");
} else {
  console.log("\nTodas as verificações do módulo de Inspeção Ex passaram.");
}
