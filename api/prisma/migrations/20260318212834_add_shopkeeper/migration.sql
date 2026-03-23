-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SHOPKEEPER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "storeId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
