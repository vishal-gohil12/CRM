/*
  Warnings:

  - You are about to drop the column `transactionType` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "transactionType";

-- DropEnum
DROP TYPE "TransactionType";
