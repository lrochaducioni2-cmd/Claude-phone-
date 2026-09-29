import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { ExFacilityClient } from "@/components/ex-facility-client";

type Params = { params: Promise<{ id: string }> };

export default async function ExFacilityPage({ params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) notFound();

  const facility = await prisma.exFacility.findFirst({
    where: { id, ownerId: userId },
    include: {
      contact: { select: { name: true, company: true } },
      areas: {
        orderBy: { name: "asc" },
        include: { equipment: { orderBy: { tag: "asc" } } },
      },
      inspections: {
        orderBy: { date: "desc" },
        include: { items: { select: { result: true } } },
      },
    },
  });
  if (!facility) notFound();

  const [contacts, quotes] = await Promise.all([
    prisma.contact.findMany({
      where: { ownerId: userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
    prisma.quote.findMany({
      where: { ownerId: userId, ...(facility.contactId && { contactId: facility.contactId }) },
      orderBy: { number: "desc" },
      select: { id: true, number: true, title: true },
    }),
  ]);

  return (
    <ExFacilityClient
      facility={{
        id: facility.id,
        name: facility.name,
        location: facility.location,
        notes: facility.notes,
        contactId: facility.contactId,
        contact: facility.contact,
      }}
      areas={facility.areas}
      inspections={facility.inspections.map((inspection) => ({
        id: inspection.id,
        number: inspection.number,
        level: inspection.level,
        type: inspection.type,
        status: inspection.status,
        date: inspection.date.toISOString(),
        inspectorName: inspection.inspectorName,
        total: inspection.items.length,
        conforme: inspection.items.filter((item) => item.result === "CONFORME").length,
        naoConforme: inspection.items.filter((item) => item.result === "NAO_CONFORME").length,
      }))}
      contacts={contacts}
      quotes={quotes}
    />
  );
}
