import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import {
  inspectionAccessModeValues,
  inspectionLevelValues,
  inspectionTimeStandardSchema,
} from "@/lib/validation";

// As 6 combinações possíveis (2 modos de acesso × 3 níveis de inspeção)
// sempre existem para o usuário — criadas com 0 min na primeira leitura.
async function ensureAllCombinations(userId: string) {
  const existing = await prisma.inspectionTimeStandard.findMany({ where: { ownerId: userId } });
  const existingKeys = new Set(existing.map((s) => `${s.accessMode}:${s.inspectionLevel}`));

  const missing = inspectionAccessModeValues.flatMap((accessMode) =>
    inspectionLevelValues
      .filter((inspectionLevel) => !existingKeys.has(`${accessMode}:${inspectionLevel}`))
      .map((inspectionLevel) => ({ ownerId: userId, accessMode, inspectionLevel, minutesPerUnit: 0 })),
  );

  if (missing.length > 0) {
    await prisma.inspectionTimeStandard.createMany({ data: missing });
    return prisma.inspectionTimeStandard.findMany({ where: { ownerId: userId } });
  }

  return existing;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const standards = await ensureAllCombinations(userId);
  return NextResponse.json(standards);
}

export async function PUT(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 });
  }

  const parsedItems = [];
  for (const item of body) {
    const parsed = inspectionTimeStandardSchema.safeParse(item);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    parsedItems.push(parsed.data);
  }

  await prisma.$transaction(
    parsedItems.map((item) =>
      prisma.inspectionTimeStandard.upsert({
        where: {
          ownerId_accessMode_inspectionLevel: {
            ownerId: userId,
            accessMode: item.accessMode,
            inspectionLevel: item.inspectionLevel,
          },
        },
        update: { minutesPerUnit: item.minutesPerUnit },
        create: { ownerId: userId, ...item },
      }),
    ),
  );

  const standards = await prisma.inspectionTimeStandard.findMany({ where: { ownerId: userId } });
  return NextResponse.json(standards);
}
