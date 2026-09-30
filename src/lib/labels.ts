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

// --- Inspeção Ex ---------------------------------------------------------

/** Nome de exibição da empresa (dados vindos do CRM). */
export function empresaLabel(empresa: { razaoSocial: string; nomeFantasia: string | null }): string {
  return empresa.nomeFantasia ? `${empresa.nomeFantasia} (${empresa.razaoSocial})` : empresa.razaoSocial;
}

export const TRABALHO_STATUS_LABELS: Record<string, string> = {
  VENDIDO: "Vendido",
  EM_EXECUCAO: "Em execução",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const TRABALHO_STATUS_COLORS: Record<string, string> = {
  VENDIDO: "bg-blue-100 text-blue-700",
  EM_EXECUCAO: "bg-amber-100 text-amber-700",
  ENTREGUE: "bg-green-100 text-green-700",
  CANCELADO: "bg-slate-100 text-slate-700",
};

export const EX_ATMOSPHERE_LABELS: Record<string, string> = {
  GAS: "Gás",
  POEIRA: "Poeira",
};

export const EX_ZONE_LABELS: Record<string, string> = {
  ZONA_0: "Zona 0",
  ZONA_1: "Zona 1",
  ZONA_2: "Zona 2",
  ZONA_20: "Zona 20",
  ZONA_21: "Zona 21",
  ZONA_22: "Zona 22",
};

export const EX_ZONES_BY_ATMOSPHERE: Record<string, string[]> = {
  GAS: ["ZONA_0", "ZONA_1", "ZONA_2"],
  POEIRA: ["ZONA_20", "ZONA_21", "ZONA_22"],
};

export const EX_GROUPS_BY_ATMOSPHERE: Record<string, string[]> = {
  GAS: ["II", "IIA", "IIB", "IIC"],
  POEIRA: ["III", "IIIA", "IIIB", "IIIC"],
};

export const EX_GROUP_VALUES = ["II", "IIA", "IIB", "IIC", "III", "IIIA", "IIIB", "IIIC"];
export const EX_TEMPERATURE_CLASS_VALUES = ["T1", "T2", "T3", "T4", "T5", "T6"];
export const EX_EPL_VALUES = ["Ga", "Gb", "Gc", "Da", "Db", "Dc"];

export const EX_PROTECTION_TYPE_LABELS: Record<string, string> = {
  D: "Ex d — À prova de explosão",
  E: "Ex e — Segurança aumentada",
  I: "Ex i — Segurança intrínseca",
  N: "Ex n — Não acendível",
  P: "Ex p — Pressurizado",
  M: "Ex m — Encapsulado",
  O: "Ex o — Imerso em líquido",
  Q: "Ex q — Imerso em areia",
  T: "Ex t — Proteção por invólucro (poeira)",
  S: "Ex s — Proteção especial",
};

/** "D,E" → "Ex d e" */
export function formatProtectionTypes(types: readonly string[]): string {
  if (types.length === 0) return "—";
  return `Ex ${types.map((t) => t.toLowerCase()).join(" ")}`;
}

export const EX_INSPECTION_TYPE_LABELS: Record<string, string> = {
  INICIAL: "Inicial",
  PERIODICA: "Periódica",
  AMOSTRAGEM: "Por amostragem",
};

export const EX_INSPECTION_STATUS_LABELS: Record<string, string> = {
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

export const EX_INSPECTION_STATUS_COLORS: Record<string, string> = {
  EM_ANDAMENTO: "bg-amber-100 text-amber-700",
  CONCLUIDA: "bg-green-100 text-green-700",
};

export const EX_ITEM_RESULT_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  CONFORME: "Conforme",
  NAO_CONFORME: "Não conforme",
};

export const EX_ITEM_RESULT_COLORS: Record<string, string> = {
  PENDENTE: "bg-slate-100 text-slate-700",
  CONFORME: "bg-green-100 text-green-700",
  NAO_CONFORME: "bg-red-100 text-red-700",
};

export const EX_CHECK_ANSWER_LABELS: Record<string, string> = {
  C: "C",
  NC: "NC",
  NA: "N/A",
};
