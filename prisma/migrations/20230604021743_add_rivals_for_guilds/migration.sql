/*
  Warnings:

  - A unique constraint covering the columns `[rivalGuildId]` on the table `Guild` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "rivalGuildId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Guild_rivalGuildId_key" ON "Guild"("rivalGuildId");

-- AddForeignKey
ALTER TABLE "Guild" ADD CONSTRAINT "Guild_rivalGuildId_fkey" FOREIGN KEY ("rivalGuildId") REFERENCES "Guild"("id") ON DELETE SET NULL ON UPDATE CASCADE;
