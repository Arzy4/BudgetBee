import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import jwt from "jsonwebtoken";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

export async function registerUser(data: RegisterInput) {
  const { fullName, email, password } = data;

  // 1. Check whether the email is already registered
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  // 2. Hash the user's password
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Save the new user in PostgreSQL
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
}

export async function loginUser(data: LoginInput) {
  const { email, password } = data;

  // 1. Find the user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // 2. Compare the submitted password with the stored hash
  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // 3. Retrieve JWT secret
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !refreshSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  // 4. Generate an access token
  const accessToken = jwt.sign(
    { sub: String(user.id) },
    jwtSecret,
    { expiresIn: "1h", algorithm: "HS256" }
  );

  // 5. Generate a refresh token (7 days)
  const refreshToken = jwt.sign(
    {
        sub: String(user.id),
        tokenType: "refresh",
    },
    refreshSecret,
    {
        expiresIn: "7d",
        algorithm: "HS256",
    }
  );

  // 6. Return token and safe user information
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    },
  };
}
