import jwt, { type SignOptions } from "jsonwebtoken";
import type { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";

// Fail fast in production if required secrets are missing
if (isProduction) {
  if (!process.env.JWT_SECRET) {
    throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET is required in production environment");
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET is required in production environment");
  }
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "dev-jwt-access-secret-change-in-prod";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-jwt-refresh-secret-change-in-prod";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "15m") as SignOptions["expiresIn"];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

export interface JwtPayload {
  userId: number;
  role: "user" | "admin";
  /** Password fingerprint: first 12 chars of bcrypt hash.
   *  When password changes, pwfp changes → token becomes invalid immediately. */
  pwfp?: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  tokenType: "refresh";
}

/**
 * Derive a short, safe fingerprint from a bcrypt password hash.
 * Uses characters 7-19 (skips the cost factor prefix) to avoid leaking algorithm info.
 */
export function passwordFingerprint(passwordHash: string): string {
  return passwordHash.substring(7, 19);
}

/**
 * Sign an Access Token (short-lived, 15 minutes by default).
 * Pass passwordHash to embed a fingerprint for instant invalidation on password change.
 */
export function signAccessToken(payload: JwtPayload, passwordHash?: string): string {
  const finalPayload: JwtPayload = {
    ...payload,
    ...(passwordHash ? { pwfp: passwordFingerprint(passwordHash) } : {}),
  };
  return jwt.sign(finalPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: "HS256",
  });
}

/**
 * Alias for backward compatibility
 */
export const signToken = signAccessToken;

/**
 * Sign a Refresh Token (long-lived, 7 days by default).
 * Pass passwordHash to embed a fingerprint for instant invalidation on password change.
 */
export function signRefreshToken(payload: JwtPayload, passwordHash?: string): string {
  const refreshPayload: RefreshTokenPayload = {
    ...payload,
    tokenType: "refresh",
    ...(passwordHash ? { pwfp: passwordFingerprint(passwordHash) } : {}),
  };
  return jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    algorithm: "HS256",
  });
}

/**
 * Verify an Access Token
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
    if (!decoded || !decoded.userId || !decoded.role) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Alias for backward compatibility
 */
export const verifyToken = verifyAccessToken;

/**
 * Verify a Refresh Token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ["HS256"] }) as RefreshTokenPayload;
    if (!decoded || !decoded.userId || decoded.tokenType !== "refresh") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Standard cookie configuration for Refresh Tokens
 */
export const REFRESH_COOKIE_NAME = "refreshToken";

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};


