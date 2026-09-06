export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Novo",
  CONTACTED: "Em contato",
  QUALIFIED: "Qualificado",
  CUSTOMER: "Cliente",
  LOST: "Perdido",
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  QUALIFIED: "bg-amber-100 text-amber-700",
  CUSTOMER: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

export const INSPECTION_ACCESS_MODE_LABELS: Record<string, string> = {
  NIVEL_SOLO: "Nível do solo",
  COM_ESCADAS: "Com escadas",
};

export const INSPECTION_LEVEL_LABELS: Record<string, string> = {
  VISUAL: "Visual (Inicial)",
  APURADA: "Apurada",
  DETALHADA: "Detalhada",
};

export const QUOTE_TYPE_LABELS: Record<string, string> = {
  ESTUDO_CLASSIFICACAO_DIARIA: "Estudo de Classificação Diária",
  PROJETO: "Projeto",
  CONSULTORIA: "Consultoria",
  INSPECAO_INICIAL: "Inspeção Inicial",
  INSPECAO_APURADA: "Inspeção Apurada",
  INSPECAO_DETALHADA: "Inspeção Detalhada",
  INSTALACAO_TREINAMENTO: "Instalação e Treinamentos",
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviado",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  EXPIRED: "Expirado",
};

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-amber-100 text-amber-700",
};

export const QUOTE_ITEM_CATEGORY_LABELS: Record<string, string> = {
  MAO_DE_OBRA: "Mão de obra",
  MATERIAL: "Material",
  DESPESA: "Despesa",
  OUTROS: "Outros",
};

const INSPECTION_QUOTE_TYPES = new Set(["INSPECAO_INICIAL", "INSPECAO_APURADA", "INSPECAO_DETALHADA"]);

/** Nível de inspeção correspondente a um tipo de orçamento, quando aplicável. */
export const QUOTE_TYPE_TO_INSPECTION_LEVEL: Record<string, string> = {
  INSPECAO_INICIAL: "VISUAL",
  INSPECAO_APURADA: "APURADA",
  INSPECAO_DETALHADA: "DETALHADA",
};

export function isInspectionQuoteType(type: string): boolean {
  return INSPECTION_QUOTE_TYPES.has(type);
}
