import {
  AUTH_CONFIG,
  getRefreshTokenExpiration,
} from "../../config/auth.config.js";

import type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  LogoutInput,
} from "./auth.schema.js";

import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";

// REGISTER LOGIC
export async function registerUser(data: RegisterInput) {
  const { fullName, phoneNumber, email, password } = data;

  // 1. Check whether the email is already registered
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  // 2. Hash the user's password
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Save the new user in PostgreSQL
  const user = await prisma.user.create({
    data: {
      fullName,
      phoneNumber,
      email,
      passwordHash,
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
}

// LOGIN LOGIC
export async function loginUser(data: LoginInput) {
  const { email, password } = data;

  // Find the user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Compare the submitted password with the stored hash
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Retrieve JWT secret
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !refreshSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  // Generate a unique identifier for this login session
  const sessionId = randomUUID();

  // Initial access-token version
  const accessTokenVersion = 1;

  // Generate an access token
  const accessToken = jwt.sign(
    {
      sub: String(user.id),
      tokenType: "access",
      sid: sessionId,
      version: accessTokenVersion,
    },
    jwtSecret,
    {
      expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      algorithm: "HS256",
    },
  );

  // Generate a refresh token linked to the session
  const refreshToken = jwt.sign(
    {
      sub: String(user.id),
      tokenType: "refresh",
      jti: randomUUID(),
      sid: sessionId,
    },
    refreshSecret,
    {
      expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60,
      algorithm: "HS256",
    },
  );

  // Hash and store the refresh token
  const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

  const expiresAt = getRefreshTokenExpiration();

  await prisma.refreshSession.create({
    data: {
      sessionId,
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Return token and safe user information
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    },
  };
}

// REFRESH TOKEN LOGIC
export async function refreshUserToken(data: RefreshInput) {
  const { refreshToken } = data;

  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!refreshSecret) {
    throw new Error("JWT_REFRESH_SECRET_NOT_CONFIGURED");
  }

  let decoded: jwt.JwtPayload;

  try {
    const payload = jwt.verify(refreshToken, refreshSecret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !/^[1-9]\d*$/.test(payload.sub) ||
      payload.tokenType !== "refresh" ||
      typeof payload.jti !== "string" ||
      typeof payload.sid !== "string" ||
      payload.sid.length === 0 ||
      !Number.isSafeInteger(Number(payload.sub))
    ) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    decoded = payload;
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      (error instanceof Error && error.message === "INVALID_REFRESH_TOKEN")
    ) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    throw error;
  }

  const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

  const userId = Number(decoded.sub);

  const session = await prisma.refreshSession.findUnique({
    where: {
      sessionId: decoded.sid as string,
    },
  });

  // Validate session existence and ownership
  if (!session || session.userId !== userId) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  // Reject outdated refresh tokens without revoking the active session
  if (session.tokenHash !== tokenHash) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const now = new Date();

  if (session.revokedAt !== null || session.expiresAt <= now) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const inactivityMs =
    AUTH_CONFIG.SESSION_INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

  const inactivityDeadline = new Date(
    session.lastActivityAt.getTime() + inactivityMs,
  );

  if (now >= inactivityDeadline) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET_NOT_CONFIGURED");
  }

  const newRefreshToken = jwt.sign(
    {
      sub: String(userId),
      tokenType: "refresh",
      jti: randomUUID(),
      sid: session.sessionId,
    },
    refreshSecret,
    {
      expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60,
      algorithm: "HS256",
    },
  );

  const newTokenHash = createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  const newExpiresAt = getRefreshTokenExpiration();

  const updatedSessions = await prisma.refreshSession.updateManyAndReturn({
    where: {
      id: session.id,
      userId,
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: now,
      },
      lastActivityAt: {
        gt: new Date(now.getTime() - inactivityMs),
      },
      user: {
        is: {
          id: userId,
        },
      },
    },
    data: {
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      lastActivityAt: now,
      lastRotatedAt: now,
      accessTokenVersion: {
        increment: 1,
      },
    },
    select: {
      sessionId: true,
      accessTokenVersion: true,
    },
  });

  // Retrieve the updated access-token version
  if (updatedSessions.length !== 1) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const rotatedSession = updatedSessions[0]!;

  // Generate an access token using the updated version
  const newAccessToken = jwt.sign(
    {
      sub: String(userId),
      tokenType: "access",
      sid: rotatedSession.sessionId,
      version: rotatedSession.accessTokenVersion,
    },
    jwtSecret,
    {
      expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      algorithm: "HS256",
    },
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

// LOGOUT LOGIC
export async function logoutUser(data: LogoutInput) {
  const { refreshToken } = data;

  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!refreshSecret) {
    throw new Error("JWT_REFRESH_SECRET_NOT_CONFIGURED");
  }

  let decoded: jwt.JwtPayload;

  try {
    const payload = jwt.verify(refreshToken, refreshSecret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !/^[1-9]\d*$/.test(payload.sub) ||
      !Number.isSafeInteger(Number(payload.sub)) ||
      payload.tokenType !== "refresh" ||
      typeof payload.jti !== "string" ||
      typeof payload.sid !== "string" ||
      payload.sid.length === 0
    ) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    decoded = payload;
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      (error instanceof Error && error.message === "INVALID_REFRESH_TOKEN")
    ) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    throw error;
  }

  const userId = Number(decoded.sub);
  const sessionId = decoded.sid as string;

  const result = await prisma.refreshSession.updateMany({
    where: {
      sessionId,
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  return {
    message: "Logged out successfully",
  };
}
