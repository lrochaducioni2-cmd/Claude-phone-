import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { TravelPolicyForm } from "@/components/travel-policy-form";

export default async function TravelPolicyPage() {
  const userId = await getCurrentUserId();

  const policy = userId
    ? await prisma.travelPolicy.upsert({
        where: { ownerId: userId },
        update: {},
        create: { ownerId: userId },
      })
    : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Política de Viagem</h1>
      <p className="mt-1 text-sm text-slate-500">
        Valores padrão usados para calcular despesa de deslocamento nos orçamentos, saindo de{" "}
        {policy?.originCity ?? "Criciúma/SC"}.
      </p>

      <TravelPolicyForm
        initialValues={{
          originCity: policy?.originCity ?? "Criciúma/SC",
          dailyHotelRate: String(policy?.dailyHotelRate ?? 0),
          dailyMealRate: String(policy?.dailyMealRate ?? 0),
          defaultTravelDays: String(policy?.defaultTravelDays ?? 1),
          fuelPricePerLiter: String(policy?.fuelPricePerLiter ?? 0),
          vehicleConsumptionKmPerLiter: String(policy?.vehicleConsumptionKmPerLiter ?? 10),
          flightTicketDefault: String(policy?.flightTicketDefault ?? 0),
          rentalCarDailyRate: String(policy?.rentalCarDailyRate ?? 0),
          parkingDefault: String(policy?.parkingDefault ?? 0),
        }}
      />
    </div>
  );
}
