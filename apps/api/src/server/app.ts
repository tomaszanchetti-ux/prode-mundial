import express from "express";
import { getHealthController } from "../domains/health/controllers/get-health-controller";
import { getMatchDetailController } from "../domains/matches/controllers/get-match-detail-controller";
import { getMatchesController } from "../domains/matches/controllers/get-matches-controller";
import { getBootstrapController } from "../domains/public/controllers/get-bootstrap-controller";
import { getMeController } from "../domains/users/controllers/get-me-controller";
import { patchMeController } from "../domains/users/controllers/patch-me-controller";
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";

export function createApp() {
  const app = express();
  const allowedOrigin = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", allowedOrigin);
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    next();
  });
  app.use(express.json());

  app.get("/health", getHealthController);
  app.get("/api/v1/public/bootstrap", getBootstrapController);
  app.get("/api/v1/me", requireAuth, getMeController);
  app.get("/api/v1/matches", requireAuth, getMatchesController);
  app.get("/api/v1/matches/:matchId", requireAuth, getMatchDetailController);
  app.patch("/api/v1/me", requireAuth, patchMeController);

  app.use(errorHandler);

  return app;
}
