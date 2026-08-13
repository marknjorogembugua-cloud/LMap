-- AlterTable: phone is no longer required at signup (email-only signups skip it)
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;
