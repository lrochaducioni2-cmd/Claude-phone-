import { prisma } from "@/lib/prisma";
import {
  CrmError,
  getEmpresa,
  isCrmConfigured,
  listTrabalhosVendidos,
  type CrmTrabalho,
} from "@/lib/crm-client";
import { TrabalhosClient } from "@/components/trabalhos-client";

export default async function TrabalhosPage() {
  const locais = await prisma.trabalho.findMany({
    orderBy: [{ status: "asc" }, { importedAt: "desc" }],
    include: {
      empresa: { select: { razaoSocial: true, nomeFantasia: true } },
      exInspections: { select: { status: true } },
    },
  });

  // Consulta ao vivo o CRM; se falhar, a tela continua funcionando com os
  // trabalhos já importados e mostra o motivo.
  let vendidos: CrmTrabalho[] = [];
  let crmError: string | null = null;
  if (!isCrmConfigured()) {
    crmError = "Integração com o CRM não configurada (defina CRM_API_URL e CRM_API_TOKEN no .env).";
  } else {
    try {
      vendidos = await listTrabalhosVendidos();
    } catch (error) {
      crmError = error instanceof CrmError ? error.message : "Erro inesperado ao consultar o CRM.";
      if (!(error instanceof CrmError)) console.error(error);
    }
  }

  const importedCrmIds = new Set(locais.map((trabalho) => trabalho.crmId));
  const pendentes = vendidos.filter((trabalho) => !importedCrmIds.has(trabalho.id));

  // A listagem pode trazer só `empresa_id`: busca o nome de cada empresa
  // distinta (falha em uma delas não impede a tela).
  const nomes = new Map<string, string>();
  const semEmpresa = [...new Set(pendentes.filter((t) => !t.empresa).map((t) => t.empresa_id))];
  await Promise.all(
    semEmpresa.map(async (empresaId) => {
      try {
        const empresa = await getEmpresa(empresaId);
        nomes.set(empresaId, empresa.nome_fantasia || empresa.razao_social);
      } catch {
        // mantém "—" para esta empresa
      }
    }),
  );

  return (
    <TrabalhosClient
      crmError={crmError}
      disponiveis={pendentes.map((trabalho) => ({
        crmId: trabalho.id,
        descricaoEscopo: trabalho.descricao_escopo,
        valor: trabalho.valor,
        dataVenda: trabalho.data_venda,
        empresaNome: trabalho.empresa
          ? trabalho.empresa.nome_fantasia || trabalho.empresa.razao_social
          : (nomes.get(trabalho.empresa_id) ?? null),
      }))}
      locais={locais.map((trabalho) => ({
        id: trabalho.id,
        crmId: trabalho.crmId,
        descricaoEscopo: trabalho.descricaoEscopo,
        status: trabalho.status,
        empresa: trabalho.empresa,
        dataEntrega: trabalho.dataEntrega?.toISOString() ?? null,
        inspecoes: trabalho.exInspections.length,
        inspecoesConcluidas: trabalho.exInspections.filter((i) => i.status === "CONCLUIDA").length,
        avisoPendente: trabalho.crmStatus !== trabalho.status,
      }))}
    />
  );
}
