import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createPrismaClient() {
  return new PrismaClient({
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
