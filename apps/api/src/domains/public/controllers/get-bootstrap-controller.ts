import { DEFAULT_PUBLIC_BOOTSTRAP } from "@prode/shared";
import type { Request, Response } from "express";
import { ok } from "../../../server/http/respond";

export function getBootstrapController(_req: Request, res: Response) {
  res.json(ok(DEFAULT_PUBLIC_BOOTSTRAP));
}
