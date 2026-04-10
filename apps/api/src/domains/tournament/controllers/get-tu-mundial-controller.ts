import type { Request, Response } from "express";
import { ok } from "../../../server/http/respond";
import type { AuthContext } from "../../../server/auth/auth-context";
import { getTuMundial } from "../use-cases/get-tu-mundial";

type AuthenticatedRequest = Request & { auth: AuthContext };

export async function getTuMundialController(req: Request, res: Response) {
  const response = await getTuMundial((req as AuthenticatedRequest).auth.userId);
  res.json(ok(response));
}
