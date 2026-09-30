import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { exInspectionUpdateSchema } from "@/lib/validation";
import { parseDateOnly } from "@/lib/ex-dates";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.exInspection.findFirst({
    where: { id, ownerId: userId },
    include: { trabalho: { select: { status: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 });
  }
  if (existing.trabalho?.status === "ENTREGUE") {
    return NextResponse.json(
      { error: "O trabalho desta inspeção já foi entregue ao cliente; ela não pode mais ser alterada." },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = exInspectionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { status, type, inspectorName, date, notes } = parsed.data;

  let parsedDate: Date | undefined;
  if (date) {
    const value = parseDateOnly(date);
    if (!value) {
      return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    }
    parsedDate = value;
  }

  const inspection = await prisma.exInspection.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(type !== undefined && { type }),
      ...(inspectorName !== undefined && { inspectorName: inspectorName || null }),
      ...(parsedDate && { date: parsedDate }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  });

  return NextResponse.json(inspection);
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.exInspection.findFirst({
    where: { id, ownerId: userId },
    include: { trabalho: { select: { status: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 });
  }
  if (existing.trabalho?.status === "ENTREGUE") {
    return NextResponse.json(
      { error: "O trabalho desta inspeção já foi entregue ao cliente; ela não pode ser excluída." },
      { status: 409 },
    );
  }

  await prisma.exInspection.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
