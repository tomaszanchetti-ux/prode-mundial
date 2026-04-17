import express from "express";
import { getHealthController } from "../domains/health/controllers/get-health-controller";
import { getLeagueDetailController } from "../domains/leagues/controllers/get-league-detail-controller";
import { getLeagueInvitePreviewController } from "../domains/leagues/controllers/get-league-invite-preview-controller";
import { getLeagueStandingsController } from "../domains/leagues/controllers/get-league-standings-controller";
import { getLeaguesController } from "../domains/leagues/controllers/get-leagues-controller";
import { postJoinLeagueController } from "../domains/leagues/controllers/post-join-league-controller";
import { postLeaguesController } from "../domains/leagues/controllers/post-leagues-controller";
import { getMacroPicksController } from "../domains/macro-picks/controllers/get-macro-picks-controller";
import { postMacroAdjustmentController } from "../domains/macro-picks/controllers/post-macro-adjustment-controller";
import { putMacroPicksController } from "../domains/macro-picks/controllers/put-macro-picks-controller";
import { getMatchDetailController } from "../domains/matches/controllers/get-match-detail-controller";
import { getMatchesController } from "../domains/matches/controllers/get-matches-controller";
import { postMatchResultController } from "../domains/matches/controllers/post-match-result-controller";
import { putMatchPredictionController } from "../domains/matches/controllers/put-match-prediction-controller";
import { getPointsController } from "../domains/points/controllers/get-points-controller";
import { getBootstrapController } from "../domains/public/controllers/get-bootstrap-controller";
import { getPreTournamentSummaryController } from "../domains/tournament/controllers/get-pre-tournament-summary-controller";
import { getTournamentProjectionController } from "../domains/tournament/controllers/get-tournament-projection-controller";
import { getTuMundialController } from "../domains/tournament/controllers/get-tu-mundial-controller";
import { getMeController } from "../domains/users/controllers/get-me-controller";
import { patchMeController } from "../domains/users/controllers/patch-me-controller";
import { requireAuth } from "./middleware/auth";
import { requireAdmin } from "./middleware/require-admin";
import { errorHandler } from "./middleware/error-handler";

export function createApp() {
  const app = express();

  // Orígenes permitidos:
  //  - PRODE_ALLOWED_ORIGINS: lista CSV (preferido en prod).
  //  - NEXT_PUBLIC_WEB_URL: fallback un-solo-origen.
  //  - Default: localhost:3000 para dev.
  const allowedOrigins = (process.env.PRODE_ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    // Reflejamos el Origin solo si está en la allowlist. Si no hay Origin
    // (server-to-server) no se setea el header y se deja pasar la request.
    if (typeof requestOrigin === "string" && allowedOrigins.includes(requestOrigin)) {
      res.header("Access-Control-Allow-Origin", requestOrigin);
      res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    next();
  });
  app.use(express.json());

  app.get("/health", getHealthController);
  app.get("/api/v1/public/bootstrap", getBootstrapController);
  app.get("/api/v1/public/leagues/invite/:inviteToken", getLeagueInvitePreviewController);
  app.get("/api/v1/me", requireAuth, getMeController);
  app.get("/api/v1/me/pre-tournament", requireAuth, getPreTournamentSummaryController);
  app.get("/api/v1/me/tournament", requireAuth, getTuMundialController);
  app.get("/api/v1/me/tournament/projection", requireAuth, getTournamentProjectionController);
  app.get("/api/v1/points", requireAuth, getPointsController);
  app.get("/api/v1/macro-picks", requireAuth, getMacroPicksController);
  app.put("/api/v1/macro-picks", requireAuth, putMacroPicksController);
  app.post("/api/v1/macro-picks/adjustment", requireAuth, postMacroAdjustmentController);
  app.get("/api/v1/leagues", requireAuth, getLeaguesController);
  app.post("/api/v1/leagues", requireAuth, postLeaguesController);
  app.post("/api/v1/leagues/join", requireAuth, postJoinLeagueController);
  app.get("/api/v1/leagues/:leagueId", requireAuth, getLeagueDetailController);
  app.get("/api/v1/leagues/:leagueId/standings", requireAuth, getLeagueStandingsController);
  app.get("/api/v1/matches", requireAuth, getMatchesController);
  app.get("/api/v1/matches/:matchId", requireAuth, getMatchDetailController);
  app.put("/api/v1/matches/:matchId/prediction", requireAuth, putMatchPredictionController);
  app.post("/api/v1/admin/matches/:matchId/result", requireAuth, requireAdmin, postMatchResultController);
  app.patch("/api/v1/me", requireAuth, patchMeController);

  app.use(errorHandler);

  return app;
}
