import type { Request, Response } from "express";
import { ok } from "../../../server/http/respond";

export function getHealthController(_req: Request, res: Response) {
  res.json(
    ok({
      status: "ok",
      service: "api"
    })
  );
}
