import { firebaseMessaging } from "../../config/firebase.js";
import { prisma } from "../../lib/prisma.js";
import { getUserDeviceTokens } from "./device-token.service.js";

interface PushNotificationPayload {
  userId: number;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendPushNotification = async ({
  userId,
  title,
  body,
  data = {},
}: PushNotificationPayload) => {
  // Retrieve registered devices
  const devices = await getUserDeviceTokens(userId);

  if (devices.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
    };
  }

  const tokens = devices.map((device) => device.token);

  let successCount = 0;
  let failureCount = 0;

  // Firebase supports a maximum of 500 tokens per batch.
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);

    const response = await firebaseMessaging.sendEachForMulticast({
      tokens: batch,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: "high",
      },
    });

    successCount += response.successCount;
    failureCount += response.failureCount;

    // Remove tokens confirmed to be permanently invalid.
    for (const [index, result] of response.responses.entries()) {
      if (
        !result.success &&
        result.error?.code ===
          "messaging/registration-token-not-registered"
      ) {
        try {
          await prisma.deviceToken.deleteMany({
            where: {
              userId,
              token: batch[index],
            },
          });
        } catch (error) {
          console.error("Failed to remove invalid FCM token:", error);
        }
      }
    }
  }

  return {
    successCount,
    failureCount,
  };
};
