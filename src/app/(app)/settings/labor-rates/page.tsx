import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { LaborRatesClient } from "@/components/labor-rates-client";

export default async function LaborRatesPage() {
  const userId = await getCurrentUserId();

  const rates = userId
    ? await prisma.laborRate.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return <LaborRatesClient rates={rates} />;
}
