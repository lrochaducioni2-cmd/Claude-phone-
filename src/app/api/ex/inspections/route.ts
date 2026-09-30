import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { exInspectionSchema } from "@/lib/validation";
import { parseDateOnly } from "@/lib/ex-dates";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = exInspectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { facilityId, level, type, inspectorName, date, notes, trabalhoId, areaIds } = parsed.data;

  const facility = await prisma.exFacility.findFirst({
    where: { id: facilityId, ownerId: userId },
    include: {
      areas: {
        where: areaIds.length > 0 ? { id: { in: areaIds } } : undefined,
        orderBy: { name: "asc" },
        include: { equipment: { orderBy: { tag: "asc" } } },
      },
    },
  });
  if (!facility) {
    return NextResponse.json({ error: "Instalação não encontrada." }, { status: 404 });
  }

  if (trabalhoId) {
    const trabalho = await prisma.trabalho.findUnique({ where: { id: trabalhoId } });
    if (!trabalho) {
      return NextResponse.json({ error: "Trabalho não encontrado." }, { status: 400 });
    }
    if (trabalho.status !== "EM_EXECUCAO") {
      return NextResponse.json({ error: "Só é possível vincular trabalhos em execução." }, { status: 400 });
    }
    if (facility.empresaId && trabalho.empresaId !== facility.empresaId) {
      return NextResponse.json(
        { error: "O trabalho é de outra empresa, não da empresa desta instalação." },
        { status: 400 },
      );
    }
  }

  const parsedDate = date ? parseDateOnly(date) : new Date();
  if (!parsedDate) {
    return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  }

  const equipment = facility.areas.flatMap((area) =>
    area.equipment.map((eq) => ({ ...eq, areaName: area.name })),
  );
  if (equipment.length === 0) {
    return NextResponse.json(
      { error: "Nenhum equipamento cadastrado nas áreas selecionadas." },
      { status: 400 },
    );
  }

  const inspection = await prisma.exInspection.create({
    data: {
      facilityId,
      level,
      type,
      inspectorName: inspectorName || null,
      date: parsedDate,
      notes: notes || null,
      trabalhoId: trabalhoId || null,
      ownerId: userId,
      items: {
        create: equipment.map((eq, index) => ({
          equipmentId: eq.id,
          equipmentTag: eq.tag,
          equipmentDesc: eq.description,
          areaName: eq.areaName,
          protectionTypes: eq.protectionTypes,
          order: index,
        })),
      },
    },
  });

  return NextResponse.json(inspection, { status: 201 });
}
