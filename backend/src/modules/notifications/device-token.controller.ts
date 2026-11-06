import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/auth-request.js";

import {
  registerDeviceToken,
  unregisterDeviceToken,
} from "./device-token.service.js";

export const registerDevice = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    const { token } = req.body;

    if (
      typeof token !== "string" ||
      token.trim().length === 0
    ) {
      res.status(400).json({
        message: "A valid device token is required",
      });
      return;
    }

    const device = await registerDeviceToken(
      req.user.id,
      token.trim(),
    );

    res.status(200).json({
      message: "Device registered successfully",
      data: {
        id: device.id,
        platform: device.platform,
        createdAt: device.createdAt,
      },
    });
  } catch (error) {
    console.error("Register device error:", error);

    res.status(500).json({
      message: "Failed to register device",
    });
  }
};

export const unregisterDevice = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    const { token } = req.body;

    if (
      typeof token !== "string" ||
      token.trim().length === 0
    ) {
      res.status(400).json({
        message: "A valid device token is required",
      });
      return;
    }

    const deletedCount = await unregisterDeviceToken(
      req.user.id,
      token.trim(),
    );

    res.status(200).json({
      message:
        deletedCount > 0
          ? "Device unregistered successfully"
          : "No registered device found",
    });
  } catch (error) {
    console.error("Unregister device error:", error);

    res.status(500).json({
      message: "Failed to unregister device",
    });
  }
};
