import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { TrabalhoClient } from "@/components/trabalho-client";

type Params = { params: Promise<{ id: string }> };

export default async function TrabalhoPage({ params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) notFound();

  const trabalho = await prisma.trabalho.findUnique({
    where: { id },
    include: {
      empresa: true,
      exInspections: {
        orderBy: { date: "desc" },
        include: {
          facility: { select: { id: true, name: true } },
          items: { select: { result: true } },
        },
      },
    },
  });
  if (!trabalho) notFound();

  const facilities = await prisma.exFacility.findMany({
    where: { empresaId: trabalho.empresaId, ownerId: userId },
    orderBy: { name: "asc" },
    include: { areas: { select: { _count: { select: { equipment: true } } } } },
  });

  const { empresa } = trabalho;

  return (
    <TrabalhoClient
      trabalho={{
        id: trabalho.id,
        crmId: trabalho.crmId,
        descricaoEscopo: trabalho.descricaoEscopo,
        valor: trabalho.valor,
        dataVenda: trabalho.dataVenda?.toISOString() ?? null,
        status: trabalho.status,
        crmStatus: trabalho.crmStatus,
        crmSyncError: trabalho.crmSyncError,
        dataEntrega: trabalho.dataEntrega?.toISOString() ?? null,
        linkRelatorio: trabalho.linkRelatorio,
        observacoes: trabalho.observacoes,
      }}
      empresa={{
        id: empresa.id,
        crmId: empresa.crmId,
        razaoSocial: empresa.razaoSocial,
        nomeFantasia: empresa.nomeFantasia,
        cnpj: empresa.cnpj,
        endereco: empresa.endereco,
        telefone: empresa.telefone,
        email: empresa.email,
        contatoResponsavel: empresa.contatoResponsavel,
      }}
      facilities={facilities.map((facility) => ({
        id: facility.id,
        name: facility.name,
        location: facility.location,
        equipmentCount: facility.areas.reduce((sum, area) => sum + area._count.equipment, 0),
      }))}
      inspections={trabalho.exInspections.map((inspection) => ({
        id: inspection.id,
        number: inspection.number,
        level: inspection.level,
        status: inspection.status,
        date: inspection.date.toISOString(),
        facility: inspection.facility,
        total: inspection.items.length,
        naoConforme: inspection.items.filter((item) => item.result === "NAO_CONFORME").length,
      }))}
    />
  );
}
