import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { travelPolicySchema } from "@/lib/validation";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const policy = await prisma.travelPolicy.upsert({
    where: { ownerId: userId },
    update: {},
    create: { ownerId: userId },
  });

  return NextResponse.json(policy);
}

export async function PUT(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = travelPolicySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const policy = await prisma.travelPolicy.upsert({
    where: { ownerId: userId },
    update: parsed.data,
    create: { ownerId: userId, ...parsed.data },
  });

  return NextResponse.json(policy);
}
