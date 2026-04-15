# Prode Mundial — WS38 (15/04/2026)

## Resumen
**EPIC 09 — FASE 1D (PWA) completada y mergeada a `main`** (`358da30`).

App instalable desde browser. Manifest + íconos + service worker + install prompt + página offline. Listo para FASE 1E (deploy a GCP).

---

## Cards ejecutadas (una por turno)

### C1 — Manifest + meta tags
- `apps/web/public/manifest.webmanifest` — name, short_name, start_url, scope, display standalone, theme/bg color `#0052CC`, categories sports.
- `apps/web/src/app/layout.tsx` — `metadata` export (manifest, title template, icons, appleWebApp) + `viewport` export (themeColor, viewportFit cover para notch).

### C2 — Íconos PNG (logo oficial)
- Fuente: `Mundial 2026_Logo.png` (225×225, blanco) — trademark FIFA oficial, decisión de Tomás para MVP.
- Pipeline Python/PIL: remover fondo blanco (threshold RGB > 240) → bbox crop → componer sobre brand `#0052CC` con safe area.
- Generados: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` (62% safe area), `apple-touch-icon.png` (180), `favicon-32.png`.

### C3 — Service Worker
- `apps/web/public/sw.js` — SW manual (no next-pwa, evita fricción con Turbopack).
- Estrategias:
  - Navegación (HTML) → **network-first** con fallback a `/offline`
  - `/_next/static/*` → **cache-first** (inmutables)
  - Imágenes/íconos → **stale-while-revalidate**
  - `/api/*` → **network-only**
  - Cross-origin (Firebase, football-data) → sin intercepción
- `skipWaiting` + `clients.claim` al activar. Listener `SKIP_WAITING` para update-prompt futuro.
- `apps/web/src/components/pwa/service-worker-register.tsx` — registra SW **solo en producción** (evita conflictos con HMR).

### C4 — Install prompt
- `use-install-prompt.ts` — hook que captura `beforeinstallprompt`, detecta `display-mode: standalone` y iOS (UA). Expone `promptInstall()` y flags `canInstall`, `hasNativePrompt`, `isIOS`, `isStandalone`.
- `install-app-card.tsx` — Card en `/profile` con botón nativo (Chrome/Android) o instrucciones "Compartir → Agregar a pantalla de inicio" (iOS). Se auto-esconde si ya está instalada.

### C5 — Página offline
- `apps/web/src/app/offline/page.tsx` — standalone (sin providers de red), paleta Stadium Light, CTA Reintentar + link al home.
- Precacheada por el SW durante install.

### C6 — QA + merge
- Typecheck web: limpio.
- Tests web: 29/29 pass.
- Sub-agente QA: APTO con observaciones no-bloqueantes.
- Verificación dev: manifest 200, sw.js 200, 5 íconos 200, `/offline` 200 + screenshot OK. SW no se registra en dev (correcto).
- Commit `10d0bc3` + merge `358da30` a main + push origin main.

---

## Smoke-test pendiente (prod build)

El SW y el install prompt nativo **solo funcionan en prod build**. Antes del deploy (FASE 1E), correr:

```bash
cd apps/web
pnpm build && pnpm start
```

Chequear en DevTools:
- **Application → Manifest** — íconos visibles, sin warnings
- **Application → Service Workers** — `sw.js` activated + running
- **Lighthouse → PWA** — score objetivo ≥ 90
- **Install flow** — Chrome debería mostrar botón de instalación en la omnibar; `/profile` muestra botón "Instalar Prode"
- **Offline** — DevTools offline → recargar → cae a `/offline`

---

## Observaciones no-bloqueantes (del QA)

- Edge-case `beforeinstallprompt` antes del mount (reload con engagement previo en Chrome). No crítico.
- `install-app-card.tsx:11` — guard redundante `isStandalone || !canInstall` (cosmético).
- `themeColor` duplicado light/dark en `layout.tsx` — intencional (app light-only por ahora).
- `next-env.d.ts` auto-regen de Next 16, commiteado.

---

## Estado del MASTER_PLAN_SHIP_IT

- ✅ FASE 1A — API resultados (WS31)
- ✅ FASE 1B — Tailwind migration (WS34)
- ✅ FASE 1C — UI Light mode (WS37)
- ✅ **FASE 1D — PWA (WS38)** ← esta
- ⏳ **FASE 1E — Deploy GCP** (próxima)
- ⏳ FASE 1F — PoC Champions (backlog)
- ⏳ FASE 2 — UX Polish
- ⏳ FASE 3 — Pre-launch

---

## Próxima sesión (WS39)

**FASE 1E — Deploy a GCP**:
1. Dockerizar API (`apps/api`) → Artifact Registry → Cloud Run
2. Firebase Hosting con framework support para web (Next.js SSR)
3. Cloud Run Jobs para match-sync, scoring, rebuild
4. Cloud Scheduler para cron expressions
5. Variables en Secret Manager
6. Dominio (si hay disponible)
7. CI/CD con GitHub Actions (deploy en push a main)

**Antes de arrancar 1E**: correr smoke-test prod build arriba (si algo del SW rompe en prod, lo arreglamos ahí antes de deployar).

---

## Git

- Branch `epic/09-pwa` mergeada a `main` con `--no-ff` en `358da30`.
- Pusheado a `origin/main`.
- Commit atómico de la branch: `10d0bc3`.

## Commands útiles

```bash
# Dev desde root (web + api)
corepack pnpm dev

# Prod build web (smoke-test PWA)
cd apps/web && corepack pnpm build && corepack pnpm start

# Typecheck
corepack pnpm --filter @prode/web typecheck

# Tests
corepack pnpm --filter @prode/web test
```
