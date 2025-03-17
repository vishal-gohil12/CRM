/*
  Warnings:

  - You are about to drop the column `name` on the `Customer` table. All the data in the column will be lost.
  - Added the required column `company_and_name` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "name",
ADD COLUMN     "company_and_name" TEXT NOT NULL;
