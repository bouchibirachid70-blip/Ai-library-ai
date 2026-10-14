import { PrismaClient } from '@prisma/client'

// Reuse a single PrismaClient across hot-reloads in dev and across warm
// serverless invocations in production. With the Supabase PgBouncer pooler
// (transaction mode, connection_limit=1) this avoids reconnect churn while
// staying within the connection budget. On a cold start a new client is
// created; on warm starts the cached instance is reused.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Query logging is dev-only (production logging on serverless is noise + cost).
const log: ("query" | "warn" | "error")[] =
  process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query', 'warn', 'error']

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ log })

if (!globalForPrisma.prisma) globalForPrisma.prisma = db

