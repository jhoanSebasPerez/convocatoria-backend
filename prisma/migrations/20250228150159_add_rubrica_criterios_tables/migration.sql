/*
  Warnings:

  - A unique constraint covering the columns `[rubricaId]` on the table `Convocatoria` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Convocatoria" ADD COLUMN     "rubricaId" TEXT;

-- CreateTable
CREATE TABLE "Rubrica" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rubrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criterio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "puntajeMax" INTEGER NOT NULL,
    "puntajeMin" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "rubricaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Criterio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Convocatoria_rubricaId_key" ON "Convocatoria"("rubricaId");

-- AddForeignKey
ALTER TABLE "Convocatoria" ADD CONSTRAINT "Convocatoria_rubricaId_fkey" FOREIGN KEY ("rubricaId") REFERENCES "Rubrica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Criterio" ADD CONSTRAINT "Criterio_rubricaId_fkey" FOREIGN KEY ("rubricaId") REFERENCES "Rubrica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
