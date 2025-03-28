/*
  Warnings:

  - You are about to drop the column `priority` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "priority",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry";
