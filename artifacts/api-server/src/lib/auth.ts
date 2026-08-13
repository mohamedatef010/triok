import jwt from "jsonwebtoken";

// Fail fast in production if no secret is provided
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("CRITICAL: SESSION_SECRET is required in production environment");
}

const JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

export interface JwtPayload {
  userId: number;
  role: "user" | "admin";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
  } catch {
    return null;
  }
}
