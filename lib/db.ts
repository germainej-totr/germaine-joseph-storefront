import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient({
  // Keeping the log configuration ensures you can see SQL output in your terminal
  log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}