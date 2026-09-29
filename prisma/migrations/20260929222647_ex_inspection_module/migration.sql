-- CreateEnum
CREATE TYPE "ExAtmosphere" AS ENUM ('GAS', 'POEIRA');

-- CreateEnum
CREATE TYPE "ExZone" AS ENUM ('ZONA_0', 'ZONA_1', 'ZONA_2', 'ZONA_20', 'ZONA_21', 'ZONA_22');

-- CreateEnum
CREATE TYPE "ExGroup" AS ENUM ('II', 'IIA', 'IIB', 'IIC', 'III', 'IIIA', 'IIIB', 'IIIC');

-- CreateEnum
CREATE TYPE "ExTemperatureClass" AS ENUM ('T1', 'T2', 'T3', 'T4', 'T5', 'T6');

-- CreateEnum
CREATE TYPE "ExEpl" AS ENUM ('Ga', 'Gb', 'Gc', 'Da', 'Db', 'Dc');

-- CreateEnum
CREATE TYPE "ExProtectionType" AS ENUM ('D', 'E', 'I', 'N', 'P', 'M', 'O', 'Q', 'T', 'S');

-- CreateEnum
CREATE TYPE "ExInspectionType" AS ENUM ('INICIAL', 'PERIODICA', 'AMOSTRAGEM');

-- CreateEnum
CREATE TYPE "ExInspectionStatus" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "ExItemResult" AS ENUM ('PENDENTE', 'CONFORME', 'NAO_CONFORME');

-- CreateTable
CREATE TABLE "ExFacility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "contactId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExArea" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "atmosphere" "ExAtmosphere" NOT NULL DEFAULT 'GAS',
    "zone" "ExZone" NOT NULL,
    "group" "ExGroup",
    "temperatureClass" "ExTemperatureClass",
    "maxSurfaceTempC" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExEquipment" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "marking" TEXT,
    "protectionTypes" "ExProtectionType"[],
    "group" "ExGroup",
    "temperatureClass" "ExTemperatureClass",
    "maxSurfaceTempC" DOUBLE PRECISION,
    "epl" "ExEpl",
    "ipRating" TEXT,
    "certificateNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExInspection" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "facilityId" TEXT NOT NULL,
    "level" "InspectionLevel" NOT NULL,
    "type" "ExInspectionType" NOT NULL DEFAULT 'PERIODICA',
    "status" "ExInspectionStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "inspectorName" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "quoteId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExInspectionItem" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "equipmentTag" TEXT NOT NULL,
    "equipmentDesc" TEXT NOT NULL,
    "areaName" TEXT NOT NULL,
    "protectionTypes" "ExProtectionType"[],
    "answers" JSONB NOT NULL DEFAULT '{}',
    "result" "ExItemResult" NOT NULL DEFAULT 'PENDENTE',
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExInspectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExFacility_ownerId_idx" ON "ExFacility"("ownerId");

-- CreateIndex
CREATE INDEX "ExFacility_contactId_idx" ON "ExFacility"("contactId");

-- CreateIndex
CREATE INDEX "ExArea_facilityId_idx" ON "ExArea"("facilityId");

-- CreateIndex
CREATE INDEX "ExEquipment_areaId_idx" ON "ExEquipment"("areaId");

-- CreateIndex
CREATE INDEX "ExInspection_facilityId_idx" ON "ExInspection"("facilityId");

-- CreateIndex
CREATE INDEX "ExInspection_ownerId_idx" ON "ExInspection"("ownerId");

-- CreateIndex
CREATE INDEX "ExInspection_quoteId_idx" ON "ExInspection"("quoteId");

-- CreateIndex
CREATE INDEX "ExInspectionItem_inspectionId_idx" ON "ExInspectionItem"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExInspectionItem_inspectionId_equipmentId_key" ON "ExInspectionItem"("inspectionId", "equipmentId");

-- AddForeignKey
ALTER TABLE "ExFacility" ADD CONSTRAINT "ExFacility_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExFacility" ADD CONSTRAINT "ExFacility_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExArea" ADD CONSTRAINT "ExArea_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "ExFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExEquipment" ADD CONSTRAINT "ExEquipment_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "ExArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExInspection" ADD CONSTRAINT "ExInspection_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "ExFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExInspection" ADD CONSTRAINT "ExInspection_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExInspection" ADD CONSTRAINT "ExInspection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExInspectionItem" ADD CONSTRAINT "ExInspectionItem_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "ExInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExInspectionItem" ADD CONSTRAINT "ExInspectionItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "ExEquipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
