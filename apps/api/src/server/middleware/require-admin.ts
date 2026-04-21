import type { NextFunction, Request, Response } from "express";
import type { AuthContext } from "../auth/auth-context";
import { errorPayload } from "../http/respond";

type AuthenticatedRequest = Request & { auth?: AuthContext };

function getAdminEmails(): Set<string> {
  const raw = process.env.PRODE_ADMIN_EMAILS?.trim() ?? "";
  return new Set(raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = (req as AuthenticatedRequest).auth;

  if (!auth) {
    return res.status(401).json(errorPayload("UNAUTHENTICATED", "Missing auth context."));
  }

  const adminEmails = getAdminEmails();

  if (adminEmails.size === 0 || !adminEmails.has(auth.email.toLowerCase())) {
    return res.status(403).json(errorPayload("FORBIDDEN", "Admin access required."));
  }

  next();
}
