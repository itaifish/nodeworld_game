/*
  Warnings:

  - A unique constraint covering the columns `[userGalaxyInfoId]` on the table `Base` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,galaxyId]` on the table `UserGalaxyInfo` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userGalaxyInfoId` on table `Base` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Base" DROP CONSTRAINT "Base_userGalaxyInfoId_fkey";

-- AlterTable
ALTER TABLE "Base" ALTER COLUMN "userGalaxyInfoId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentGalaxyId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Base_userGalaxyInfoId_key" ON "Base"("userGalaxyInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGalaxyInfo_userId_galaxyId_key" ON "UserGalaxyInfo"("userId", "galaxyId");

-- AddForeignKey
ALTER TABLE "Base" ADD CONSTRAINT "Base_userGalaxyInfoId_fkey" FOREIGN KEY ("userGalaxyInfoId") REFERENCES "UserGalaxyInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentGalaxyId_fkey" FOREIGN KEY ("currentGalaxyId") REFERENCES "Galaxy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
