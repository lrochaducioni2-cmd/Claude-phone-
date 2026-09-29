import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { ExFacilitiesClient } from "@/components/ex-facilities-client";

export default async function ExFacilitiesPage() {
  const userId = await getCurrentUserId();

  const [facilities, contacts] = userId
    ? await Promise.all([
        prisma.exFacility.findMany({
          where: { ownerId: userId },
          orderBy: { name: "asc" },
          include: {
            contact: { select: { name: true, company: true } },
            areas: { select: { _count: { select: { equipment: true } } } },
            inspections: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
          },
        }),
        prisma.contact.findMany({
          where: { ownerId: userId },
          orderBy: { name: "asc" },
          select: { id: true, name: true, company: true },
        }),
      ])
    : [[], []];

  const rows = facilities.map((facility) => ({
    id: facility.id,
    name: facility.name,
    location: facility.location,
    notes: facility.notes,
    contactId: facility.contactId,
    contact: facility.contact,
    areaCount: facility.areas.length,
    equipmentCount: facility.areas.reduce((sum, area) => sum + area._count.equipment, 0),
    lastInspection: facility.inspections[0]?.date.toISOString() ?? null,
  }));

  return <ExFacilitiesClient facilities={rows} contacts={contacts} />;
}
