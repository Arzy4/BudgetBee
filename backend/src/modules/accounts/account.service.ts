import { prisma } from "../../lib/prisma.js";
import type {
  CreateAccountInput,
  UpdateAccountInput,
} from "./account.schema.js";

// Get All Accounts
export async function getAccounts(userId: number) {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
      type: true,
      initialBalance: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return accounts;
}

// Get Account by ID
export async function getAccountById(userId: number, accountId: number) {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
    },
    select: {
      id: true,
      name: true,
      type: true,
      initialBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return account;
}

// Create Account
export async function createAccount(userId: number, data: CreateAccountInput) {
  const account = await prisma.account.create({
    data: {
      name: data.name,
      type: data.type,
      initialBalance: data.initialBalance,
      userId,
    },
    select: {
      id: true,
      userId: true,
      name: true,
      type: true,
      initialBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return account;
}

// Patch Account by ID
export async function updateAccount(
  userId: number,
  accountId: number,
  data: UpdateAccountInput,
) {
  return prisma.account.update({
    where: {
      id: accountId,
      userId,
    },
    data,
    select: {
      id: true,
      name: true,
      type: true,
      initialBalance: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// Delete Account
export async function deleteAccount(
  userId: number,
  accountId: number,
) {
  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
      select: {
        id: true,
        transactions: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!account) {
      return { status: "NOT_FOUND" as const };
    }

    if (account.transactions.length > 0) {
      return { status: "HAS_TRANSACTIONS" as const };
    }

    await tx.account.delete({
      where: {
        id: accountId,
        userId,
      },
    });

    return { status: "DELETED" as const };
  });
}
