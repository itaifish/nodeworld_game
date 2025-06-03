-- DropForeignKey
ALTER TABLE "Node" DROP CONSTRAINT "Node_galaxyId_fkey";

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_galaxyId_fkey" FOREIGN KEY ("galaxyId") REFERENCES "Galaxy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
