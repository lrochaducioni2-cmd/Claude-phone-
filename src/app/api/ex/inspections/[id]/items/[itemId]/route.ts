import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { exInspectionItemUpdateSchema } from "@/lib/validation";
import { computeItemResult, getChecklist, type CheckAnswer } from "@/lib/ex-checklist";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id, itemId } = await params;
  const item = await prisma.exInspectionItem.findFirst({
    where: { id: itemId, inspectionId: id, inspection: { ownerId: userId } },
    include: { inspection: true },
  });
  if (!item) {
    return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
  }
  if (item.inspection.status === "CONCLUIDA") {
    return NextResponse.json(
      { error: "Inspeção concluída. Reabra a inspeção para editar." },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = exInspectionItemUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { answers, notes } = parsed.data;

  // Guarda só respostas de verificações que se aplicam a este item.
  const checklist = getChecklist(item.protectionTypes, item.inspection.level);
  const currentAnswers = (item.answers ?? {}) as Record<string, CheckAnswer>;
  const nextAnswers: Record<string, CheckAnswer> = {};
  for (const check of checklist) {
    const value = answers ? answers[check.id] : currentAnswers[check.id];
    if (value) nextAnswers[check.id] = value;
  }

  const updated = await prisma.exInspectionItem.update({
    where: { id: itemId },
    data: {
      answers: nextAnswers,
      result: computeItemResult(checklist, nextAnswers),
      ...(notes !== undefined && { notes: notes || null }),
    },
  });

  return NextResponse.json(updated);
}
