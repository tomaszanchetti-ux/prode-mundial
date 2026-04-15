# Prode Mundial_WS30_14042026

## Resumen de cierre

Sesión de **auditoría completa y toma de control** del proyecto por Claude Code (previamente gestionado por Codex).

Se realizó un reconocimiento exhaustivo de:

- código fuente completo (monorepo, frontend, backend, jobs, shared)
- documentación de producto y engineering (9 documentos canon)
- 29 handoff documents previos
- concepto original en `/Users/tzanchetti/Documents/NewCo - Proyectos/Prode Mundial`
- design system (`packages/ui` + `DESIGN_SYSTEM.md`)
- pipeline de scoring y estado de integración de datos

**Resultado principal: Plan Maestro de refactoreo definido y aprobado.**

---

# 1. Diagnóstico realizado

## 1.1 Estado positivo encontrado

- **Arquitectura backend sólida**: scoring idempotente, batch-first, event-driven
- **Contratos tipados**: Zod + TypeScript end-to-end con `packages/shared`
- **6 epics cerradas**: Auth, Matches, Pre-Tournament, Leagues, Macro Picks, Macro Scoring
- **Testing strategy definida** (3 fases documentadas)
- **Pipeline de scoring funcional**: `scorePrediction()` → `rebuildUserAggregates()` → `rebuildLeagueStandings()`

## 1.2 Problemas críticos identificados

### P0 — Sin integración de resultados en vivo
- **No existe conexión con ninguna API de fútbol** (football-data.org, API-Football, etc.)
- Los resultados se ingresan manualmente vía scripts de seed
- No hay endpoint admin para cargar resultados
- No hay job de sincronización automática
- El pipeline de scoring existe pero no tiene fuente de datos real

### P1 — UI/UX no apta para deploy
- ~5,400 líneas de JSX con inline styles (`style={{ }}`)
- Cero CSS framework (no Tailwind, no CSS modules)
- Dark mode forzado — no encaja con app deportiva casual
- Componentes enormes: `macro-picks-screen.tsx` (755 líneas), `home-screen.tsx` (587 líneas)
- Login screen sin breakpoints mobile
- Bottom nav con `bottom: 10px` hardcodeado
- No hay responsive real (cero media queries)

### P2 — Sin deployment
- Cero configuración de deploy después de 29 sesiones
- No hay `vercel.json`, `Dockerfile`, ni Firebase Hosting config
- Solo funciona en local

### P3 — Over-engineering del proceso
- V3 Elevation Plan con 8 stories secuenciales donde STO-UX-011 bloquea todo
- Más documentación que producto funcional
- Parálisis por análisis en iteraciones de UX

## 1.3 Decisión de deploy

- **Se descarta Vercel** — todo se despliega en Google Cloud
- Web: **Firebase Hosting**
- API: **Cloud Run**
- Jobs: **Cloud Run Jobs**
- Scheduler: **Cloud Scheduler**
- DB + Auth: **Firestore + Firebase Auth** (ya implementados)
- App mobile: **PWA** (Progressive Web App) — instalable sin app stores

---

# 2. Plan Maestro aprobado

Ver documento completo: `docs/product/MASTER_PLAN_SHIP_IT.md`

### FASE 1A — Integrar API de resultados en vivo
- football-data.org o API-Football
- Job automático de sync cada 2 min durante partidos
- Fallback manual vía endpoint admin

### FASE 1B — Migrar estilos a Tailwind CSS
- Eliminar todos los inline styles
- Configurar Tailwind en monorepo
- Tokens de diseño → `tailwind.config`

### FASE 1C — Rediseño UI
- Light mode como default
- Partir componentes de 500+ líneas
- Responsive real con breakpoints Tailwind
- Simplificar navegación y layouts

### FASE 1D — PWA
- `manifest.json` + service worker + meta tags mobile
- Splash screen + ícono
- Instalable desde browser

### FASE 1E — Deploy a GCP
- Firebase Hosting (web)
- Cloud Run (API)
- Cloud Run Jobs + Cloud Scheduler (scoring, lock, sync)

### FASE 2 — UX Polish
- Score picker táctil
- Toast unificado
- Loading skeletons reales
- Copy-to-clipboard en invite links
- Animaciones básicas

### FASE 3 — Pre-launch
- QA mobile exhaustivo
- SEO + OpenGraph
- Firebase Analytics
- Error boundaries
- Push notifications (FCM) — opcional

---

# 3. Validaciones ejecutadas

- Lectura completa del codebase (frontend, backend, jobs, shared, docs)
- Auditoría de UI/UX (12 screens + component library + design system)
- Auditoría de scoring pipeline (scoring engine, state machine, jobs, seeding)
- Verificación de estado git (main limpio, up to date)

---

# 4. Cambio de herramienta

- **Sesiones WS1-WS29**: ejecutadas por Codex
- **A partir de WS30**: ejecutadas por **Claude Code**
- Motivo: necesidad de iteración rápida en UX/UI, control directo del dev server, y deploy

---

# 5. Punto exacto para retomar

**Próxima sesión (WS31): FASE 1A — Integración de API de resultados en vivo**

Orden de ejecución:
1. Evaluar football-data.org vs API-Football (rate limits, cobertura WC2026, pricing)
2. Crear servicio de sync en `apps/api/src/domains/matches/services/`
3. Crear job de sync en `apps/jobs/`
4. Endpoint admin de fallback manual
5. Test end-to-end del flujo: API externa → Firestore → scoring → standings

Frontera:
- No abrir UI en WS31 (salvo verificación de datos)
- No tocar scoring engine (ya funciona)
- Foco 100% en que entren datos reales al sistema
