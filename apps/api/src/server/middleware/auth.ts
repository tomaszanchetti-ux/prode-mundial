import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api-error";
import { errorPayload } from "../http/respond";
import type { AuthContext } from "../auth/auth-context";
import { firebaseAdminAuth } from "../firebase/firebase-admin";

type AuthenticatedRequest = Request & { auth?: AuthContext };

async function buildAuthContext(token: string): Promise<AuthContext> {
  const decodedToken = await firebaseAdminAuth.verifyIdToken(token);
  const fallbackName = decodedToken.email?.split("@")[0] ?? "Jugador Prode";

  if (!decodedToken.uid || !decodedToken.email) {
    throw new ApiError(401, "INVALID_TOKEN", "Invalid Firebase token payload.");
  }

  return {
    userId: decodedToken.uid,
    email: decodedToken.email,
    emailVerified: decodedToken.email_verified === true,
    displayName: typeof decodedToken.name === "string" && decodedToken.name.trim().length > 0 ? decodedToken.name : fallbackName,
    photoUrl: typeof decodedToken.picture === "string" ? decodedToken.picture : null
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json(errorPayload("UNAUTHENTICATED", "Missing bearer token."));
  }

  const token = authorization.slice("Bearer ".length);

  try {
    (req as AuthenticatedRequest).auth = await buildAuthContext(token);
    next();
  } catch {
    return res.status(401).json(errorPayload("INVALID_TOKEN", "Invalid bearer token."));
  }
}
