// Checklist de inspeção Ex — baseado nas Tabelas 1, 2 e 3 da
// ABNT NBR IEC 60079-17 (Inspeção e manutenção de instalações elétricas).
//
// Cada verificação diz em quais níveis de inspeção se aplica
// (D = Detalhada, A = Apurada, V = Visual) e a quais tipos de proteção:
//   - Tabela 1 → Ex d, e, n, t (e, por extensão, m, o, q, s)
//   - Tabela 2 → Ex i
//   - Tabela 3 → Ex p
// Um equipamento com mais de um tipo de proteção (ex.: "Ex d e") recebe a
// união das verificações, sem repetir as comuns.
//
// Texto condensado/traduzido; revise contra a edição da norma adotada
// pelo cliente antes de emitir laudos.

export type InspectionLevelCode = "VISUAL" | "APURADA" | "DETALHADA";
export type ProtectionTypeCode = "D" | "E" | "I" | "N" | "P" | "M" | "O" | "Q" | "T" | "S";
export type CheckAnswer = "C" | "NC" | "NA";

export type ChecklistItem = {
  id: string;
  section: string;
  text: string;
  levels: InspectionLevelCode[];
  protection: ProtectionTypeCode[];
};

const T1_ALL: ProtectionTypeCode[] = ["D", "E", "N", "T", "M", "O", "Q", "S"];
const DAV: InspectionLevelCode[] = ["DETALHADA", "APURADA", "VISUAL"];
const DA: InspectionLevelCode[] = ["DETALHADA", "APURADA"];
const D: InspectionLevelCode[] = ["DETALHADA"];

export const CHECKLIST_SECTIONS = {
  EQUIPAMENTO: "A. Equipamento",
  INSTALACAO: "B. Instalação",
  AMBIENTE: "C. Ambiente",
} as const;

const { EQUIPAMENTO, INSTALACAO, AMBIENTE } = CHECKLIST_SECTIONS;

