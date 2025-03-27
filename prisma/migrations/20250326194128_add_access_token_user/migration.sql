/*
  Warnings:

  - You are about to drop the column `activationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `activationTokenExpires` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accessToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_activationToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "activationToken",
DROP COLUMN "activationTokenExpires",
ADD COLUMN     "accessToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_accessToken_key" ON "User"("accessToken");
