import express from "express";
import { getHealthController } from "../domains/health/controllers/get-health-controller";
import { getBootstrapController } from "../domains/public/controllers/get-bootstrap-controller";
import { getMeController } from "../domains/users/controllers/get-me-controller";
import { patchMeController } from "../domains/users/controllers/patch-me-controller";
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", getHealthController);
  app.get("/api/v1/public/bootstrap", getBootstrapController);
  app.get("/api/v1/me", requireAuth, getMeController);
  app.patch("/api/v1/me", requireAuth, patchMeController);

  app.use(errorHandler);

  return app;
}
