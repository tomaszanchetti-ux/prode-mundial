# Prode Mundial — Plan Maestro "Ship It"

> Definido: WS30 — 14/04/2026
> Autor: Tomás + Claude Code
> Estado: **APROBADO — Ejecución desde WS31**

---

## Contexto

Tras auditoría completa del proyecto (29 sesiones previas con Codex), se identificaron gaps críticos que impiden el deploy. Este plan prioriza **shipping sobre perfección** con un approach pragmático de 3 fases.

---

## FASE 1 — Cleanup & Deploy a GCP

**Objetivo: app live, usable, con datos reales**

### 1A — Integrar API de resultados en vivo (CRÍTICO) ✅ DONE — WS31

**Problema**: No existe integración con ninguna API de fútbol. Resultados se seedean a mano.

**Solución**:
- Integrar **football-data.org** (gratuita, 10 req/min, cubre WC2026) o **API-Football** como alternativa
- Crear `MatchSyncService` en `apps/api/src/domains/matches/services/`
- Job en `apps/jobs/`: sync cada 2 minutos durante partidos en vivo
- Endpoint admin protegido como fallback manual: `POST /api/v1/admin/matches/:matchId/result`
- Mapeo de estados externos → estados internos (`scheduled` → `live` → `finished`)
- Logging de cada sync para auditoría

**Flujo completo**:
```
Cloud Scheduler (cada 2 min)
  → Cloud Run Job: match-result-sync
    → football-data.org API: GET /matches?status=LIVE,FINISHED
      → Para cada match con resultado nuevo:
        → Firestore: update match (status, scores, winnerTeamId)
        → Trigger: scoreMatch() si status = finished
        → Trigger: rebuildUserAggregates() por user afectado
        → Trigger: rebuildLeagueStandings() por liga afectada
```

**Estimación**: 1-2 sesiones

---

### 1B — Migrar estilos a Tailwind CSS

**Problema**: ~5,400 líneas de inline styles en objetos JS. Imposible iterar.

**Solución**:
- Instalar Tailwind CSS en `apps/web`
- Configurar `tailwind.config.ts` con tokens del design system actual
- Migrar screen por screen: inline `style={{}}` → clases Tailwind
- Eliminar `tokens.ts` como fuente de estilos (mantener como referencia temporal)
- Orden de migración:
  1. `packages/ui/src/components.tsx` (component library primero)
  2. `bottom-nav.tsx` + `layout.tsx` (shell)
  3. `login-screen.tsx` (landing)
  4. `home-screen.tsx`
  5. `matches-screen.tsx` + `match-detail-screen.tsx`
  6. `leagues-screen.tsx` + `league-detail-screen.tsx`
  7. `rankings-screen.tsx`
  8. `macro-picks-screen.tsx`

**Estimación**: 2-3 sesiones

---

### 1C — Rediseño UI

**Problema**: Dark mode forzado, componentes enormes, sin responsive real.

**Solución**:
- **Light mode default** — fondo blanco/gris claro, acentos azul deportivo
- **Partir componentes grandes**:
  - `macro-picks-screen.tsx` (755 líneas) → 4-5 componentes
  - `home-screen.tsx` (587 líneas) → 3-4 componentes
  - `matches-screen.tsx` (529 líneas) → 3-4 componentes
  - `match-detail-screen.tsx` (515 líneas) → 3-4 componentes
- **Responsive real** con breakpoints Tailwind (`sm`, `md`, `lg`)
- **Bottom nav fix**: position sticky correcto, z-index manejado
- **Login responsive**: stack vertical en mobile
- **Copy-to-clipboard** en invite links

**Se ejecuta en paralelo con 1B** (migración + rediseño van juntos)

**Estimación**: incluido en 1B

---

### 1D — PWA (Progressive Web App)

**Objetivo**: app instalable desde el browser, sin app stores.

**Implementación**:
- `public/manifest.json`:
  - `name`: "Prode Mundial"
  - `short_name`: "Prode"
  - `display`: "standalone"
  - `theme_color` + `background_color`
  - Íconos 192x192 y 512x512
- Service Worker (via `next-pwa` o config nativa de Next.js)
- Meta tags en `app/layout.tsx`:
  - `apple-mobile-web-app-capable`
  - `apple-mobile-web-app-status-bar-style`
  - `theme-color`
