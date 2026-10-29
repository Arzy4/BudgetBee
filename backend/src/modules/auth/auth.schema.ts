import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must contain at least 2 characters"),

  phoneNumber: z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{7,14}$/,
    "Phone number must use international format, e.g. +6281234567890"
  )
  .optional(),

  email: z
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters"),
});

export const loginSchema = z.object({
  email: z
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters"),
});

export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
