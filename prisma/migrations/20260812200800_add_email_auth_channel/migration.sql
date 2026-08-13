-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('PHONE', 'EMAIL');

-- AlterTable: rename phone -> identifier (preserves existing OTP rows), add channel
ALTER TABLE "OtpCode" RENAME COLUMN "phone" TO "identifier";
ALTER TABLE "OtpCode" ADD COLUMN "channel" "OtpChannel" NOT NULL DEFAULT 'PHONE';

-- AlterIndex
DROP INDEX IF EXISTS "OtpCode_phone_idx";
CREATE INDEX "OtpCode_identifier_channel_idx" ON "OtpCode"("identifier", "channel");

-- AlterTable
ALTER TABLE "User" ADD COLUMN "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
