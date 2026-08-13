-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "WorkerProfile" ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "WorkerProfile" ADD COLUMN "idImagePath" TEXT;
