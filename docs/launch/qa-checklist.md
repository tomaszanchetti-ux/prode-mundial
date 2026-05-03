# Prode Mundial — QA Hardening Pre-Launch Checklist

**Fecha:** 2026-05-03 · **Owner:** Tomás · **Status:** En ejecución (EPIC 34)

Documento canónico para el proceso de QA Hardening pre-launch del V1 free. Cubre: gaps críticos detectados en code-review, checklist exhaustivo de testing por área, y plan de ejecución.

---

## 🚨 Gaps críticos — STATUS ACTUALIZADO 03/05 22:30

Análisis inicial (3 agents en paralelo) reportó 3 críticos. Verificación con Tomás dejó **1 crítico real**.

### 🔴 CRITICAL #1 · Free limits — `MAX_LEAGUES_PER_USER` NO existe

**Status:** ❌ NO IMPLEMENTADO (único gap crítico real)

| Lo que el plan canónico decía | Realidad en código |
|---|---|
| "max 3 ligas por user free" | NO existe guard en `create-league.ts` ni `join-league.ts`. Constante `MAX_LEAGUES_FREE` no existe. |
| "max 20 users por liga free" | ✅ SÍ existe (`LEAGUE_MEMBER_LIMIT = 20` en `packages/shared/src/constants/leagues.ts:1`, guard en [join-league.ts:32](apps/api/src/domains/leagues/use-cases/join-league.ts:32)) |
| flag `plan: 'free' \| 'gold'` o `isGold` en user | NO existe. UserProfile schema solo tiene `totalPoints`, `macroPoints`, `leaguesCount`, `profileCompleted` |

**Decisión 03/05:** hardcodear `MAX_LEAGUES_PER_USER = 3` para todos en V1. Cuando llegue EPIC 29 (Stripe), agregar bypass para gold.

**Implementación pendiente:**
- [ ] Constante `MAX_LEAGUES_PER_USER = 3` en `packages/shared/src/constants/leagues.ts`
- [ ] Guard en `POST /api/v1/leagues` (CREATE) → check count < 3 antes de crear
- [ ] Guard en `POST /api/v1/leagues/join` (JOIN) → check count < 3 antes de aceptar invite
- [ ] Source of truth = count runtime de `leagueMembers where userId = uid` (no `users.leaguesCount` cached)
- [ ] Error code nuevo: `USER_LEAGUE_LIMIT_REACHED` (HTTP 409)
- [ ] UI: copy del error friendly
- [ ] **Prerequisite:** endpoint `leave-league` + UI "salir de la liga" — verificado 03/05: **NO EXISTE**. Sin esto el cap es trampa-ratonera. **Bloqueante.**

---

### ✅ Gap descartado #2 · Firestore Security Rules

**Status:** ✅ **PERFECTAS** (verificado 03/05 con screenshot Cloud Console)

