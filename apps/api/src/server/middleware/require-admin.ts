import type { NextFunction, Request, Response } from "express";
import type { AuthContext } from "../auth/auth-context";
import { isAdminEmail } from "../auth/admin-emails";
import { errorPayload } from "../http/respond";

type AuthenticatedRequest = Request & { auth?: AuthContext };

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = (req as AuthenticatedRequest).auth;

  if (!auth) {
    return res.status(401).json(errorPayload("UNAUTHENTICATED", "Missing auth context."));
  }

  if (!isAdminEmail(auth.email)) {
    return res.status(403).json(errorPayload("FORBIDDEN", "Admin access required."));
  }

  next();
}
