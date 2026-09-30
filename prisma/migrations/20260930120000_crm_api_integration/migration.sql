-- CreateEnum
CREATE TYPE "TrabalhoStatus" AS ENUM ('VENDIDO', 'EM_EXECUCAO', 'ENTREGUE', 'CANCELADO');

-- DropForeignKey
ALTER TABLE "ExFacility" DROP CONSTRAINT "ExFacility_contactId_fkey";

-- DropForeignKey
ALTER TABLE "ExInspection" DROP CONSTRAINT "ExInspection_quoteId_fkey";

-- DropIndex
DROP INDEX "ExFacility_contactId_idx";

-- DropIndex
DROP INDEX "ExInspection_quoteId_idx";

-- AlterTable
ALTER TABLE "ExFacility" DROP COLUMN "contactId",
ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "ExInspection" DROP COLUMN "quoteId",
ADD COLUMN     "trabalhoId" TEXT;

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "crmId" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "contatoResponsavel" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trabalho" (
    "id" TEXT NOT NULL,
    "crmId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "descricaoEscopo" TEXT NOT NULL,
    "valor" DOUBLE PRECISION,
    "dataVenda" TIMESTAMP(3),
    "status" "TrabalhoStatus" NOT NULL DEFAULT 'EM_EXECUCAO',
    "dataEntrega" TIMESTAMP(3),
    "linkRelatorio" TEXT,
    "observacoes" TEXT,
    "crmStatus" "TrabalhoStatus" NOT NULL DEFAULT 'VENDIDO',
    "crmSyncError" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trabalho_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_crmId_key" ON "Empresa"("crmId");

-- CreateIndex
CREATE UNIQUE INDEX "Trabalho_crmId_key" ON "Trabalho"("crmId");

-- CreateIndex
CREATE INDEX "Trabalho_empresaId_idx" ON "Trabalho"("empresaId");

-- CreateIndex
CREATE INDEX "ExFacility_empresaId_idx" ON "ExFacility"("empresaId");

-- CreateIndex
CREATE INDEX "ExInspection_trabalhoId_idx" ON "ExInspection"("trabalhoId");

-- AddForeignKey
ALTER TABLE "ExFacility" ADD CONSTRAINT "ExFacility_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExInspection" ADD CONSTRAINT "ExInspection_trabalhoId_fkey" FOREIGN KEY ("trabalhoId") REFERENCES "Trabalho"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trabalho" ADD CONSTRAINT "Trabalho_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

