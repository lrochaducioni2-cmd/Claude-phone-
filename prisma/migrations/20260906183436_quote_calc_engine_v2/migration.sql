-- CreateEnum
CREATE TYPE "InspectionAccessMode" AS ENUM ('NIVEL_SOLO', 'COM_ESCADAS');

-- CreateEnum
CREATE TYPE "InspectionLevel" AS ENUM ('VISUAL', 'APURADA', 'DETALHADA');

-- AlterEnum
ALTER TYPE "QuoteType" ADD VALUE 'INSPECAO_DETALHADA';

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "marginPct",
DROP COLUMN "taxPct",
ADD COLUMN     "expenseMarginPct" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
ADD COLUMN     "fieldDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "issPct" DOUBLE PRECISION NOT NULL DEFAULT 0.07,
ADD COLUMN     "laborMarginPct" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "travelDays" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "TravelPolicy" DROP COLUMN "fuelDefault",
DROP COLUMN "kmRate",
ADD COLUMN     "defaultTravelDays" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "fuelPricePerLiter" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vehicleConsumptionKmPerLiter" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "LaborRate" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "hourlyCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaborRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTimeStandard" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "accessMode" "InspectionAccessMode" NOT NULL,
    "inspectionLevel" "InspectionLevel" NOT NULL,
    "minutesPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionTimeStandard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LaborRate_ownerId_idx" ON "LaborRate"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionTimeStandard_ownerId_accessMode_inspectionLevel_key" ON "InspectionTimeStandard"("ownerId", "accessMode", "inspectionLevel");

-- AddForeignKey
ALTER TABLE "LaborRate" ADD CONSTRAINT "LaborRate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTimeStandard" ADD CONSTRAINT "InspectionTimeStandard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

