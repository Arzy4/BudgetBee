export const AUTH_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: "15m",
  REFRESH_TOKEN_EXPIRES_IN_DAYS: 180,
  SESSION_INACTIVITY_DAYS: 180,
} as const;

export function getRefreshTokenExpiration(): Date {
  const expirationMs =
    AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_DAYS *
    24 *
    60 *
    60 *
    1000;

  return new Date(Date.now() + expirationMs);
}