/*
  Warnings:

  - The values [POWER_STATION] on the enum `Building_Type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Building_Type_new" AS ENUM ('CAPITAL_BUILDING', 'DWELLING', 'HARVESTOR', 'BARRACKS', 'EXTRACTOR');
ALTER TABLE "Building" ALTER COLUMN "type" TYPE "Building_Type_new" USING ("type"::text::"Building_Type_new");
ALTER TYPE "Building_Type" RENAME TO "Building_Type_old";
ALTER TYPE "Building_Type_new" RENAME TO "Building_Type";
DROP TYPE "Building_Type_old";
COMMIT;
