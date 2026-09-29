// Datas "somente dia" (input type="date", AAAA-MM-DD) são gravadas ao
// meio-dia UTC para não "voltarem um dia" ao serem exibidas no fuso do
// Brasil (meia-noite UTC = 21h do dia anterior em BRT).

export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
