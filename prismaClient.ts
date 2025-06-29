import { PrismaClient } from "@prisma/client";

export const prismaClient = new PrismaClient({
  transactionOptions: {
    maxWait: 10000,
    timeout: 30000,
  },
  errorFormat: "pretty",
  log: ["error"],
});
