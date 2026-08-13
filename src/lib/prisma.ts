import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Small pool size: on Vercel each serverless invocation can spin up its own
// pool, so a large per-instance max would multiply against Supabase's
// pooler connection cap. Pair with the transaction-mode pooler (port 6543)
// in production so short-lived connections are cheap to open/close.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 3 });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
