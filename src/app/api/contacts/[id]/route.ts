import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { contactSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const contact = await prisma.contact.findFirst({ where: { id, ownerId: userId } });
  if (!contact) {
    return NextResponse.json({ error: "Contato não encontrado." }, { status: 404 });
  }

  return NextResponse.json(contact);
}

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.contact.findFirst({ where: { id, ownerId: userId } });
  if (!existing) {
    return NextResponse.json({ error: "Contato não encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, phone, company, notes, status } = parsed.data;

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email: email || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(company !== undefined && { company: company || null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json(contact);
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.contact.findFirst({ where: { id, ownerId: userId } });
  if (!existing) {
    return NextResponse.json({ error: "Contato não encontrado." }, { status: 404 });
  }

  await prisma.contact.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
