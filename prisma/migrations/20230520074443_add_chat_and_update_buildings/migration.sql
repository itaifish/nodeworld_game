/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Base` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Building` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `InventoryItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "lastHarvest" DROP NOT NULL,
ALTER COLUMN "lastHarvest" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "imageURL" TEXT,
    "messageChannelId" TEXT NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildMembership" (
    "guildId" TEXT,
    "userId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GuildMembership_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "MessageChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MessageChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMessageChannelLink" (
    "userId" TEXT NOT NULL,
    "messageChannelId" TEXT NOT NULL,

    CONSTRAINT "UserMessageChannelLink_pkey" PRIMARY KEY ("userId","messageChannelId")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "text" VARCHAR(500) NOT NULL,
    "messageChannelId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guild_id_key" ON "Guild"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MessageChannel_id_key" ON "MessageChannel"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Message_id_key" ON "Message"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Account_id_key" ON "Account"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Base_id_key" ON "Base"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Building_id_key" ON "Building"("id");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_id_key" ON "InventoryItem"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_id_key" ON "Resource"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_id_key" ON "Unit"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- AddForeignKey
ALTER TABLE "Guild" ADD CONSTRAINT "Guild_messageChannelId_fkey" FOREIGN KEY ("messageChannelId") REFERENCES "MessageChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildMembership" ADD CONSTRAINT "GuildMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildMembership" ADD CONSTRAINT "GuildMembership_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessageChannelLink" ADD CONSTRAINT "UserMessageChannelLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessageChannelLink" ADD CONSTRAINT "UserMessageChannelLink_messageChannelId_fkey" FOREIGN KEY ("messageChannelId") REFERENCES "MessageChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_messageChannelId_fkey" FOREIGN KEY ("messageChannelId") REFERENCES "MessageChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
