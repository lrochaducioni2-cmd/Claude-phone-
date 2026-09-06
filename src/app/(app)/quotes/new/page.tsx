import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { QuoteForm } from "@/components/quote-form";
import { inspectionAccessModeValues, inspectionLevelValues } from "@/lib/validation";

export default async function NewQuotePage() {
  const userId = await getCurrentUserId();

  const [contacts, laborRates, policy, existingStandards] = userId
    ? await Promise.all([
        prisma.contact.findMany({ where: { ownerId: userId }, orderBy: { name: "asc" } }),
        prisma.laborRate.findMany({
          where: { ownerId: userId, active: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.travelPolicy.upsert({
          where: { ownerId: userId },
          update: {},
          create: { ownerId: userId },
        }),
        prisma.inspectionTimeStandard.findMany({ where: { ownerId: userId } }),
      ])
    : [[], [], null, []];

  const existingKeys = new Set(existingStandards.map((s) => `${s.accessMode}:${s.inspectionLevel}`));
  const inspectionStandards = [
    ...existingStandards,
    ...inspectionAccessModeValues.flatMap((accessMode) =>
      inspectionLevelValues
        .filter((inspectionLevel) => !existingKeys.has(`${accessMode}:${inspectionLevel}`))
        .map((inspectionLevel) => ({ accessMode, inspectionLevel, minutesPerUnit: 0 })),
    ),
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Novo Orçamento</h1>
      <p className="mt-1 text-sm text-slate-500">
        Os valores de despesa já vêm preenchidos pela Política de Viagem — edite apenas o que for
        diferente deste orçamento.
      </p>

      {contacts.length === 0 ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Cadastre pelo menos um contato antes de criar um orçamento.
        </p>
      ) : (
        <QuoteForm
          contacts={contacts.map((c) => ({ id: c.id, name: c.name, company: c.company }))}
          laborRates={laborRates.map((r) => ({ id: r.id, name: r.name, hourlyCost: r.hourlyCost }))}
          travelPolicy={{
            dailyHotelRate: policy?.dailyHotelRate ?? 0,
            lunchRate: policy?.lunchRate ?? 0,
            dinnerRate: policy?.dinnerRate ?? 0,
            defaultTravelDays: policy?.defaultTravelDays ?? 1,
            fuelPricePerLiter: policy?.fuelPricePerLiter ?? 0,
            vehicleConsumptionKmPerLiter: policy?.vehicleConsumptionKmPerLiter ?? 10,
            flightTicketDefault: policy?.flightTicketDefault ?? 0,
            rentalCarDailyRate: policy?.rentalCarDailyRate ?? 0,
            parkingDefault: policy?.parkingDefault ?? 0,
          }}
          inspectionStandards={inspectionStandards}
        />
      )}
    </div>
  );
}
