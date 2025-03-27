/*
  Warnings:

  - A unique constraint covering the columns `[proyectoAulaId]` on the table `Proyecto` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[proyectoSemilleroId]` on the table `Proyecto` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[proyectoId]` on the table `ProyectoAula` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[proyectoId]` on the table `ProyectoSemillero` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN     "proyectoAulaId" TEXT,
ADD COLUMN     "proyectoSemilleroId" TEXT;

-- AlterTable
ALTER TABLE "ProyectoAula" ADD COLUMN     "proyectoId" TEXT;

-- AlterTable
ALTER TABLE "ProyectoSemillero" ADD COLUMN     "proyectoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_proyectoAulaId_key" ON "Proyecto"("proyectoAulaId");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_proyectoSemilleroId_key" ON "Proyecto"("proyectoSemilleroId");

-- CreateIndex
CREATE UNIQUE INDEX "ProyectoAula_proyectoId_key" ON "ProyectoAula"("proyectoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProyectoSemillero_proyectoId_key" ON "ProyectoSemillero"("proyectoId");

-- AddForeignKey
ALTER TABLE "ProyectoAula" ADD CONSTRAINT "ProyectoAula_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoSemillero" ADD CONSTRAINT "ProyectoSemillero_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
