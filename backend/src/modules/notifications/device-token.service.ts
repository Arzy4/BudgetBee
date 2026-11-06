import { prisma } from "../../lib/prisma.js";

export const registerDeviceToken = async (
  userId: number,
  token: string,
) => {
  return prisma.deviceToken.upsert({
    where: {
      token,
    },
    update: {
      userId,
      platform: "ANDROID",
    },
    create: {
      userId,
      token,
      platform: "ANDROID",
    },
  });
};

export const unregisterDeviceToken = async (
  userId: number,
  token: string,
) => {
  const result = await prisma.deviceToken.deleteMany({
    where: {
      userId,
      token,
    },
  });

  return result.count;
};

export const getUserDeviceTokens = async (userId: number) => {
  return prisma.deviceToken.findMany({
    where: {
      userId,
    },
    select: {
      token: true,
    },
  });
};
