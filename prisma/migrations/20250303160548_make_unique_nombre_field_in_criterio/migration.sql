/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Criterio` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Criterio_nombre_key" ON "Criterio"("nombre");
