import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { laborRateSchema } from "@/lib/validation";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rates = await prisma.laborRate.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(rates);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = laborRateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { code, name, hourlyCost, active } = parsed.data;

  const rate = await prisma.laborRate.create({
    data: {
      code: code || null,
      name,
      hourlyCost,
      active,
      ownerId: userId,
    },
  });

  return NextResponse.json(rate, { status: 201 });
}
