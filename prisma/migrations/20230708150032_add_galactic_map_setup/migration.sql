/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Terrain" AS ENUM ('MOUNTANS', 'MEADOWS', 'RADIOACTIVE', 'CAVES', 'DESERT');

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "guildId" TEXT,
    "baseId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "terrain" "Terrain"[],
    "takenOverAt" TIMESTAMP(3),
    "underAttackById" TEXT,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Node_id_key" ON "Node"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Node_baseId_key" ON "Node"("baseId");

-- CreateIndex
CREATE UNIQUE INDEX "Node_underAttackById_key" ON "Node"("underAttackById");

-- CreateIndex
CREATE UNIQUE INDEX "Node_x_y_key" ON "Node"("x", "y");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_key" ON "Account"("userId");

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_underAttackById_fkey" FOREIGN KEY ("underAttackById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
