-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Building_Type" ADD VALUE 'RESEARCH_LAB';
ALTER TYPE "Building_Type" ADD VALUE 'UNIVERSITY';
ALTER TYPE "Building_Type" ADD VALUE 'AEROSPACE_DEPOT';
ALTER TYPE "Building_Type" ADD VALUE 'SCATTERGUN_TURRET';
ALTER TYPE "Building_Type" ADD VALUE 'ANTI_AIRCRAFT_TURRET';
ALTER TYPE "Building_Type" ADD VALUE 'ENERGY_SHIELD_WALL';

-- DropForeignKey
ALTER TABLE "Guild" DROP CONSTRAINT "Guild_messageChannelId_fkey";

-- DropForeignKey
ALTER TABLE "GuildMembership" DROP CONSTRAINT "GuildMembership_guildId_fkey";

-- DropForeignKey
ALTER TABLE "GuildMembership" DROP CONSTRAINT "GuildMembership_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_messageChannelId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserMessageChannelLink" DROP CONSTRAINT "UserMessageChannelLink_messageChannelId_fkey";

-- DropForeignKey
ALTER TABLE "UserMessageChannelLink" DROP CONSTRAINT "UserMessageChannelLink_userId_fkey";

-- AddForeignKey
ALTER TABLE "Guild" ADD CONSTRAINT "Guild_messageChannelId_fkey" FOREIGN KEY ("messageChannelId") REFERENCES "MessageChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildMembership" ADD CONSTRAINT "GuildMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildMembership" ADD CONSTRAINT "GuildMembership_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessageChannelLink" ADD CONSTRAINT "UserMessageChannelLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessageChannelLink" ADD CONSTRAINT "UserMessageChannelLink_messageChannelId_fkey" FOREIGN KEY ("messageChannelId") REFERENCES "MessageChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_messageChannelId_fkey" FOREIGN KEY ("messageChannelId") REFERENCES "MessageChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
