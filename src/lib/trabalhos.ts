// Fluxo de trabalho com o CRM:
//   1. importar  — puxa trabalho "vendido" + empresa da API do CRM, grava a
//                  cópia local e avisa o CRM que passou a "em_execucao";
//   2. executar  — inspeções Ex vinculadas ao trabalho (lógica toda aqui);
//   3. entregar  — com as inspeções concluídas, marca "entregue" e avisa o
//                  CRM com data de entrega e link do relatório.
//
// O estado local é gravado ANTES de avisar o CRM. Se o aviso falhar (CRM
// fora do ar, token inválido...), o erro fica em `crmSyncError` e o status
// confirmado continua em `crmStatus` — a tela oferece "Reenviar ao CRM".
// Assim uma falha de rede nunca desfaz trabalho de campo já registrado.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CrmError,
  LOCAL_TO_CRM_STATUS,
  empresaFromCrm,
  getEmpresa,
  getTrabalho,
  parseCrmDate,
  updateTrabalhoStatus,
  type CrmStatusUpdate,
} from "@/lib/crm-client";
import { toDateInputValue } from "@/lib/ex-dates";

export class TrabalhoError extends Error {
  constructor(
    message: string,
    readonly httpStatus = 400,
  ) {
    super(message);
    this.name = "TrabalhoError";
  }
}

/** Link que vai para o CRM em `link_relatorio`. */
export function reportLink(trabalhoId: string): string | null {
  const base = process.env.APP_BASE_URL?.replace(/\/+$/, "");
  return base ? `${base}/trabalhos/${trabalhoId}` : null;
}

/** Importa (ou reimporta, de forma idempotente) um trabalho do CRM. */
export async function importTrabalho(crmTrabalhoId: string) {
  const existing = await prisma.trabalho.findUnique({ where: { crmId: crmTrabalhoId } });
  if (existing) return existing;

  const crmTrabalho = await getTrabalho(crmTrabalhoId);
  // "em_execucao" também é aceito: cobre o caso de o CRM já ter recebido o
  // aviso numa tentativa anterior cuja gravação local não chegou ao fim.
  if (crmTrabalho.status !== "vendido" && crmTrabalho.status !== "em_execucao") {
    throw new TrabalhoError(`Trabalho está como "${crmTrabalho.status}" no CRM — só trabalhos vendidos podem ser executados.`);
  }

  const crmEmpresa = crmTrabalho.empresa ?? (await getEmpresa(crmTrabalho.empresa_id));
  const empresaData = empresaFromCrm(crmEmpresa);

  let trabalho;
  try {
    trabalho = await prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.upsert({
      where: { crmId: empresaData.crmId },
      create: empresaData,
      update: empresaData,
    });
    return tx.trabalho.create({
      data: {
        crmId: crmTrabalho.id,
        empresaId: empresa.id,
        descricaoEscopo: crmTrabalho.descricao_escopo,
        valor: crmTrabalho.valor,
        dataVenda: parseCrmDate(crmTrabalho.data_venda),
        status: "EM_EXECUCAO",
        crmStatus: crmTrabalho.status === "em_execucao" ? "EM_EXECUCAO" : "VENDIDO",
      },
    });
    });
  } catch (error) {
    // Duas importações simultâneas do mesmo trabalho: a segunda perde no
    // índice único de crmId e devolve o que a primeira gravou.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.trabalho.findUniqueOrThrow({ where: { crmId: crmTrabalhoId } });
    }
    throw error;
  }

  return trabalho.crmStatus === trabalho.status ? trabalho : pushStatusToCrm(trabalho.id);
}

/**
 * Envia ao CRM o status local atual do trabalho. Nunca lança por falha do
 * CRM: registra o erro em `crmSyncError` e devolve o trabalho atualizado.
 */
export async function pushStatusToCrm(trabalhoId: string) {
  const trabalho = await prisma.trabalho.findUniqueOrThrow({ where: { id: trabalhoId } });

  const update: CrmStatusUpdate = { status: LOCAL_TO_CRM_STATUS[trabalho.status] };
  if (trabalho.status === "ENTREGUE") {
    if (trabalho.dataEntrega) update.data_entrega = toDateInputValue(trabalho.dataEntrega);
    if (trabalho.linkRelatorio) update.link_relatorio = trabalho.linkRelatorio;
    if (trabalho.observacoes) update.observacoes = trabalho.observacoes;
  }

  try {
    await updateTrabalhoStatus(trabalho.crmId, update);
    return prisma.trabalho.update({
      where: { id: trabalhoId },
      data: { crmStatus: trabalho.status, crmSyncError: null },
    });
  } catch (error) {
    const message = error instanceof CrmError ? error.message : "Erro inesperado ao avisar o CRM.";
    if (!(error instanceof CrmError)) console.error("pushStatusToCrm", error);
    return prisma.trabalho.update({ where: { id: trabalhoId }, data: { crmSyncError: message } });
  }
}

/** Marca o trabalho como entregue (exige inspeções concluídas) e avisa o CRM. */
export async function deliverTrabalho(
  trabalhoId: string,
  { dataEntrega, observacoes }: { dataEntrega: Date; observacoes: string | null },
) {
  const trabalho = await prisma.trabalho.findUnique({
    where: { id: trabalhoId },
    include: { exInspections: { select: { status: true } } },
  });
  if (!trabalho) throw new TrabalhoError("Trabalho não encontrado.", 404);
  if (trabalho.status !== "EM_EXECUCAO") {
    throw new TrabalhoError("Só trabalhos em execução podem ser entregues.", 409);
  }
  if (trabalho.exInspections.length === 0) {
    throw new TrabalhoError("Vincule ao menos uma inspeção a este trabalho antes de entregar.", 409);
  }
  const open = trabalho.exInspections.filter((inspection) => inspection.status !== "CONCLUIDA").length;
  if (open > 0) {
    throw new TrabalhoError(`Ainda há ${open} inspeção(ões) em andamento. Conclua todas antes de entregar.`, 409);
  }

  await prisma.trabalho.update({
    where: { id: trabalhoId },
    data: { status: "ENTREGUE", dataEntrega, observacoes, linkRelatorio: reportLink(trabalhoId) },
  });
  return pushStatusToCrm(trabalhoId);
}
