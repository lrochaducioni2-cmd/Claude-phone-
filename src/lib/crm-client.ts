// Cliente da API do CRM — único canal entre os dois sistemas (nunca banco
// compartilhado). Contrato em INTEGRACAO.md.
//
// Configuração (.env):
//   CRM_API_URL    — URL base do CRM, ex.: https://crm.exemplo.com.br
//   CRM_API_TOKEN  — token emitido pelo CRM para este software (Bearer)
//
// As respostas são validadas com zod no formato do contrato (snake_case).
// Pontos ainda em aberto no contrato são aceitos nas duas formas:
//   - listas podem vir como array puro ou como { data: [...] };
//   - GET /api/trabalhos/:id pode trazer a empresa embutida (`empresa`) ou
//     só `empresa_id` (aí buscamos em GET /api/empresas/:id).

import { z } from "zod";

const id = z.union([z.string(), z.number()]).transform(String);
const optionalString = z.string().nullish().transform((v) => v || null);
const optionalNumber = z.coerce.number().nullish().transform((v) => v ?? null);

export const crmEmpresaSchema = z.object({
  id,
  razao_social: z.string(),
  nome_fantasia: optionalString,
  cnpj: optionalString,
  endereco: optionalString,
  telefone: optionalString,
  email: optionalString,
  contato_responsavel: optionalString,
});

export type CrmEmpresa = z.infer<typeof crmEmpresaSchema>;

export const crmTrabalhoStatusValues = ["orcamento", "vendido", "em_execucao", "entregue", "cancelado"] as const;
export type CrmTrabalhoStatus = (typeof crmTrabalhoStatusValues)[number];

export const crmTrabalhoSchema = z.object({
  id,
  empresa_id: id,
  descricao_escopo: z.string(),
  valor: optionalNumber,
  data_venda: optionalString,
  status: z.enum(crmTrabalhoStatusValues),
  data_entrega: optionalString,
  link_relatorio: optionalString,
  empresa: crmEmpresaSchema.nullish(),
});

export type CrmTrabalho = z.infer<typeof crmTrabalhoSchema>;

export type CrmStatusUpdate = {
  status: CrmTrabalhoStatus;
  data_entrega?: string;
  link_relatorio?: string;
  observacoes?: string;
};

export class CrmError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CrmError";
  }
}

const TIMEOUT_MS = 10_000;

function config() {
  const baseUrl = process.env.CRM_API_URL?.replace(/\/+$/, "");
  const token = process.env.CRM_API_TOKEN;
  if (!baseUrl || !token) {
    throw new CrmError("Integração com o CRM não configurada (defina CRM_API_URL e CRM_API_TOKEN no .env).");
  }
  return { baseUrl, token };
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const { baseUrl, token } = config();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "tempo esgotado" : "sem conexão";
    throw new CrmError(`Não foi possível falar com o CRM (${reason}).`);
  }

  if (res.status === 401 || res.status === 403) {
    throw new CrmError("O CRM recusou o token de acesso (verifique CRM_API_TOKEN).", res.status);
  }
  if (res.status === 404) {
    throw new CrmError("Registro não encontrado no CRM.", 404);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CrmError(`O CRM respondeu com erro ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}.`, res.status);
  }

  if (res.status === 204) return null;
  return res.json().catch(() => {
    throw new CrmError("Resposta do CRM não é um JSON válido.", res.status);
  });
}

function parse<T>(schema: z.ZodType<T>, data: unknown, what: string): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .slice(0, 3)
      .map((issue) => `${issue.path.join(".") || "(raiz)"}: ${issue.message}`)
      .join("; ");
    throw new CrmError(`Resposta do CRM fora do contrato (${what}) — ${detail}`);
  }
  return parsed.data;
}

function unwrapList(data: unknown): unknown {
  if (data && typeof data === "object" && !Array.isArray(data) && "data" in data) {
    return (data as { data: unknown }).data;
  }
  return data;
}

export function isCrmConfigured(): boolean {
  return Boolean(process.env.CRM_API_URL && process.env.CRM_API_TOKEN);
}

export async function listTrabalhosVendidos(): Promise<CrmTrabalho[]> {
  const data = await request("/api/trabalhos?status=vendido");
  return parse(z.array(crmTrabalhoSchema), unwrapList(data), "lista de trabalhos");
}

export async function getTrabalho(crmId: string): Promise<CrmTrabalho> {
  const data = await request(`/api/trabalhos/${encodeURIComponent(crmId)}`);
  return parse(crmTrabalhoSchema, data, "trabalho");
}

export async function getEmpresa(crmId: string): Promise<CrmEmpresa> {
  const data = await request(`/api/empresas/${encodeURIComponent(crmId)}`);
  return parse(crmEmpresaSchema, data, "empresa");
}

export async function updateTrabalhoStatus(crmId: string, update: CrmStatusUpdate): Promise<void> {
  await request(`/api/trabalhos/${encodeURIComponent(crmId)}/status`, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
}

// --- Conversão CRM → modelo local ------------------------------------------

/** "2026-10-15" ou ISO completo → Date (datas só-dia ao meio-dia UTC). */
export function parseCrmDate(value: string | null): Date | null {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function empresaFromCrm(empresa: CrmEmpresa) {
  return {
    crmId: empresa.id,
    razaoSocial: empresa.razao_social,
    nomeFantasia: empresa.nome_fantasia,
    cnpj: empresa.cnpj,
    endereco: empresa.endereco,
    telefone: empresa.telefone,
    email: empresa.email,
    contatoResponsavel: empresa.contato_responsavel,
    syncedAt: new Date(),
  };
}

/** Status local (enum Prisma) → status do contrato do CRM. */
export const LOCAL_TO_CRM_STATUS = {
  VENDIDO: "vendido",
  EM_EXECUCAO: "em_execucao",
  ENTREGUE: "entregue",
  CANCELADO: "cancelado",
} as const satisfies Record<string, CrmTrabalhoStatus>;
