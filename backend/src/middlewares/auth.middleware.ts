import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { AUTH_CONFIG } from "../config/auth.config.js";
import type { AuthenticatedRequest } from "../types/auth-request.js";

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Access token is missing",
    });
    return;
  }

  const token = authHeader.slice(7);

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Access token is missing",
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({
      success: false,
      message: "JWT secret is not configured",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
    });

    // Validate access-token payload
    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      !/^[1-9]\d*$/.test(decoded.sub) ||
      !Number.isSafeInteger(Number(decoded.sub)) ||
      decoded.tokenType !== "access" ||
      typeof decoded.sid !== "string" ||
      !Number.isSafeInteger(decoded.version) ||
      decoded.version < 1 ||
      decoded.sid.length === 0
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid access token payload",
      });
      return;
    }

    const userId = Number(decoded.sub);

    // Find the session associated with this access token
    const session = await prisma.refreshSession.findUnique({
      where: {
        sessionId: decoded.sid,
      },
      select: {
        userId: true,
        accessTokenVersion: true,
        revokedAt: true,
        expiresAt: true,
        lastActivityAt: true,
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!session || session.userId !== userId || !session.user) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
      return;
    }

    // Validate access-token version
    if (decoded.version !== session.accessTokenVersion) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
      return;
    }

    const now = new Date();

    const inactivityMs =
      AUTH_CONFIG.SESSION_INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

    const inactivityDeadline = new Date(
      session.lastActivityAt.getTime() + inactivityMs,
    );

    // Reject revoked, expired, or inactive sessions
    if (
      session.revokedAt !== null ||
      session.expiresAt <= now ||
      now >= inactivityDeadline
    ) {
      res.status(401).json({
        success: false,
        message: "Session expired or revoked",
      });
      return;
    }

    // Attach the authenticated user to the request
    req.user = {
      id: session.user.id,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
      return;
    }

    console.error("Authentication middleware error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
