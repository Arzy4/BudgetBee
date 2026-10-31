import api from "./api";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  createdAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse["data"]> {
  const response = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });

  return response.data.data;
}

export async function getCurrentUser(
  accessToken: string
): Promise<AuthUser> {
  const response = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data.data;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshTokenResponse["data"]> {
  const response = await api.post<RefreshTokenResponse>(
    "/auth/refresh",
    {
      refreshToken,
    }
  );

  return response.data.data;
}