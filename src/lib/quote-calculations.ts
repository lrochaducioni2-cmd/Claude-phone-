// Motor de cálculo de Orçamento.
//
// Validado contra a planilha "Cálculo de Custos e Despesas" do cliente
// (ver scripts/verify-quote-calculations.ts) — com uma correção pedida:
// o ISS passou a incidir também sobre despesas (na planilha original só
// incidia sobre mão de obra).
//
// Dois blocos de custo, cada um com sua própria margem:
//   - Mão de obra: subtotal = Σ(horas × custo-hora do cargo)
//   - Despesas:    subtotal = Σ(quantidade × custo unitário do item)
// Cada bloco vira preço de venda como subtotal / (1 - margem do bloco),
// e o ISS incide sobre os dois blocos já com margem:
//   blocoComImposto = (subtotal / (1 - margem)) * (1 + issPct)
// Total da proposta = mão de obra c/ imposto + despesas c/ imposto.

export type LaborLine = {
  hours: number;
  hourlyCost: number;
};

export type ExpenseLine = {
  quantity: number;
  unitCost: number;
};

export type QuoteCalculationInput = {
  laborLines: LaborLine[];
  expenseLines: ExpenseLine[];
  laborMarginPct: number; // ex.: 0.5 = 50%
  expenseMarginPct: number; // ex.: 0.3 = 30%
  issPct: number; // ex.: 0.07 = 7%
};

export type QuoteCalculationResult = {
  laborSubtotal: number; // custo, sem margem nem imposto
  expenseSubtotal: number; // custo, sem margem nem imposto
  laborWithMargin: number; // preço de venda da mão de obra (custo / (1-margem))
  expenseWithMargin: number; // preço de venda das despesas (custo / (1-margem))
  laborFinal: number; // mão de obra com margem + ISS
  expenseFinal: number; // despesas com margem + ISS
  total: number; // total da proposta
};

function applyMargin(subtotal: number, marginPct: number): number {
  if (marginPct >= 1) {
    throw new Error("Margem não pode ser 100% ou mais (divisão por zero).");
  }
  return subtotal / (1 - marginPct);
}

export function calculateQuoteTotals({
  laborLines,
  expenseLines,
  laborMarginPct,
  expenseMarginPct,
  issPct,
}: QuoteCalculationInput): QuoteCalculationResult {
  const laborSubtotal = laborLines.reduce((sum, line) => sum + line.hours * line.hourlyCost, 0);
  const expenseSubtotal = expenseLines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);

  const laborWithMargin = applyMargin(laborSubtotal, laborMarginPct);
  const expenseWithMargin = applyMargin(expenseSubtotal, expenseMarginPct);

  const laborFinal = laborWithMargin * (1 + issPct);
  const expenseFinal = expenseWithMargin * (1 + issPct);

  return {
    laborSubtotal,
    expenseSubtotal,
    laborWithMargin,
    expenseWithMargin,
    laborFinal,
    expenseFinal,
    total: laborFinal + expenseFinal,
  };
}

// --- Despesa de deslocamento -------------------------------------------

/** Custo de combustível por km rodado real (não mais "tanque cheio"). */
export function calculateFuelCost({
  kmRoundTrip,
  consumptionKmPerLiter,
  pricePerLiter,
}: {
  kmRoundTrip: number;
  consumptionKmPerLiter: number;
  pricePerLiter: number;
}): number {
  if (consumptionKmPerLiter <= 0) return 0;
  return (kmRoundTrip / consumptionKmPerLiter) * pricePerLiter;
}

/** Total de dias que multiplicam diárias (hospedagem, alimentação, carro alugado). */
export function calculateDailyRateDays({
  fieldDays,
  travelDays,
}: {
  fieldDays: number;
  travelDays: number;
}): number {
  return fieldDays + travelDays;
}

// --- Calculadora de horas de Inspeção -----------------------------------

export type InspectionStandard = {
  accessMode: string;
  inspectionLevel: string;
  minutesPerUnit: number;
};

/** Quantidade de equipamentos por combinação "accessMode:inspectionLevel". */
export type InspectionQuantities = Record<string, number>;

export function inspectionKey(accessMode: string, inspectionLevel: string): string {
  return `${accessMode}:${inspectionLevel}`;
}

export function calculateInspectionFieldHours(
  standards: InspectionStandard[],
  quantities: InspectionQuantities,
): { hours: number; totalUnits: number } {
  let totalMinutes = 0;
  let totalUnits = 0;

  for (const standard of standards) {
    const qty = quantities[inspectionKey(standard.accessMode, standard.inspectionLevel)] ?? 0;
    totalMinutes += standard.minutesPerUnit * qty;
    totalUnits += qty;
  }

  return { hours: totalMinutes / 60, totalUnits };
}

/** HH de escritório (relatório/documentação) por equipamento inspecionado. */
export function calculateInspectionOfficeHours(
  totalUnits: number,
  officeHoursPerUnit = 0.5,
): number {
  return totalUnits * officeHoursPerUnit;
}