Las rules son `deny-all` para acceso client-side:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;  // DENY ALL — todo pasa por API + Admin SDK
    }
  }
}
```

Vector de ataque client-side completamente cerrado. Esto reduce drásticamente el blast radius de otras posibles vulnerabilidades.

**Pendiente menor:** versionar las rules en el repo (`firestore.rules`) para que estén en git history y deploy esté reproducible. No urgente.

---

### ✅ Gap descartado #3 · Private key en `.env`

**Status:** ✅ **FALSO POSITIVO**

Verificación 03/05:
- `.env` está en `.gitignore` desde commit inicial
- `.env` NUNCA fue tracked por git
- El "BEGIN PRIVATE KEY" detectado por el agent venía de `.env.example` con placeholder `replace-me` (template legítimo)
- Private key real solo vive en GCP Secret Manager + `.env` local de Tomás (no committeado)

---

## ⚠️ Gaps altos (fixables en QA Hardening)

| # | Gap | Severidad | Acción sugerida |
|---|---|---|---|
| 1 | No rate limiting en API (Cloud Run sin nativo) | HIGH | `express-rate-limit` middleware o Cloud Armor |
| 2 | Sin security headers (CSP, HSTS, X-Frame-Options) | HIGH | `helmet.js` en Express o headers manuales |
| 3 | Sin Sentry / Cloud Error Reporting | HIGH | Setup Sentry o `@google-cloud/error-reporting` para alerting |
| 4 | Invite tokens NUNCA expiran (no TTL field) | MEDIUM | Acceptable para V1 (ligas son perpetuas), revisar post-launch |
| 5 | Race condition narrow en prediction lock (min 59 → llega min 60) | LOW | Mitigado por job match-lock cada 5 min, OK para V1 |
| 6 | Sin staging environment (`main` → prod directo) | MEDIUM | Acceptable V1 (1 user real testea), considerar post-launch |
| 7 | Sin backup automático de Firestore | MEDIUM | Setup `gcloud firestore export` weekly |
| 8 | Sin tests E2E (Playwright) | MEDIUM | Cubrir manualmente en QA, agregar post-launch |
| 9 | Sin Cloud Monitoring dashboards / alerts | MEDIUM | Setup básico: error rate, latency p95, job failures |
| 10 | Sin audit trail de scoring (solo Cloud Logging) | LOW | Post-launch si hace falta compliance |

---

## ✅ Lo que SÍ está bien (verificado)

- ✅ Scoring exclusivo 5/2/0 ([scoring-engine.ts:29](apps/api/src/domains/matches/services/scoring-engine.ts:29))
- ✅ Macro scoring 20/10 ([macro-scoring-engine.ts:12](apps/api/src/domains/macro-picks/services/macro-scoring-engine.ts:12))
- ✅ Lock 60min antes kickoff ([prediction-domain.ts:34](apps/api/src/domains/matches/services/prediction-domain.ts:34))
- ✅ Match-sync idempotente con guard anti-overwrite kickoff ([match-sync-logic.ts:35](apps/jobs/src/domains/match-sync/services/match-sync-logic.ts:35))
- ✅ Jobs con check `isScored` para evitar doble scoring ([score-match.ts:53](apps/jobs/src/domains/match-sync/services/score-match.ts:53))
- ✅ Bracket hydration idempotente
- ✅ FCM tokens cleanup automático en `fcm-reminders` job
- ✅ Auth Bearer Firebase ID token + middleware `requireAuth`
- ✅ CORS allowlist con `PRODE_ALLOWED_ORIGINS` ([deploy-api.sh:82](infra/gcp/deploy-api.sh:82))
- ✅ Magic link Resend SMTP configurado (sesión 02/05)
- ✅ Web Share API + clipboard fallback en invites ([share-invite-button.tsx](apps/web/src/components/leagues/share-invite-button.tsx))
- ✅ `inviteLink` runtime-build (no stale en DB)
- ✅ ConsentBanner GDPR-compliant
- ✅ Service Worker + manifest + 5 splash screens iOS
- ✅ ~140 tests backend (matches, leagues, scoring)
- ✅ Health check `/health` + smoke test post-deploy en CI

---

## 📋 Checklist de testing por área

Marcar `[x]` cuando se valida. Hallazgo serio = card propia + fix antes de avanzar.

### A. Auth & Sessions

- [ ] Magic link llega al inbox real (Resend SMTP) en < 30s
- [ ] Magic link clickeado loguea correctamente
- [ ] Magic link expirado → mensaje claro al user
- [ ] Magic link reuse (clickear 2x mismo link) → comportamiento esperado
- [ ] Login con Google funciona (OAuth flow)
- [ ] Logout cierra sesión y redirige a `/login`
- [ ] Sesión persiste tras reload del browser
- [ ] Sesión persiste tras 24h
- [ ] Sin sesión → redirect a `/login` con `next=` param funcional
- [ ] Cookie sesión flags: HttpOnly, Secure, SameSite (verificar en DevTools → Application → Cookies)

### B. Onboarding flow primer-time user

- [ ] Login nuevo → fuerza completar `displayName` (min 2 chars)
- [ ] `country` opcional (acepta vacío)
- [ ] Profile completado → redirige a `/home`
- [ ] Display name validation: rechaza vacío, acepta unicode (acentos, ñ)

### C. Crear y unirse a ligas (CRÍTICO — bug invite ayer)

- [ ] Crear liga con nombre válido (3-40 chars) → success + invite link
- [ ] Crear liga nombre muy corto (<3) → error claro
- [ ] Crear liga nombre muy largo (>40) → error claro
- [ ] **Crear 4 ligas con cuenta free → ¿bloquea? ❌ HOY NO BLOQUEA (gap crítico #1)**
- [ ] Botón "Invitar" en `/leagues` → Web Share API native (mobile)
- [ ] Botón "Invitar" en desktop → fallback clipboard + visual feedback
- [ ] Mensaje compartido contiene: nombre liga + link directo + código corto
- [ ] Link recibido por amigo → preview pre-login funcional
- [ ] Click "Unirme" → si no logueado → flujo login → vuelve al join
- [ ] Unirme con código manual válido → success
- [ ] Unirme con código inválido → error `INVITE_INVALID`
- [ ] Unirme a liga ya member → error `ALREADY_LEAGUE_MEMBER`
- [ ] Unirme a liga full (20 users) → error `LEAGUE_CAPACITY_REACHED`
- [ ] Unirme a liga archivada → error `LEAGUE_INACTIVE`
- [ ] **Unirme a 4ta liga con cuenta free → ¿bloquea? ❌ HOY NO BLOQUEA**

### D. Predicciones

- [ ] Click en partido sin predicción → modal con CTA "Guardar"
- [ ] Click en partido ya predicho → modal con CTA "Modificar" ✅ (deployado hoy)
- [ ] Modificar predicción → guarda nuevo valor
- [ ] Marathon mode (next pending): "Guardar y seguir" / "Modificar y seguir"
- [ ] "Mas tarde" cierra sin guardar
- [ ] "X" cierra sin guardar (3er efecto distinto)
- [ ] Score input acepta solo enteros 0-9 (verificar)
- [ ] Submit con score vacío → bloqueado (button disabled)
- [ ] Submit en partido locked (kickoff < 60min) → error `MATCH_LOCKED`
- [ ] Submit en partido ya jugado → error `MATCH_LOCKED`
- [ ] Submit en knockout con teams sin resolver → error `PHASE_LOCKED`
- [ ] Submit en knockout con phase cerrada → error `PHASE_CLOSED`
- [ ] **Race condition:** abrir modal en min 59, esperar 90s, intentar guardar → error claro

### E. Scoring (post primer kickoff)

> Esta sección se valida POST 11/06 cuando empiece el Mundial. Pre-launch sólo verificar que la lógica está correcta en código (ya hecho).

- [ ] Predicción exacta (ej: 2-1 real, 2-1 pred) → 5 pts
- [ ] Predicción solo resultado (ej: 2-1 real, 3-2 pred) → 2 pts
- [ ] Predicción incorrecta → 0 pts
- [ ] `pointsAwarded` se setea en `predictions/{id}` post-scoring
- [ ] `users/{uid}.totalPoints` se actualiza
- [ ] `leagueStandings/{leagueId}/table/{userId}` se actualiza
- [ ] Re-correr scoring NO duplica puntos (idempotencia)

### F. Macro picks

- [ ] Seleccionar campeón → guarda
- [ ] Seleccionar subcampeón con team != campeón → success
- [ ] Seleccionar subcampeón con same team → error `SUB_CHAMPION_SAME_TEAM`
- [ ] Seleccionar subcampeón same half (en bracket) → error `SUB_CHAMPION_SAME_HALF`
- [ ] Seleccionar mejor jugador → guarda
- [ ] Macro picks ventana A (pre-grupos): scoring 20 pts si correcto
- [ ] Macro picks ventana B (ajuste post-grupos): scoring 10 pts si correcto
- [ ] Adjustment endpoint (cambiar pick post-grupos) funciona 1 sola vez
- [ ] 2do intento de adjustment → error `*_ADJUSTMENT_ALREADY_USED`

### G. Navegación + UX

- [ ] Bottom nav 4 tabs (Inicio · Predicciones · Resultados · Ligas) cambia bien
- [ ] Tab activo tiene fondo azul + texto blanco
- [ ] Botón profile en topbar abre `/profile`
- [ ] Language toggle ES ↔ EN funciona y persiste
- [ ] Volver atrás (botón nativo del browser) funciona en TODAS las pantallas sin perder estado
- [ ] Click en logo top → vuelve al home
- [ ] Modales: `Esc` cierra
- [ ] Modales: click fuera cierra
- [ ] Deep link `/leagues/join?token=XXX` funciona logueado y deslogueado

### H. Estados de pantalla (loading / error / empty)

- [ ] Home: skeleton 4 cards mientras carga
- [ ] Home: error → ErrorCard con retry funcional
- [ ] Home: sin matches pendientes → "Todo al día" hero
- [ ] Leagues: empty → CTA crear/unirme visible
- [ ] Leagues: loading → 4 skeleton rows
- [ ] Leagues: error → retry funcional
- [ ] Tournament: 2 skeleton cards
- [ ] Tournament: knockouts no abiertos → mensaje "se habilitan al cerrar grupos"
- [ ] Profile: error de save → ErrorCard
- [ ] API caído → ErrorCard en toda pantalla que dependa del API

### I. PWA

- [ ] Manifest `manifest.webmanifest` carga sin errores en DevTools
- [ ] Install banner aparece en Home **post primer-pick** (no al primer login)
- [ ] Install banner: "Más tarde" → no vuelve hasta 3 días
- [ ] iOS modal "Cómo instalar" → abre con instrucciones step-by-step
- [ ] App instalada → splash screen correcto en iPhone Pro
- [ ] App instalada → splash screen correcto en iPhone Pro Max
- [ ] App instalada → splash screen correcto en iPad
- [ ] Standalone mode → bottom nav respeta safe-area-inset-bottom
- [ ] Service Worker registrado (`navigator.serviceWorker.controller`)
- [ ] Offline → muestra `/offline` page
- [ ] Reload tras deploy → SW invalida cache y refresca

### J. Notificaciones (FCM)

- [ ] PermissionCard aparece en Home **a partir del día 7** (no antes)
- [ ] PermissionCard "Activar" → solicita permiso browser → si granted, registra FCM token
- [ ] FCM token persiste en `users/{uid}/fcmTokens/`
- [ ] PermissionCard "Ahora no" → no vuelve hasta inicio del Mundial (`tournamentStartAt`)
- [ ] Permiso denied → mensaje claro 4s
- [ ] FCM reminders 20-28h antes de kickoff → llega push (validar post-15/05 con kickoffs reales)
- [ ] Token inválido → cleanup automático en next job run

### K. Cookies / GDPR

- [ ] Banner aparece en primera visita (sin localStorage previo)
- [ ] "Aceptar todo" → analytics + ads activan
- [ ] "Rechazar todo" → solo essential cookies
- [ ] "Configurar" → modal granular (analytics toggle, ads toggle)
- [ ] Decisión persiste en localStorage `prode-mundial:consent`
- [ ] No tracking analytics antes de "accept"
- [ ] Banner NO vuelve a aparecer post-decisión

### L. Responsive / Mobile

- [ ] iPhone SE (375x667) → todo legible, sin overflow horizontal
- [ ] iPhone 14 Pro (390x844) → layout correcto
- [ ] iPhone 14 Pro Max (428x926) → layout correcto
- [ ] iPad Pro (1024x1366) → no se ve "estirado" raro
- [ ] Bottom nav siempre visible (sticky)
- [ ] Modales fullscreen en mobile
- [ ] Keyboard mobile no tapa inputs activos (en login + score input)
- [ ] Dark mode browser → app no rompe (si NO está implementado, OK)

### M. i18n

- [ ] Toggle ES → todos los strings cambian
- [ ] Toggle EN → todos los strings cambian
- [ ] Locale persiste en localStorage `prode-mundial:locale`
- [ ] No hay strings hardcodeados en español que no pasen por `copyForLocale`
- [ ] Datetime se formatea según locale (ej: "jue, 11 jun" vs "Thu, Jun 11")

### N. Performance (Lighthouse)

- [ ] LCP (Largest Contentful Paint) < 2.5s en mobile
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] FID (First Input Delay) < 100ms
- [ ] Bundle size razonable (< 300KB initial JS)
- [ ] Imágenes optimizadas (next/image)
- [ ] Fonts no causan FOUT/FOIT

### O. Seguridad

- [ ] **Firestore Security Rules:** verificar Cloud Console (CRITICAL)
- [ ] CORS allowlist solo permite orígenes legítimos (no `*`)
- [ ] Rate limiting (verificar si hay middleware o gap)
- [ ] Endpoints protegidos NO accesibles sin token válido (probar con token vacío, malformado, expirado)
- [ ] Endpoint `PUT /me` NO permite cambiar `userId` (verificar)
- [ ] Endpoint `PUT /predictions` NO permite predecir como otro user (sub-claim del JWT)
- [ ] Admin endpoint `/admin/matches/:id/result` SÓLO acepta emails en `PRODE_ADMIN_EMAILS`
- [ ] Sin secretos en código (grep `pk_live_`, `re_`, `AKIA`, `sk_*`)
- [ ] HTTPS only (sin recursos HTTP mixed content)
- [ ] Headers seguridad: CSP, HSTS, X-Frame-Options (gap conocido — fix en QA)

### P. Jobs (background)

- [ ] `match-lock-enforcement` cron `*/5 * * * *` corriendo (verificar último run en GCP Console)
- [ ] `match-result-sync` cron `*/10 * * * *` corriendo
- [ ] `score-macro` cron `*/30 * * * *` corriendo
- [ ] Logs de jobs sin errores recurrentes (last 24h)
- [ ] Job idempotente: re-correr manual NO duplica datos
- [ ] Cloud Scheduler service account tiene permiso `roles/run.invoker`

### Q. CI/CD

- [ ] Push a main → CI pasa typecheck + build + tests
- [ ] Deploy api se ejecuta solo si cambia `apps/api/**` o `packages/**`
- [ ] Deploy jobs se ejecuta solo si cambia `apps/jobs/**` o `packages/**`
- [ ] Deploy api hace smoke test `/health` post-deploy (8 attempts)
- [ ] Rollback procedure documentado y probado al menos 1 vez

### R. Data integrity (post-cleanup)

- [ ] 5 users reales en Firestore (Tomás + 4 amigos)
- [ ] 0 ligas dummy (verificado 03/05)
- [ ] 0 demo guests users (verificado 03/05)
- [ ] 104 matches con kickoff UTC correcto (Wikipedia-derived canonical)
- [ ] `BEST_PLAYER_ROSTER` mock activo (será reemplazado ~15/05 por nómina FIFA oficial)

---

## 🛠️ Plan de ejecución

### Fase 1 — Fix gaps críticos blockers (HOY)

**Sin estos no se puede launchear con confianza:**

1. **Verificar Firestore rules en Cloud Console.** Si está open, escribir `firestore.rules` mínimas + deploy.
2. **Verificar `.env` no esté en git history con private key.** Si está, rotar service account.
3. **Decidir free limits:**
   - **Opción A:** Hardcodear `MAX_LEAGUES_PER_USER = 3` para todos en V1 (sin flag plan). Simple, 1 hora de trabajo. Cuando llegue Stripe en EPIC 29, agregar bypass para gold.
   - **Opción B:** Dejar sin límite en V1. Riesgo: usuario problemático crea 50 ligas y rompe UX. Aceptable si Tomás controla a quién manda invite.
   - **Recomendación: Opción A** (simple + protege).

### Fase 2 — Approach de testing (HOY/MAÑANA)

**Recomendación: Híbrido — mezcla backend automation + UI manual con cuenta real.**

#### Backend (yo, antes de tu testing UI)
- Smoke E2E con `curl` contra prod API:
  - `GET /health`
  - `POST /api/v1/leagues` con tu Bearer token
  - `POST /api/v1/leagues/join` con código válido + inválido
  - `PUT /api/v1/matches/:id/prediction` con scores válidos + inválidos
- Verificación logs Cloud Run (errores last 24h, rate)
- Verificación Cloud Scheduler runs (último run de cada job, status)

#### UI manual (vos, con tu cuenta real)
- Recorrer cada checkbox de las secciones A-N usando tu cuenta `tomaszanchetti@gmail.com`
- Crear 1-2 ligas TEST (con prefijo "TEST_" para identificar después)
- Hacer 5-10 predicciones de prueba
- Probar invite a una de tus otras cuentas (ej: nicosol27, matihaure)
- Cleanup post-testing: borrar ligas TEST con script ad-hoc

#### Cleanup post-QA
- Script `cleanup-test-data.ts` que borra ligas con prefijo `TEST_` y predicciones de prueba
- Audit final read-only para confirmar prod limpio

### Fase 3 — 🚀 Launch V1 Free
- Mensaje WhatsApp a 10-20 conocidos con link a `https://app.prodemundial.org`
- Monitoreo activo primeras 48h: Cloud Run logs + FCM delivery + errores en console del browser

---

## 📌 Cards a abrir post-checklist (probables)

A medida que vayamos validando, cada hallazgo serio se vuelve card propia:

- [ ] CARD: Implementar `MAX_LEAGUES_PER_USER = 3` (depende de decisión Fase 1)
- [ ] CARD: Escribir `firestore.rules` (si gap confirmado)
- [ ] CARD: Setup Sentry / error reporting
- [ ] CARD: Add `helmet.js` para security headers
- [ ] CARD: Add rate limiting middleware
- [ ] CARD: Backup automático Firestore weekly
- [ ] CARD: Cleanup data de testing post-QA

---

**Última actualización:** 2026-05-03 sesión EPIC 34 WS2.
