// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// 1. Define the singleton factory with Maison-grade logging
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
};

// 2. Setup the global type for TypeScript to prevent 'prisma' from being undefined
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// 3. Initialize the client, checking the global scope first
export const prisma = globalThis.prisma ?? prismaClientSingleton();

// 4. In development, save the instance to globalThis to prevent exhaustion of DB connections
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;