- Splash screens iOS/Android
- **Push notifications (FCM)**: opcional, se evalúa en Fase 2

**Estimación**: 1 sesión

---

### 1E — Deploy completo a GCP

| Componente | Servicio GCP | Config |
|---|---|---|
| Web (Next.js) | Firebase Hosting + Cloud Functions | SSR via functions, CDN global |
| API (Express) | Cloud Run | Auto-scale, min 0 instances |
| Jobs | Cloud Run Jobs | match-lock, match-sync, scoring, rebuild |
| Scheduler | Cloud Scheduler | Triggers para jobs |
| DB | Firestore | Ya configurado |
| Auth | Firebase Auth | Ya configurado |
| Domain | Firebase Hosting | Custom domain si disponible |

**Pasos**:
1. Crear proyecto Firebase (o reusar existente)
2. Configurar Firebase Hosting con framework support (Next.js)
3. Dockerizar API → push a Artifact Registry → deploy Cloud Run
4. Configurar Cloud Run Jobs para cada job
5. Cloud Scheduler: cron expressions para cada trigger
6. Variables de entorno en Secret Manager
7. CI/CD: GitHub Actions para deploy automático en push a main

**Estimación**: 1-2 sesiones

---

## FASE 2 — UX Polish

**Objetivo: que se sienta como una app premium**

1. **Score picker rediseñado** — más grande, más táctil, feedback háptico
2. **Toast unificado** — un solo patrón de notificación (actualmente hay 3 patrones distintos)
3. **Loading skeletons reales** — que matcheen el contenido real
4. **Animaciones básicas** — transiciones de página, micro-interactions
5. **Empty states** — ilustraciones + CTAs claros
6. **Keyboard navigation** — arrow keys en ScoreInput
7. **Form validation** — feedback inline en tiempo real

**Estimación**: 2 sesiones

---

## FASE 3 — Pre-launch

**Objetivo: listo para usuarios reales**

1. **QA mobile** — iPhone + Android, todos los flows
2. **SEO** — meta tags, OpenGraph, Twitter cards
3. **Firebase Analytics** — eventos clave (predict, join league, share)
4. **Error boundaries** — graceful degradation
5. **Push notifications (FCM)** — "Faltan 2h para cerrar tu pronóstico"
6. **Performance** — React.memo en listas, lazy loading de rutas

**Estimación**: 1-2 sesiones

---

### 1F — PoC Champions League (BACKLOG)

**Objetivo**: Validar el flujo completo con partidos reales de Champions League antes del Mundial.

**Contexto**: football-data.org cubre Champions League (CL) en el free tier. Podemos seedear partidos de CL en Firestore, hacer que amigos carguen predicciones, y verificar el sync + scoring con resultados reales.

**Implementación**:
- Hacer `FOOTBALL_DATA_COMPETITION` configurable (actualmente hardcoded `WC`)
- Script de seed rápido para partidos de CL (cuartos/semis/final)
- Probar con grupo reducido de usuarios reales
- Validar: predicciones → lock → sync resultados → scoring → standings

**Beneficio**: prueba end-to-end real antes del Mundial, feedback de UX de usuarios reales.

**Estimación**: 1 sesión

---

## Timeline estimado

| Fase | Sesiones | Prioridad |
|---|---|---|
| 1A — API resultados | ~~1-2~~ ✅ DONE (WS31) | P0 CRÍTICO |
| 1B+1C — Tailwind + Rediseño | 2-3 | P0 |
| 1D — PWA | 1 | P1 |
| 1E — Deploy GCP | 1-2 | P0 |
| 1F — PoC Champions | 1 | P1 |
| 2 — UX Polish | 2 | P1 |
| 3 — Pre-launch | 1-2 | P2 |
| **TOTAL** | **8-12 sesiones** | — |

---

## Reglas de ejecución

1. **Ship > Perfect** — cada sesión debe dejar algo deployable
2. **No más documentación innecesaria** — el código es la spec
3. **Componentes < 150 líneas** — si es más largo, se parte
4. **Test lo que importa** — scoring pipeline y auth, no cada botón
5. **Deploy temprano** — no esperar a que todo esté perfecto para subir
6. **Mobile-first real** — diseñar en 375px, escalar hacia arriba
