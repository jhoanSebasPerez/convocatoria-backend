/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Rubrica` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Rubrica_nombre_key" ON "Rubrica"("nombre");
