import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { contactSchema } from "@/lib/validation";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const contacts = await prisma.contact.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, phone, company, notes, status } = parsed.data;

  const contact = await prisma.contact.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      notes: notes || null,
      status,
      ownerId: userId,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
