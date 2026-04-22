import assert from "node:assert/strict";
import test from "node:test";
import { APP_ROUTES } from "@prode/shared";
import { resolveAuthGuardRedirect } from "./auth-guard";
import { resolveNextRoute } from "./login-screen";

test("resolveNextRoute sends incomplete profiles to profile", () => {
  assert.equal(resolveNextRoute("/matches", false), APP_ROUTES.profile);
});

test("resolveNextRoute keeps safe next route for completed profiles", () => {
  assert.equal(resolveNextRoute("/matches", true), "/matches");
  assert.equal(resolveNextRoute("https://evil.test", true), APP_ROUTES.home);
});

test("resolveAuthGuardRedirect sends unauthenticated users to login with next param", () => {
  assert.equal(resolveAuthGuardRedirect("unauthenticated", "/rankings"), `${APP_ROUTES.login}?next=%2Frankings`);
});

test("resolveAuthGuardRedirect sends incomplete authenticated profiles to profile", () => {
  assert.equal(resolveAuthGuardRedirect("authenticated", "/home", false), APP_ROUTES.profile);
  assert.equal(resolveAuthGuardRedirect("authenticated", APP_ROUTES.profile, false), null);
});
