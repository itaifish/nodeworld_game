/*
  Warnings:

  - You are about to drop the column `userId` on the `Base` table. All the data in the column will be lost.
  - The primary key for the `GuildMembership` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `GuildMembership` table. All the data in the column will be lost.
  - The primary key for the `Node` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Node` table. All the data in the column will be lost.
  - The primary key for the `UserMessageChannelLink` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `UserMessageChannelLink` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `GuildMembership` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `GuildMembership` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `userGalaxyInfoId` to the `GuildMembership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `galaxyId` to the `Node` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userGalaxyInfoId` to the `UserMessageChannelLink` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Base" DROP CONSTRAINT "Base_userId_fkey";

-- DropForeignKey
ALTER TABLE "GuildMembership" DROP CONSTRAINT "GuildMembership_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_userId_fkey";

-- DropForeignKey
ALTER TABLE "Node" DROP CONSTRAINT "Node_underAttackById_fkey";

-- DropForeignKey
ALTER TABLE "UserMessageChannelLink" DROP CONSTRAINT "UserMessageChannelLink_userId_fkey";

-- DropIndex
DROP INDEX "Base_userId_key";

-- DropIndex
DROP INDEX "Node_id_key";

-- DropIndex
DROP INDEX "Node_underAttackById_key";

-- DropIndex
DROP INDEX "Node_x_y_key";

-- AlterTable
ALTER TABLE "Base" DROP COLUMN "userId",
ADD COLUMN     "userGalaxyInfoId" TEXT;

-- AlterTable
ALTER TABLE "GuildMembership" DROP CONSTRAINT "GuildMembership_pkey",
DROP COLUMN "userId",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "userGalaxyInfoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "userGalaxyInfoId" TEXT;

-- AlterTable
ALTER TABLE "Node" DROP CONSTRAINT "Node_pkey",
DROP COLUMN "id",
ADD COLUMN     "galaxyId" TEXT NOT NULL,
ADD CONSTRAINT "Node_pkey" PRIMARY KEY ("x", "y", "galaxyId");

-- AlterTable
ALTER TABLE "UserMessageChannelLink" DROP CONSTRAINT "UserMessageChannelLink_pkey",
DROP COLUMN "userId",
ADD COLUMN     "userGalaxyInfoId" TEXT NOT NULL,
ADD CONSTRAINT "UserMessageChannelLink_pkey" PRIMARY KEY ("userGalaxyInfoId", "messageChannelId");

-- CreateTable
CREATE TABLE "Galaxy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxSize" INTEGER NOT NULL,

    CONSTRAINT "Galaxy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGalaxyInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "galaxyId" TEXT NOT NULL,

    CONSTRAINT "UserGalaxyInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Galaxy_id_key" ON "Galaxy"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Galaxy_name_key" ON "Galaxy"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserGalaxyInfo_id_key" ON "UserGalaxyInfo"("id");

-- CreateIndex
CREATE UNIQUE INDEX "GuildMembership_id_key" ON "GuildMembership"("id");

-- AddForeignKey
ALTER TABLE "Base" ADD CONSTRAINT "Base_userGalaxyInfoId_fkey" FOREIGN KEY ("userGalaxyInfoId") REFERENCES "UserGalaxyInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildMembership" ADD CONSTRAINT "GuildMembership_userGalaxyInfoId_fkey" FOREIGN KEY ("userGalaxyInfoId") REFERENCES "UserGalaxyInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_galaxyId_fkey" FOREIGN KEY ("galaxyId") REFERENCES "Galaxy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_underAttackById_fkey" FOREIGN KEY ("underAttackById") REFERENCES "UserGalaxyInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGalaxyInfo" ADD CONSTRAINT "UserGalaxyInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGalaxyInfo" ADD CONSTRAINT "UserGalaxyInfo_galaxyId_fkey" FOREIGN KEY ("galaxyId") REFERENCES "Galaxy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessageChannelLink" ADD CONSTRAINT "UserMessageChannelLink_userGalaxyInfoId_fkey" FOREIGN KEY ("userGalaxyInfoId") REFERENCES "UserGalaxyInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userGalaxyInfoId_fkey" FOREIGN KEY ("userGalaxyInfoId") REFERENCES "UserGalaxyInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
