import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { exFacilitySchema } from "@/lib/validation";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const facilities = await prisma.exFacility.findMany({
    where: { ownerId: userId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(facilities);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = exFacilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, location, notes, contactId } = parsed.data;

  if (contactId) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, ownerId: userId } });
    if (!contact) {
      return NextResponse.json({ error: "Contato não encontrado." }, { status: 400 });
    }
  }

  const facility = await prisma.exFacility.create({
    data: {
      name,
      location: location || null,
      notes: notes || null,
      contactId: contactId || null,
      ownerId: userId,
    },
  });

  return NextResponse.json(facility, { status: 201 });
}