export const EX_CHECKLIST: ChecklistItem[] = [
  // --- Tabela 1: Ex d, e, n, t -------------------------------------------
  { id: "T1-A01", section: EQUIPAMENTO, levels: DAV, protection: T1_ALL, text: "Equipamento adequado aos requisitos de EPL/zona do local" },
  { id: "T1-A02", section: EQUIPAMENTO, levels: DA, protection: T1_ALL, text: "Grupo do equipamento correto" },
  { id: "T1-A03", section: EQUIPAMENTO, levels: DA, protection: ["D", "E", "N", "M", "O", "Q", "S"], text: "Classe de temperatura do equipamento correta (gás)" },
  { id: "T1-A04", section: EQUIPAMENTO, levels: DA, protection: ["T"], text: "Temperatura máxima de superfície do equipamento correta (poeira)" },
  { id: "T1-A05", section: EQUIPAMENTO, levels: DAV, protection: T1_ALL, text: "Grau de proteção (IP) adequado ao nível de proteção/grupo/condutividade" },
  { id: "T1-A06", section: EQUIPAMENTO, levels: D, protection: T1_ALL, text: "Identificação do circuito do equipamento correta" },
  { id: "T1-A07", section: EQUIPAMENTO, levels: DAV, protection: T1_ALL, text: "Identificação do circuito do equipamento disponível" },
  { id: "T1-A08", section: EQUIPAMENTO, levels: DAV, protection: T1_ALL, text: "Invólucro, partes de vidro e vedações/compostos vidro-metal satisfatórios" },
  { id: "T1-A09", section: EQUIPAMENTO, levels: D, protection: T1_ALL, text: "Sem danos ou modificações não autorizadas" },
  { id: "T1-A10", section: EQUIPAMENTO, levels: ["APURADA", "VISUAL"], protection: T1_ALL, text: "Sem evidência de modificações não autorizadas" },
  { id: "T1-A11", section: EQUIPAMENTO, levels: DAV, protection: T1_ALL, text: "Parafusos, prensa-cabos e bujões do tipo correto, completos e apertados (verificação física em D/A, visual em V)" },
  { id: "T1-A12", section: EQUIPAMENTO, levels: DA, protection: ["D", "E", "N", "T"], text: "Tampas roscadas do tipo correto, apertadas e travadas" },
  { id: "T1-A13", section: EQUIPAMENTO, levels: D, protection: ["D"], text: "Superfícies de junta limpas e sem danos; juntas de vedação, se houver, satisfatórias e bem posicionadas" },
  { id: "T1-A14", section: EQUIPAMENTO, levels: D, protection: ["E", "N", "T"], text: "Condição das juntas de vedação do invólucro satisfatória" },
  { id: "T1-A15", section: EQUIPAMENTO, levels: D, protection: T1_ALL, text: "Sem evidência de entrada de água ou poeira no invólucro" },
  { id: "T1-A16", section: EQUIPAMENTO, levels: D, protection: ["D"], text: "Interstícios das juntas flangeadas dentro dos valores permitidos" },
  { id: "T1-A17", section: EQUIPAMENTO, levels: D, protection: ["E", "N"], text: "Conexões elétricas apertadas" },
  { id: "T1-A18", section: EQUIPAMENTO, levels: D, protection: ["E", "N"], text: "Terminais não utilizados apertados" },
  { id: "T1-A19", section: EQUIPAMENTO, levels: D, protection: ["N"], text: "Dispositivos de interrupção enclausurados e hermeticamente selados sem danos" },
  { id: "T1-A20", section: EQUIPAMENTO, levels: D, protection: ["E", "N"], text: "Componentes encapsulados sem danos" },
  { id: "T1-A21", section: EQUIPAMENTO, levels: D, protection: ["E", "N"], text: "Componentes à prova de explosão sem danos" },
  { id: "T1-A22", section: EQUIPAMENTO, levels: D, protection: ["N"], text: "Invólucro de respiração restrita (nR) satisfatório; porta de teste funcional" },
  { id: "T1-A23", section: EQUIPAMENTO, levels: DA, protection: ["D", "E", "N"], text: "Dispositivos de respiro e dreno satisfatórios" },
  { id: "T1-A24", section: EQUIPAMENTO, levels: D, protection: ["E", "N"], text: "Lâmpadas fluorescentes/HID sem indicação de fim de vida" },
  { id: "T1-A25", section: EQUIPAMENTO, levels: D, protection: ["D", "E", "N"], text: "Tipo, potência, pinagem e posição das lâmpadas corretos" },
  { id: "T1-A26", section: EQUIPAMENTO, levels: DAV, protection: ["D", "E", "N"], text: "Motores: folga do ventilador ao invólucro, sistema de refrigeração e base sem danos ou trincas" },
  { id: "T1-A27", section: EQUIPAMENTO, levels: DAV, protection: T1_ALL, text: "Fluxo de ar de ventilação não obstruído" },
  { id: "T1-A28", section: EQUIPAMENTO, levels: D, protection: ["D", "E", "N"], text: "Resistência de isolamento (IR) dos enrolamentos do motor satisfatória" },

  { id: "T1-B01", section: INSTALACAO, levels: D, protection: T1_ALL, text: "Tipo de cabo apropriado" },
  { id: "T1-B02", section: INSTALACAO, levels: DAV, protection: T1_ALL, text: "Sem danos aparentes aos cabos" },
  { id: "T1-B03", section: INSTALACAO, levels: DAV, protection: T1_ALL, text: "Vedação de canaletas, dutos, tubos e/ou eletrodutos satisfatória" },
  { id: "T1-B04", section: INSTALACAO, levels: D, protection: ["D", "E", "N"], text: "Unidades seladoras e caixas de cabos corretamente preenchidas" },
  { id: "T1-B05", section: INSTALACAO, levels: D, protection: ["D", "E", "N"], text: "Integridade do sistema de eletrodutos e interface com sistema misto mantida" },
  { id: "T1-B06", section: INSTALACAO, levels: DAV, protection: T1_ALL, text: "Aterramento e equipotencialização satisfatórios (conexões apertadas, seção adequada)" },
  { id: "T1-B07", section: INSTALACAO, levels: D, protection: T1_ALL, text: "Impedância de laço de falta (TN) ou resistência de aterramento (IT) satisfatória" },
  { id: "T1-B08", section: INSTALACAO, levels: D, protection: T1_ALL, text: "Dispositivos de proteção automáticos ajustados corretamente (sem rearme automático)" },
  { id: "T1-B09", section: INSTALACAO, levels: D, protection: T1_ALL, text: "Dispositivos de proteção automáticos operam dentro dos limites permitidos" },
  { id: "T1-B10", section: INSTALACAO, levels: D, protection: T1_ALL, text: "Condições específicas de uso (se aplicável) atendidas" },
  { id: "T1-B11", section: INSTALACAO, levels: D, protection: T1_ALL, text: "Cabos não utilizados corretamente terminados" },
  { id: "T1-B12", section: INSTALACAO, levels: DAV, protection: ["D"], text: "Obstruções próximas às juntas flangeadas à prova de explosão conforme IEC 60079-14" },
  { id: "T1-B13", section: INSTALACAO, levels: DA, protection: T1_ALL, text: "Instalação com tensão/frequência variável (inversor) conforme documentação" },

  { id: "T1-C01", section: AMBIENTE, levels: DAV, protection: T1_ALL, text: "Equipamento protegido contra corrosão, intempéries, vibração e outros fatores adversos" },
  { id: "T1-C02", section: AMBIENTE, levels: DAV, protection: T1_ALL, text: "Sem acúmulo excessivo de poeira e sujeira" },
  { id: "T1-C03", section: AMBIENTE, levels: DA, protection: ["E", "N"], text: "Isolação elétrica limpa e seca" },

  // --- Tabela 2: Ex i ----------------------------------------------------
  { id: "T2-A01", section: EQUIPAMENTO, levels: DAV, protection: ["I"], text: "Documentação do circuito e/ou equipamento apropriada ao EPL/zona do local" },
  { id: "T2-A02", section: EQUIPAMENTO, levels: DA, protection: ["I"], text: "Equipamento instalado é o especificado na documentação (apenas equipamento fixo)" },
  { id: "T2-A03", section: EQUIPAMENTO, levels: DA, protection: ["I"], text: "Categoria e grupo do circuito e/ou equipamento corretos" },
  { id: "T2-A04", section: EQUIPAMENTO, levels: DA, protection: ["I"], text: "Classe de temperatura / temperatura máxima de superfície corretas" },
  { id: "T2-A05", section: EQUIPAMENTO, levels: DAV, protection: ["I"], text: "Grau de proteção (IP) do equipamento adequado ao grupo" },
  { id: "T2-A06", section: EQUIPAMENTO, levels: DAV, protection: ["I"], text: "Instalação claramente identificada" },
  { id: "T2-A07", section: EQUIPAMENTO, levels: DAV, protection: ["I"], text: "Invólucro, partes de vidro e vedações satisfatórios" },
  { id: "T2-A08", section: EQUIPAMENTO, levels: DAV, protection: ["I"], text: "Sem modificações não autorizadas" },
  { id: "T2-A09", section: EQUIPAMENTO, levels: DA, protection: ["I"], text: "Barreiras de segurança, relés e outros dispositivos limitadores de energia do tipo aprovado, instalados conforme certificação e aterrados quando requerido" },
  { id: "T2-A10", section: EQUIPAMENTO, levels: DAV, protection: ["I"], text: "Conexões elétricas apertadas" },
  { id: "T2-A11", section: EQUIPAMENTO, levels: D, protection: ["I"], text: "Placas de circuito impresso limpas e sem danos" },

  { id: "T2-B01", section: INSTALACAO, levels: D, protection: ["I"], text: "Cabos instalados conforme a documentação" },
  { id: "T2-B02", section: INSTALACAO, levels: DA, protection: ["I"], text: "Blindagens dos cabos aterradas conforme a documentação" },
  { id: "T2-B03", section: INSTALACAO, levels: D, protection: ["I"], text: "Conexões ponto a ponto corretas (apenas inspeção inicial)" },
  { id: "T2-B04", section: INSTALACAO, levels: D, protection: ["I"], text: "Continuidade de terra satisfatória em circuitos não isolados galvanicamente" },
  { id: "T2-B05", section: INSTALACAO, levels: DA, protection: ["I"], text: "Conexões de terra não comprometem o tipo de proteção" },
  { id: "T2-B06", section: INSTALACAO, levels: D, protection: ["I"], text: "Aterramento do circuito intrinsecamente seguro satisfatório" },
  { id: "T2-B07", section: INSTALACAO, levels: D, protection: ["I"], text: "Resistência de isolamento satisfatória" },
  { id: "T2-B08", section: INSTALACAO, levels: D, protection: ["I"], text: "Separação mantida entre circuitos IS e não-IS em caixas de distribuição/painéis comuns" },
  { id: "T2-B09", section: INSTALACAO, levels: D, protection: ["I"], text: "Proteção contra curto-circuito da fonte de alimentação conforme documentação" },
  { id: "T2-B10", section: INSTALACAO, levels: D, protection: ["I"], text: "Condições específicas de uso (se aplicável) atendidas" },
  { id: "T2-B11", section: INSTALACAO, levels: D, protection: ["I"], text: "Cabos não utilizados corretamente terminados" },

  { id: "T2-C01", section: AMBIENTE, levels: DAV, protection: ["I"], text: "Equipamento protegido contra corrosão, intempéries, vibração e outros fatores adversos" },
  { id: "T2-C02", section: AMBIENTE, levels: DAV, protection: ["I"], text: "Sem acúmulo excessivo de poeira e sujeira" },

  // --- Tabela 3: Ex p ----------------------------------------------------
  { id: "T3-A01", section: EQUIPAMENTO, levels: DAV, protection: ["P"], text: "Equipamento adequado aos requisitos de EPL/zona do local" },
  { id: "T3-A02", section: EQUIPAMENTO, levels: DA, protection: ["P"], text: "Grupo do equipamento correto" },
  { id: "T3-A03", section: EQUIPAMENTO, levels: DA, protection: ["P"], text: "Classe de temperatura / temperatura máxima de superfície corretas" },
  { id: "T3-A04", section: EQUIPAMENTO, levels: D, protection: ["P"], text: "Identificação do circuito do equipamento correta" },
  { id: "T3-A05", section: EQUIPAMENTO, levels: DAV, protection: ["P"], text: "Identificação do circuito do equipamento disponível" },
  { id: "T3-A06", section: EQUIPAMENTO, levels: DAV, protection: ["P"], text: "Invólucro, partes de vidro e vedações satisfatórios" },
  { id: "T3-A07", section: EQUIPAMENTO, levels: DAV, protection: ["P"], text: "Sem modificações não autorizadas" },
  { id: "T3-A08", section: EQUIPAMENTO, levels: D, protection: ["P"], text: "Tipo, potência e posição das lâmpadas corretos" },

  { id: "T3-B01", section: INSTALACAO, levels: D, protection: ["P"], text: "Tipo de cabo apropriado" },
  { id: "T3-B02", section: INSTALACAO, levels: DAV, protection: ["P"], text: "Sem danos aparentes aos cabos" },
  { id: "T3-B03", section: INSTALACAO, levels: DAV, protection: ["P"], text: "Aterramento e equipotencialização satisfatórios" },
  { id: "T3-B04", section: INSTALACAO, levels: D, protection: ["P"], text: "Impedância de laço de falta (TN) ou resistência de aterramento (IT) satisfatória" },
  { id: "T3-B05", section: INSTALACAO, levels: D, protection: ["P"], text: "Dispositivos de proteção automáticos operam dentro dos limites permitidos" },
  { id: "T3-B06", section: INSTALACAO, levels: D, protection: ["P"], text: "Temperatura de entrada do gás de proteção abaixo do máximo especificado" },
  { id: "T3-B07", section: INSTALACAO, levels: DAV, protection: ["P"], text: "Dutos, tubos e invólucros em boas condições" },
  { id: "T3-B08", section: INSTALACAO, levels: DAV, protection: ["P"], text: "Gás de proteção substancialmente livre de contaminantes" },
  { id: "T3-B09", section: INSTALACAO, levels: DAV, protection: ["P"], text: "Pressão e/ou vazão do gás de proteção adequadas" },
  { id: "T3-B10", section: INSTALACAO, levels: D, protection: ["P"], text: "Indicadores de pressão e/ou vazão, alarmes e intertravamentos funcionam corretamente" },
  { id: "T3-B11", section: INSTALACAO, levels: D, protection: ["P"], text: "Tempo de purga pré-energização adequado" },
  { id: "T3-B12", section: INSTALACAO, levels: D, protection: ["P"], text: "Barreiras de faíscas e partículas dos dutos de exaustão em área classificada satisfatórias" },
  { id: "T3-B13", section: INSTALACAO, levels: D, protection: ["P"], text: "Condições específicas de uso (se aplicável) atendidas" },

  { id: "T3-C01", section: AMBIENTE, levels: DAV, protection: ["P"], text: "Equipamento protegido contra corrosão, intempéries, vibração e outros fatores adversos" },
  { id: "T3-C02", section: AMBIENTE, levels: DAV, protection: ["P"], text: "Sem acúmulo excessivo de poeira e sujeira" },
];

