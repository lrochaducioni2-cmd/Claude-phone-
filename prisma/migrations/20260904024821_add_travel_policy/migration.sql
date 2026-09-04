-- CreateTable
CREATE TABLE "TravelPolicy" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "originCity" TEXT NOT NULL DEFAULT 'Criciúma/SC',
    "dailyHotelRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyMealRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kmRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flightTicketDefault" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rentalCarDailyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuelDefault" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parkingDefault" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TravelPolicy_ownerId_key" ON "TravelPolicy"("ownerId");

-- AddForeignKey
ALTER TABLE "TravelPolicy" ADD CONSTRAINT "TravelPolicy_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
