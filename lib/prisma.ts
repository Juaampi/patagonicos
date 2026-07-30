import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { env } from './env'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createPrismaClient() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured')
  }

  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  })

  return new PrismaClient({
    adapter,
    log: ['error'],
  })
}

function hasLatestDelegates(client: PrismaClient | undefined) {
  if (!client) {
    return false
  }

  const candidate = client as PrismaClient & {
    storeSettings?: unknown
    printJob?: unknown
  }

  return Boolean(candidate.storeSettings && candidate.printJob)
}

export const prisma = hasLatestDelegates(globalForPrisma.prisma)
  ? globalForPrisma.prisma!
  : createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
