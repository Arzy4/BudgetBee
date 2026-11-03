import { z } from "zod/mini";

export const updateProfileSchema = z
  .object({
    fullName: z.optional(
      z
        .string()
        .check(
          z.trim(),
          z.minLength(1, "Full name cannot be empty"),
          z.maxLength(100, "Full name cannot exceed 100 characters"),
        ),
    ),

    phoneNumber: z.optional(
      z.nullable(
        z
          .string()
          .check(
            z.trim(),
            z.minLength(8, "Phone number must contain at least 8 characters"),
            z.maxLength(20, "Phone number cannot exceed 20 characters"),
            z.regex(/^\+?[0-9]+$/, "Phone number must contain only digits"),
          ),
      ),
    ),
  })
  .check(
    z.refine(
      (data) => data.fullName !== undefined || data.phoneNumber !== undefined,
      "At least one field must be provided",
    ),
  );

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .check(z.minLength(1, "Current password is required")),

  newPassword: z
    .string()
    .check(
      z.minLength(8, "New password must contain at least 8 characters"),
      z.maxLength(72, "New password cannot exceed 72 characters"),
    ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
