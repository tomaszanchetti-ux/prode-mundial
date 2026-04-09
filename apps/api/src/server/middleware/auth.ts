import type { NextFunction, Request, Response } from "express";
import { errorPayload } from "../http/respond";
import type { AuthContext } from "../auth/auth-context";

type AuthenticatedRequest = Request & { auth?: AuthContext };

function buildAuthContext(token: string): AuthContext {
  const normalizedToken = token.trim();

  if (normalizedToken.length < 3) {
    throw new Error("Token is too short.");
  }

  const safeUserId = normalizedToken.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

  return {
    userId: safeUserId,
    email: `${safeUserId}@dev.prode.local`,
    displayName: "Jugador Prode"
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json(errorPayload("UNAUTHENTICATED", "Missing bearer token."));
  }

  const token = authorization.slice("Bearer ".length);

  try {
    (req as AuthenticatedRequest).auth = buildAuthContext(token);
    next();
  } catch {
    return res.status(401).json(errorPayload("INVALID_TOKEN", "Invalid bearer token."));
  }
}
