import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { ExFacilityClient } from "@/components/ex-facility-client";

type Params = { params: Promise<{ id: string }> };

export default async function ExFacilityPage({ params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) notFound();

  const facility = await prisma.exFacility.findFirst({
    where: { id, ownerId: userId },
    include: {
      empresa: { select: { razaoSocial: true, nomeFantasia: true } },
      areas: {
        orderBy: { name: "asc" },
        include: { equipment: { orderBy: { tag: "asc" } } },
      },
      inspections: {
        orderBy: { date: "desc" },
        include: { items: { select: { result: true } } },
      },
    },
  });
  if (!facility) notFound();

  const [empresas, trabalhos] = await Promise.all([
    prisma.empresa.findMany({
      orderBy: { razaoSocial: "asc" },
      select: { id: true, razaoSocial: true, nomeFantasia: true },
    }),
    // Só trabalhos em execução da empresa desta instalação podem receber inspeções.
    prisma.trabalho.findMany({
      where: { status: "EM_EXECUCAO", ...(facility.empresaId && { empresaId: facility.empresaId }) },
      orderBy: { importedAt: "desc" },
      select: { id: true, crmId: true, descricaoEscopo: true },
    }),
  ]);

  return (
    <ExFacilityClient
      facility={{
        id: facility.id,
        name: facility.name,
        location: facility.location,
        notes: facility.notes,
        empresaId: facility.empresaId,
        empresa: facility.empresa,
      }}
      areas={facility.areas}
      inspections={facility.inspections.map((inspection) => ({
        id: inspection.id,
        number: inspection.number,
        level: inspection.level,
        type: inspection.type,
        status: inspection.status,
        date: inspection.date.toISOString(),
        inspectorName: inspection.inspectorName,
        total: inspection.items.length,
        conforme: inspection.items.filter((item) => item.result === "CONFORME").length,
        naoConforme: inspection.items.filter((item) => item.result === "NAO_CONFORME").length,
      }))}
      empresas={empresas}
      trabalhos={trabalhos}
    />
  );
}
