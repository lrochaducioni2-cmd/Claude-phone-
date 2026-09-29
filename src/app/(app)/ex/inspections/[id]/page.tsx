import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { ExInspectionClient } from "@/components/ex-inspection-client";
import { toDateInputValue } from "@/lib/ex-dates";
import type { CheckAnswer } from "@/lib/ex-checklist";

type Params = { params: Promise<{ id: string }> };

export default async function ExInspectionPage({ params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) notFound();

  const inspection = await prisma.exInspection.findFirst({
    where: { id, ownerId: userId },
    include: {
      facility: { select: { id: true, name: true } },
      quote: { select: { id: true, number: true, title: true } },
      items: { orderBy: { order: "asc" } },
    },
  });
  if (!inspection) notFound();

  return (
    <ExInspectionClient
      inspection={{
        id: inspection.id,
        number: inspection.number,
        level: inspection.level,
        type: inspection.type,
        status: inspection.status,
        date: toDateInputValue(inspection.date),
        inspectorName: inspection.inspectorName ?? "",
        notes: inspection.notes ?? "",
        facility: inspection.facility,
        quote: inspection.quote,
      }}
      items={inspection.items.map((item) => ({
        id: item.id,
        equipmentTag: item.equipmentTag,
        equipmentDesc: item.equipmentDesc,
        areaName: item.areaName,
        protectionTypes: item.protectionTypes,
        answers: (item.answers ?? {}) as Record<string, CheckAnswer>,
        result: item.result,
        notes: item.notes ?? "",
      }))}
    />
  );
}
