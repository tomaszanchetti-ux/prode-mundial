import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { APP_ROUTES } from "@prode/shared";
import { resolveAuthGuardRedirect } from "./auth-guard";
import { LoginScreenView, resolveHelperTone, resolveNextRoute } from "./login-screen";

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

test("resolveHelperTone marks auth errors and success states correctly", () => {
  assert.equal(resolveHelperTone("Sesion invalida", null), "error");
  assert.equal(resolveHelperTone(null, "Te enviamos un magic link. Revisa tu email."), "success");
  assert.equal(resolveHelperTone(null, "Este magic link expiró."), "error");
  assert.equal(resolveHelperTone(null, null), null);
});

test("LoginScreenView renders the expected auth actions and helper message", () => {
  const html = renderToStaticMarkup(
    createElement(LoginScreenView, {
      email: "player@example.com",
      helperMessage: "Te enviamos un magic link. Revisa tu email y vuelve desde ese link.",
      isConfigured: true,
      isEmailLink: true,
      isSubmitting: false,
      onCompleteMagicLink: () => undefined,
      onEmailChange: () => undefined,
      onGoogleLogin: () => undefined,
      onSendMagicLink: () => undefined
    })
  );

  assert.match(html, /Continuar con Google/);
  assert.match(html, /Enviar magic link/);
  assert.match(html, /Completar ingreso con este magic link/);
  assert.match(html, /Te enviamos un magic link/);
  assert.match(html, /Tu proximo partido te esta esperando/);
});

test("LoginScreenView warns when Firebase is not configured", () => {
  const html = renderToStaticMarkup(
    createElement(LoginScreenView, {
      email: "",
      helperMessage: null,
      isConfigured: false,
      isEmailLink: false,
      isSubmitting: false,
      onCompleteMagicLink: () => undefined,
      onEmailChange: () => undefined,
      onGoogleLogin: () => undefined,
      onSendMagicLink: () => undefined
    })
  );

  assert.match(html, /Firebase no está configurado todavía en este entorno/);
});
