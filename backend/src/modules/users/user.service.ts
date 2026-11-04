import { fileTypeFromBuffer } from "file-type";
import { Readable } from "node:stream";
import cloudinary from "../../config/cloudinary.js";
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
      profileImage: true,
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

// Update User Avatar
export async function updateUserAvatar(
  userId: number,
  file: Express.Multer.File,
) {
  // 1. Verify the actual image format
  const detectedType = await fileTypeFromBuffer(file.buffer);

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
    throw new Error("INVALID_IMAGE");
  }

  // 2. Find the existing user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      profileImageId: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // 3. Upload the new picture to Cloudinary
  const uploadedImage = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "budgetbee/avatars",
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

  // 4. Update Prisma with the new image
  let updatedUser;

  try {
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: uploadedImage.secure_url,
        profileImageId: uploadedImage.public_id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        profileImage: true,
        createdAt: true,
      },
    });
  } catch (error) {
    // Remove the newly uploaded image if DB update fails
    try {
      await cloudinary.uploader.destroy(uploadedImage.public_id);
    } catch (cleanupError) {
      console.error("Failed to clean up new image:", cleanupError);
    }

    throw error;
  }

  // 5. Delete the previous picture
  if (user.profileImageId) {
    try {
      await cloudinary.uploader.destroy(user.profileImageId);
    } catch (error) {
      console.error("Failed to delete previous avatar:", error);
    }
  }

  return updatedUser;
}
