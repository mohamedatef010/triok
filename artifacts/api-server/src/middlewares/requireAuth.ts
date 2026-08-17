import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload, passwordFingerprint } from "../lib/auth";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  if (req.cookies && typeof req.cookies === "object") {
    if (typeof req.cookies.auth_token === "string") return req.cookies.auth_token;
    if (typeof req.cookies.authToken === "string") return req.cookies.authToken;
    if (typeof req.cookies.admin_token === "string" && req.originalUrl?.includes("/admin")) return req.cookies.admin_token;
  }
  return null;
}

/**
 * Verify that the token's password fingerprint (pwfp) still matches the user's
 * current password hash in the database. This ensures immediate token invalidation
 * whenever the user's password is changed.
 * Returns false if pwfp is missing in token (backward compat — allowed) or if it mismatches.
 */
async function verifyPasswordFingerprint(payload: JwtPayload): Promise<boolean> {
  // Tokens without pwfp are allowed (issued before this feature was added)
  if (!payload.pwfp) return true;

  const [user] = await db
    .select({ passwordHash: usersTable.passwordHash })
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId));

  if (!user) return false;
  return passwordFingerprint(user.passwordHash) === payload.pwfp;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Не авторизован" });
    return;
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: "Недействительный или истекший токен" });
    return;
  }

  // Verify password fingerprint — if password was changed, token is invalid
  const pwfpValid = await verifyPasswordFingerprint(payload);
  if (!pwfpValid) {
    res.status(401).json({ error: "Сессия истекла. Пожалуйста, войдите снова" });
    return;
  }

  req.user = payload;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) req.user = payload;
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Не авторизован" });
    return;
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: "Недействительный или истекший токен" });
    return;
  }
  if (payload.role !== "admin") {
    res.status(403).json({ error: "Доступ запрещен: требуются права администратора" });
    return;
  }

  // Verify password fingerprint for admins too
  const pwfpValid = await verifyPasswordFingerprint(payload);
  if (!pwfpValid) {
    res.status(401).json({ error: "Сессия истекла. Пожалуйста, войдите снова" });
    return;
  }

  req.user = payload;
  next();
}