/**
 * Verificações aplicáveis a um equipamento num dado nível de inspeção.
 * Itens de tabelas diferentes com o mesmo texto (ex.: "Sem acúmulo de
 * poeira") aparecem uma vez só, mantendo o primeiro.
 */
export function getChecklist(
  protectionTypes: readonly string[],
  level: string,
): ChecklistItem[] {
  const seenTexts = new Set<string>();
  const result: ChecklistItem[] = [];
  for (const item of EX_CHECKLIST) {
    if (!item.levels.includes(level as InspectionLevelCode)) continue;
    if (!item.protection.some((p) => protectionTypes.includes(p))) continue;
    const key = `${item.section}|${item.text}`;
    if (seenTexts.has(key)) continue;
    seenTexts.add(key);
    result.push(item);
  }
  return result;
}

export type ItemResult = "PENDENTE" | "CONFORME" | "NAO_CONFORME";

/**
 * Resultado do item a partir das respostas: qualquer "NC" reprova; todas as
 * verificações respondidas sem "NC" aprovam; caso contrário fica pendente.
 * Um equipamento sem nenhuma verificação aplicável (sem tipo de proteção
 * cadastrado) nunca é aprovado automaticamente.
 */
export function computeItemResult(
  checklist: readonly ChecklistItem[],
  answers: Record<string, CheckAnswer | undefined>,
): ItemResult {
  if (checklist.some((item) => answers[item.id] === "NC")) return "NAO_CONFORME";
  if (checklist.length > 0 && checklist.every((item) => answers[item.id])) return "CONFORME";
  return "PENDENTE";
}
