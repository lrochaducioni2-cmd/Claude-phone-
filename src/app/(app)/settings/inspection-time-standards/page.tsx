import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { InspectionTimeStandardsForm } from "@/components/inspection-time-standards-form";
import { inspectionAccessModeValues, inspectionLevelValues } from "@/lib/validation";

export default async function InspectionTimeStandardsPage() {
  const userId = await getCurrentUserId();

  let standards: { accessMode: string; inspectionLevel: string; minutesPerUnit: number }[] = [];

  if (userId) {
    const existing = await prisma.inspectionTimeStandard.findMany({ where: { ownerId: userId } });
    const existingKeys = new Set(existing.map((s) => `${s.accessMode}:${s.inspectionLevel}`));

    const missing = inspectionAccessModeValues.flatMap((accessMode) =>
      inspectionLevelValues
        .filter((inspectionLevel) => !existingKeys.has(`${accessMode}:${inspectionLevel}`))
        .map((inspectionLevel) => ({ ownerId: userId, accessMode, inspectionLevel, minutesPerUnit: 0 })),
    );

    if (missing.length > 0) {
      await prisma.inspectionTimeStandard.createMany({ data: missing });
    }

    standards = await prisma.inspectionTimeStandard.findMany({ where: { ownerId: userId } });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Tempo Padrão de Inspeção</h1>
      <p className="mt-1 max-w-xl text-sm text-slate-500">
        Minutos por equipamento, por combinação de modo de acesso × nível de inspeção. No
        orçamento, você só informa a quantidade de equipamentos e o sistema calcula as horas de
        campo automaticamente.
      </p>

      <InspectionTimeStandardsForm initialStandards={standards} />
    </div>
  );
}
