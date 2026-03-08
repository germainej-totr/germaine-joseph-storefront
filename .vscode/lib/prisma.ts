import { PrismaClient } from '@prisma/client'

// Ensures we don't create multiple instances of Prisma Client in development
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn'], // Keeps the helpful logs you had before
  })
}

declare global {
  // This allows the 'prisma' variable to be available globally in your project
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma