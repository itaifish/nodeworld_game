/*
  Warnings:

  - The primary key for the `Node` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `x` on the `Node` table. All the data in the column will be lost.
  - You are about to drop the column `y` on the `Node` table. All the data in the column will be lost.
  - Added the required column `q` to the `Node` table without a default value. This is not possible if the table is not empty.
  - Added the required column `r` to the `Node` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resourceAvailability` to the `Node` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ResourceAvailability" AS ENUM ('OPULENT', 'LUSH', 'STANDARD', 'LACKING', 'BARREN');

-- AlterTable
ALTER TABLE "Node" DROP CONSTRAINT "Node_pkey",
DROP COLUMN "x",
DROP COLUMN "y",
ADD COLUMN     "q" INTEGER NOT NULL,
ADD COLUMN     "r" INTEGER NOT NULL,
ADD COLUMN     "resourceAvailability" "ResourceAvailability" NOT NULL,
ADD CONSTRAINT "Node_pkey" PRIMARY KEY ("q", "r", "galaxyId");
