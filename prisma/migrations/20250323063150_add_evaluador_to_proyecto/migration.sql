/*
  Warnings:

  - A unique constraint covering the columns `[evaluadorId]` on the table `Proyecto` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `evaluadorId` to the `Evaluacion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Evaluacion" ADD COLUMN     "evaluadorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN     "evaluadorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_evaluadorId_key" ON "Proyecto"("evaluadorId");

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_evaluadorId_fkey" FOREIGN KEY ("evaluadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
