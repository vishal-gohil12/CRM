/*
  Warnings:

  - The values [manager,employee] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `amount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('admin');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'admin';
COMMIT;

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_companyId_fkey";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "documents" TEXT[],
ADD COLUMN     "gst_no" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "amount",
ADD COLUMN     "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "payment_type" TEXT NOT NULL DEFAULT 'cash',
ADD COLUMN     "pendingAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "companyId",
ALTER COLUMN "role" SET DEFAULT 'admin';

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
