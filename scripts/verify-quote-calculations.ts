// Verifica o motor de cálculo (src/lib/quote-calculations.ts) contra os
// números exatos da planilha "Cálculo de Custos e Despesas" do cliente.
//
// Roda com: npx tsx scripts/verify-quote-calculations.ts
//
// Observação: o TOTAL final é diferente do da planilha original de
// propósito — o cliente confirmou que o ISS deve incidir também sobre
// despesas (na planilha, só incidia sobre mão de obra). Por isso
// validamos aqui os subtotais/blocos que não mudaram, e conferimos que
// a diferença no total é exatamente o ISS adicional sobre despesas.

import {
  calculateInspectionFieldHours,
  calculateInspectionOfficeHours,
  calculateQuoteTotals,
} from "../src/lib/quote-calculations";

function assertClose(label: string, actual: number, expected: number, tolerance = 0.01) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    console.error(`FALHOU: ${label} — esperado ${expected}, obtido ${actual} (diff ${diff})`);
    process.exitCode = 1;
    return;
  }
  console.log(`OK: ${label} = ${actual.toFixed(4)}`);
}

// --- Aba "HAC" da planilha ------------------------------------------------
console.log("\n=== Aba HAC ===");
{
  const laborLines = [
    { hours: 40, hourlyCost: 119.11 }, // HH de campo
    { hours: 160, hourlyCost: 141.1 }, // HH de escritório
    { hours: 8, hourlyCost: 114.52 }, // HH desenhos em CAD
  ];
  const expenseLines = [
    { quantity: 1, unitCost: 1400 }, // passagem aérea (2x trecho)
    { quantity: 1, unitCost: 900 }, // aluguel de carro (6 diárias)
    { quantity: 1, unitCost: 240 }, // combustível
    { quantity: 1, unitCost: 1800 }, // hospedagem (6 diárias)
    { quantity: 1, unitCost: 600 }, // alimentação (6 diárias)
  ];

  const result = calculateQuoteTotals({
    laborLines,
    expenseLines,
    laborMarginPct: 0.5,
    expenseMarginPct: 0.3,
    issPct: 0.07,
  });

  assertClose("mão de obra c/ margem (G3)", result.laborWithMargin, 56513.12);
  assertClose("mão de obra c/ margem+ISS (H3)", result.laborFinal, 60469.0384);
  assertClose("subtotal despesas (D16)", result.expenseSubtotal, 4940);
  assertClose("despesas c/ margem, sem ISS (D18 original)", result.expenseWithMargin, 7057.142857);

  const expectedTotalWithIssOnExpenses = result.laborFinal + result.expenseWithMargin * 1.07;
  assertClose("total (com correção do ISS nas despesas)", result.total, expectedTotalWithIssOnExpenses);

  const originalFlawedTotal = 67526.18125714286;
  const issOnExpenses = result.expenseWithMargin * 0.07;
  assertClose(
    "total novo = total original da planilha + ISS que faltava nas despesas",
    result.total,
    originalFlawedTotal + issOnExpenses,
  );
}

// --- Aba "INSPEÇÃO" da planilha -------------------------------------------
console.log("\n=== Aba INSPEÇÃO ===");
{
  const standards = [
    { accessMode: "NIVEL_SOLO", inspectionLevel: "VISUAL", minutesPerUnit: 5 },
    { accessMode: "NIVEL_SOLO", inspectionLevel: "APURADA", minutesPerUnit: 7 },
    { accessMode: "NIVEL_SOLO", inspectionLevel: "DETALHADA", minutesPerUnit: 180 },
    { accessMode: "COM_ESCADAS", inspectionLevel: "VISUAL", minutesPerUnit: 25 },
    { accessMode: "COM_ESCADAS", inspectionLevel: "APURADA", minutesPerUnit: 27 },
    { accessMode: "COM_ESCADAS", inspectionLevel: "DETALHADA", minutesPerUnit: 220 },
  ];
  const quantities = {
    "NIVEL_SOLO:APURADA": 60,
    "COM_ESCADAS:APURADA": 20,
  };

  const { hours: fieldHours, totalUnits } = calculateInspectionFieldHours(standards, quantities);
  assertClose("HH de campo calculado (C15)", fieldHours, 16);
  assertClose("total de equipamentos", totalUnits, 80);

  const officeHours = calculateInspectionOfficeHours(totalUnits);
  assertClose("HH de escritório calculado (C16)", officeHours, 40);

  const laborLines = [
    { hours: fieldHours, hourlyCost: 119.11 }, // HH de campo
    { hours: officeHours, hourlyCost: 141.1 }, // HH de escritório
  ];
  const expenseLines = [
    { quantity: 1, unitCost: 1400 }, // passagem aérea
    { quantity: 1, unitCost: 750 }, // aluguel de carro (5 diárias)
    { quantity: 1, unitCost: 240 }, // combustível
    { quantity: 1, unitCost: 1500 }, // hospedagem (5 diárias)
    { quantity: 1, unitCost: 500 }, // alimentação (5 diárias)
  ];

  const result = calculateQuoteTotals({
    laborLines,
    expenseLines,
    laborMarginPct: 0.5,
    expenseMarginPct: 0.3,
    issPct: 0.07,
  });

  assertClose("mão de obra c/ margem (G15)", result.laborWithMargin, 15099.52);
  assertClose("mão de obra c/ margem+ISS (H15)", result.laborFinal, 16156.4864);
  assertClose("subtotal despesas (D27)", result.expenseSubtotal, 4390);
  assertClose("despesas c/ margem, sem ISS (D29 original)", result.expenseWithMargin, 6271.428571);

  const originalFlawedTotal = 22427.914971428574;
  const issOnExpenses = result.expenseWithMargin * 0.07;
  assertClose(
    "total novo = total original da planilha + ISS que faltava nas despesas",
    result.total,
    originalFlawedTotal + issOnExpenses,
  );
}

if (process.exitCode === 1) {
  console.error("\nVerificação FALHOU — ver mensagens acima.");
} else {
  console.log("\nTodas as verificações passaram — motor de cálculo bate com a planilha.");
}
