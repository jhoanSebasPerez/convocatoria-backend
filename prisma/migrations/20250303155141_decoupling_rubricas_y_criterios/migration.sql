/*
  Warnings:

  - You are about to drop the column `rubricaId` on the `Criterio` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Criterio" DROP CONSTRAINT "Criterio_rubricaId_fkey";

-- AlterTable
ALTER TABLE "Criterio" DROP COLUMN "rubricaId";

-- CreateTable
CREATE TABLE "_CriterioToRubrica" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CriterioToRubrica_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CriterioToRubrica_B_index" ON "_CriterioToRubrica"("B");

-- AddForeignKey
ALTER TABLE "_CriterioToRubrica" ADD CONSTRAINT "_CriterioToRubrica_A_fkey" FOREIGN KEY ("A") REFERENCES "Criterio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CriterioToRubrica" ADD CONSTRAINT "_CriterioToRubrica_B_fkey" FOREIGN KEY ("B") REFERENCES "Rubrica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
