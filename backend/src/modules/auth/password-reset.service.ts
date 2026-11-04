import {
  createHmac,
  randomInt,
  randomUUID,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { sendPasswordResetEmail } from "../../services/email.service.js";

const CODE_EXPIRATION_MINUTES = 10;
const REQUEST_COOLDOWN_SECONDS = 60;

const MAX_VERIFICATION_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRATION_MINUTES = 10;

function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashVerificationCode(userId: number, code: string): string {
  const secret = process.env.PASSWORD_RESET_SECRET;

  if (!secret) {
    throw new Error("PASSWORD_RESET_SECRET is not configured");
  }

  return createHmac("sha256", secret).update(`${userId}:${code}`).digest("hex");
}

export async function requestPasswordReset(email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
    },
  });

  // Do not reveal whether the email is registered.
  if (!user) {
    return randomUUID();
  }

  const latestRequest = await prisma.passwordReset.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (latestRequest) {
    const elapsedSeconds =
      (Date.now() - latestRequest.createdAt.getTime()) / 1000;

    if (elapsedSeconds < REQUEST_COOLDOWN_SECONDS) {
      return latestRequest.requestId;
    }
  }

  const code = generateVerificationCode();

  const codeHash = hashVerificationCode(user.id, code);

  const codeExpiresAt = new Date(
    Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000,
  );

  // Invalidate previous unused requests for this user.
  await prisma.passwordReset.updateMany({
    where: {
      userId: user.id,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  const resetRequest = await prisma.passwordReset.create({
    data: {
      userId: user.id,
      codeHash,
      codeExpiresAt,
    },
  });

  try {
    await sendPasswordResetEmail(user.email, code);
  } catch (error) {
    // Prevent an undelivered code from remaining valid.
    await prisma.passwordReset.update({
      where: {
        id: resetRequest.id,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    throw error;
  }

  return resetRequest.requestId;
}

// Verify Password-Reset
export async function verifyPasswordResetCode(
  requestId: string,
  code: string,
): Promise<string> {
  const resetRequest = await prisma.passwordReset.findUnique({
    where: {
      requestId,
    },
    select: {
      id: true,
      userId: true,
      codeHash: true,
    },
  });

  if (!resetRequest) {
    throw new Error("Invalid or expired verification code");
  }

  // Atomically reserve one verification attempt.
  // This also prevents using expired, consumed, or already verified requests.
  const attempt = await prisma.passwordReset.updateMany({
    where: {
      id: resetRequest.id,
      consumedAt: null,
      verifiedAt: null,
      codeExpiresAt: {
        gt: new Date(),
      },
      verificationAttempts: {
        lt: MAX_VERIFICATION_ATTEMPTS,
      },
    },
    data: {
      verificationAttempts: {
        increment: 1,
      },
    },
  });

  if (attempt.count !== 1) {
    throw new Error("Invalid or expired verification code");
  }

  const submittedHash = hashVerificationCode(
    resetRequest.userId,
    code,
  );

  const expectedHash = Buffer.from(
    resetRequest.codeHash,
    "hex",
  );

  const actualHash = Buffer.from(
    submittedHash,
    "hex",
  );

  const isValid =
    expectedHash.length === actualHash.length &&
    timingSafeEqual(expectedHash, actualHash);

  if (!isValid) {
    throw new Error("Invalid or expired verification code");
  }

  const resetToken = randomBytes(32).toString("hex");

  const resetTokenHash = createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const resetTokenExpiresAt = new Date(
    Date.now() +
      RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000,
  );

  // Only one successful verification can claim the request.
  const verified = await prisma.passwordReset.updateMany({
    where: {
      id: resetRequest.id,
      consumedAt: null,
      verifiedAt: null,
      codeExpiresAt: {
        gt: new Date(),
      },
      verificationAttempts: {
        lte: MAX_VERIFICATION_ATTEMPTS,
      },
    },
    data: {
      verifiedAt: new Date(),
      resetTokenHash,
      resetTokenExpiresAt,
    },
  });

  if (verified.count !== 1) {
    throw new Error("Invalid or expired verification code");
  }

  return resetToken;
}

// Confirm Password-Reset
export async function confirmPasswordReset(
  resetToken: string,
  newPassword: string,
): Promise<void> {
  // 1. Hash the token received from the client.
  const resetTokenHash = createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 2. Find the corresponding password reset request.
  const resetRequest = await prisma.passwordReset.findUnique({
    where: {
      resetTokenHash,
    },
    select: {
      id: true,
      userId: true,
      verifiedAt: true,
      resetTokenExpiresAt: true,
      consumedAt: true,
    },
  });

  if (
    !resetRequest ||
    !resetRequest.verifiedAt ||
    resetRequest.consumedAt ||
    !resetRequest.resetTokenExpiresAt ||
    resetRequest.resetTokenExpiresAt <= new Date()
  ) {
    throw new Error("Invalid or expired password reset token");
  }

  // 3. Hash the new password before storing it.
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // 4. Update the password and revoke sessions atomically.
  await prisma.$transaction(async (tx) => {
    // Claim the token exactly once.
    const claimed = await tx.passwordReset.updateMany({
      where: {
        id: resetRequest.id,
        verifiedAt: {
          not: null,
        },
        consumedAt: null,
        resetTokenHash,
        resetTokenExpiresAt: {
          gt: new Date(),
        },
      },
      data: {
        consumedAt: new Date(),
      },
    });

    if (claimed.count !== 1) {
      throw new Error("Invalid or expired password reset token");
    }

    // Update the user's password.
    await tx.user.update({
      where: {
        id: resetRequest.userId,
      },
      data: {
        passwordHash,
      },
    });

    // Revoke all existing login sessions.
    await tx.refreshSession.updateMany({
      where: {
        userId: resetRequest.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // Invalidate any other outstanding reset requests.
    await tx.passwordReset.updateMany({
      where: {
        userId: resetRequest.userId,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });
  });
}
