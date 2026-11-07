import { fileTypeFromBuffer } from "file-type";
import { Readable } from "node:stream";
import cloudinary from "../../config/cloudinary.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { checkBudgetNotifications } from "../notifications/budget-notification.service.js";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "./transaction.schema.js";

const triggerBudgetNotification = async (
  userId: number,
  categoryId: number,
  date: Date,
) => {
  try {
    await checkBudgetNotifications(
      userId,
      categoryId,
      date.getUTCMonth() + 1,
      date.getUTCFullYear(),
    );
  } catch (error) {
    console.error("Budget notification trigger failed:", error);
  }
};

// Get All Transactions
export const getAllTransactions = async (userId: number) => {
  // Retrieve transactions belonging to the authenticated user
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
    },
    // Include category information
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    // Sort transactions from newest to oldest
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });

  // Return transactions
  return transactions;
};

// Get Transaction By ID
export const getTransactionById = async (
  userId: number,
  transactionId: number,
) => {
  // Find the transaction belonging to the authenticated user
  const transaction = await prisma.transaction.findUnique({
    where: {
      id: transactionId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  // Check whether the transaction exists
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  // Check whether the transaction belongs to the user
  if (transaction.userId !== userId) {
    throw new Error("Forbidden");
  }

  // Return the transaction
  return transaction;
};

// Create Transaction
export const createTransaction = async (
  userId: number,
  data: CreateTransactionInput,
) => {
  // Verify that the category belongs to the user
  const category = await prisma.category.findFirst({
    where: {
      id: data.categoryId,
      userId,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  // Verify that category type matches transaction type
  if (category.type !== data.type) {
    throw new Error("Category type must match transaction type");
  }

  // Create the transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      title: data.title,
      amount: new Prisma.Decimal(data.amount.toString()),
      type: data.type,
      categoryId: data.categoryId,
      paymentMethod: data.paymentMethod,
      description: data.description,
      date: data.date ? new Date(data.date) : new Date(),
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (transaction.type === "EXPENSE") {
    await triggerBudgetNotification(
      transaction.userId,
      transaction.categoryId,
      transaction.date,
    );
  }

  return transaction;
};

// Update Transaction
export const updateTransaction = async (
  userId: number,
  transactionId: number,
  data: UpdateTransactionInput,
) => {
  //  Find the transaction
  const existingTransaction = await prisma.transaction.findUnique({
    where: {
      id: transactionId,
    },
  });

  // Check whether the transaction exists
  if (!existingTransaction) {
    throw new Error("Transaction not found");
  }

  // Verify transaction ownership
  if (existingTransaction.userId !== userId) {
    throw new Error("Forbidden");
  }

  // Determine the final transaction type and category
  const finalType = data.type ?? existingTransaction.type;
  const finalCategoryId = data.categoryId ?? existingTransaction.categoryId;

  // Verify that the category belongs to the user
  const category = await prisma.category.findFirst({
    where: {
      id: finalCategoryId,
      userId,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  // Verify that category type matches transaction type
  if (category.type !== finalType) {
    throw new Error("Category type must match transaction type");
  }

  // Update the transaction
  const updatedTransaction = await prisma.transaction.update({
    where: {
      id: transactionId,
      userId,
    },
    data: {
      ...(data.title !== undefined && {
        title: data.title,
      }),
      ...(data.amount !== undefined && {
        amount: new Prisma.Decimal(data.amount.toString()),
      }),
      ...(data.type !== undefined && {
        type: data.type,
      }),
      ...(data.categoryId !== undefined && {
        categoryId: data.categoryId,
      }),
      ...(data.paymentMethod !== undefined && {
        paymentMethod: data.paymentMethod,
      }),
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.date !== undefined && {
        date: new Date(data.date),
      }),
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (updatedTransaction.type === "EXPENSE") {
    await triggerBudgetNotification(
      updatedTransaction.userId,
      updatedTransaction.categoryId,
      updatedTransaction.date,
    );
  }

  // Return the updated transaction
  return updatedTransaction;
};

// Delete Transaction Logic
export const deleteTransaction = async (
  userId: number,
  transactionId: number,
) => {
  // Find the transaction by its ID
  const existingTransaction = await prisma.transaction.findUnique({
    where: {
      id: transactionId,
    },
  });

  // Check whether the transaction exists
  if (!existingTransaction) {
    throw new Error("Transaction not found");
  }

  // Verify transaction ownership
  if (existingTransaction.userId !== userId) {
    throw new Error("Forbidden");
  }

  // Delete the transaction
  const deletedTransaction = await prisma.transaction.delete({
    where: {
      id: transactionId,
      userId,
    },
  });

  // Return the deleted transaction
  return deletedTransaction;
};

// Update Transaction Receipt
export async function updateTransactionReceipt(
  userId: number,
  transactionId: number,
  file: Express.Multer.File,
) {
  // Validate file size
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  // Verify the actual image format
  const detectedType = await fileTypeFromBuffer(file.buffer);

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
    throw new Error("INVALID_IMAGE");
  }

  // Find the existing transaction
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
    select: {
      id: true,
      receiptKey: true,
    },
  });

  if (!transaction) {
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  // Upload the new receipt to Cloudinary
  const uploadedImage = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "budgetbee/receipts",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary returned no upload result"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });

  // Update the database
  let updatedTransaction;

  try {
    updatedTransaction = await prisma.transaction.update({
      where: {
        id: transactionId,
        userId,
      },
      data: {
        receiptKey: uploadedImage.public_id,
        receiptUrl: uploadedImage.secure_url,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  } catch (error) {
    // Delete the new image if database update fails
    try {
      await cloudinary.uploader.destroy(uploadedImage.public_id);
    } catch (cleanupError) {
      console.error(
        "Failed to clean up new receipt:",
        cleanupError,
      );
    }

    throw error;
  }

  // Delete the previous receipt
  if (transaction.receiptKey) {
    try {
      await cloudinary.uploader.destroy(transaction.receiptKey);
    } catch (error) {
      console.error(
        "Failed to delete previous receipt:",
        error,
      );
    }
  }

  return updatedTransaction;
}
