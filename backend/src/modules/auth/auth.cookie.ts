import type { CookieOptions } from "express";

export const REFRESH_COOKIE_NAME = "refreshToken";

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const clearRefreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/api/auth",
};
