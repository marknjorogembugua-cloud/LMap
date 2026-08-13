-- Workers and clients now type their trade/job category in their own words
-- instead of picking from a fixed enum.
ALTER TABLE "WorkerProfile" ALTER COLUMN "category" TYPE TEXT USING "category"::text;
ALTER TABLE "Gig" ALTER COLUMN "category" TYPE TEXT USING "category"::text;
DROP TYPE "ServiceCategory";
