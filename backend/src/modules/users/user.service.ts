import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcrypt";
import type { UpdateProfileInput, ChangePasswordInput } from "./user.schema.js";

// Get User
export async function getUserProfile(userId: number) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      createdAt: true,
    },
  });
}

// Update User
export async function updateUserProfile(
  userId: number,
  data: UpdateProfileInput,
) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      ...(data.fullName !== undefined && {
        fullName: data.fullName,
      }),

      ...(data.phoneNumber !== undefined && {
        phoneNumber: data.phoneNumber,
      }),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      createdAt: true,
    },
  });
}

// Change Password
export async function changeUserPassword(
  userId: number,
  data: ChangePasswordInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    data.currentPassword,
    user.passwordHash,
  );

  if (!isCurrentPasswordValid) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  const isSamePassword = await bcrypt.compare(
    data.newPassword,
    user.passwordHash,
  );

  if (isSamePassword) {
    throw new Error("PASSWORD_UNCHANGED");
  }

  const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

  // Update password and revoke all refresh sessions atomically.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    }),

    prisma.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    }),
  ]);
}
