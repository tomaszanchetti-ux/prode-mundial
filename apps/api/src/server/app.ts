import express from "express";
import { getHealthController } from "../domains/health/controllers/get-health-controller";
import { getLeagueStandingsController } from "../domains/leagues/controllers/get-league-standings-controller";
import { getLeaguesController } from "../domains/leagues/controllers/get-leagues-controller";
import { getMatchDetailController } from "../domains/matches/controllers/get-match-detail-controller";
import { getMatchesController } from "../domains/matches/controllers/get-matches-controller";
import { putMatchPredictionController } from "../domains/matches/controllers/put-match-prediction-controller";
import { getPointsController } from "../domains/points/controllers/get-points-controller";
import { getBootstrapController } from "../domains/public/controllers/get-bootstrap-controller";
import { getPreTournamentSummaryController } from "../domains/tournament/controllers/get-pre-tournament-summary-controller";
import { getTuMundialController } from "../domains/tournament/controllers/get-tu-mundial-controller";
import { getMeController } from "../domains/users/controllers/get-me-controller";
import { patchMeController } from "../domains/users/controllers/patch-me-controller";
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";

export function createApp() {
  const app = express();
  const allowedOrigin = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", allowedOrigin);
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
  app.get("/api/v1/me", requireAuth, getMeController);
  app.get("/api/v1/me/pre-tournament", requireAuth, getPreTournamentSummaryController);
  app.get("/api/v1/me/tournament", requireAuth, getTuMundialController);
  app.get("/api/v1/points", requireAuth, getPointsController);
  app.get("/api/v1/leagues", requireAuth, getLeaguesController);
  app.get("/api/v1/leagues/:leagueId/standings", requireAuth, getLeagueStandingsController);
  app.get("/api/v1/matches", requireAuth, getMatchesController);
  app.get("/api/v1/matches/:matchId", requireAuth, getMatchDetailController);
  app.put("/api/v1/matches/:matchId/prediction", requireAuth, putMatchPredictionController);
  app.patch("/api/v1/me", requireAuth, patchMeController);

  app.use(errorHandler);

  return app;
}
