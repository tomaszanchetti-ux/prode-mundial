# Prode Mundial — WS32 (14/04/2026)

## Objetivo
FASE 1B — Setup Tailwind CSS v4 + inicio de migración inline styles → className

## Branch
`epic/07-tailwind-migration` (commit `f574609`)

## Lo que se hizo

### Card 1 — Setup Tailwind v4
- Instalado `tailwindcss`, `@tailwindcss/postcss`, `postcss` en `apps/web`
- Creado `postcss.config.mjs` con plugin `@tailwindcss/postcss`
- Creado `globals.css` con `@import "tailwindcss"` + `@theme` mapeando todos los tokens de `tokens.ts`
- Conectado en `layout.tsx` con `import "./globals.css"`
- Verificado: build OK, convive con inline styles existentes

### Card 2 — Migración `packages/ui/src/components.tsx`
- **914 → ~490 líneas** (~46% reducción)
- Eliminados TODOS los inline style objects (buttonToneStyles, statusToneStyles, cardBaseStyle, etc.)
- Eliminado import de `tokens.ts` — 0 dependencias de tokens en componentes
- 13 componentes migrados a className
- Creadas ~30 CSS utility classes en `@layer components` (btn-*, status-*, card-*, hero-*, score-*, etc.)
- Agregado `@source` para que Tailwind escanee `packages/ui/src`

### Card 3 — Migración bottom-nav + protected layout
- `bottom-nav.tsx`: 65→40 líneas, eliminados imports de tokens
- `(protected)/layout.tsx`: 69→48 líneas, eliminados imports de tokens

### Card 4 — Migración login-screen
- `login-screen.tsx`: 293→213 líneas, eliminados 4 imports de tokens
- Agregadas CSS classes: `login-hero-bg`, `step-card`, `email-input`, `alert-error`, `alert-success`

## Métricas
- **-380 líneas netas** (472 insertions, 573 deletions)
- **4 archivos** migrados de inline styles a Tailwind className
- **2 archivos nuevos** (postcss.config.mjs, globals.css)
- **Build:** OK · **Tests:** 71/71 pass · **Visual:** sin regresiones

## Estrategia de migración

### Separación CSS vs Tailwind
- **CSS classes** (`@layer components`): gradientes complejos, tratamientos visuales compuestos (backgrounds multi-capa, button variants, status tones)
- **Tailwind utilities**: layout (grid/flex/gap/padding), sizing, typography, colores simples, estados (cursor, opacity)
- **style prop**: solo para overrides puntuales donde Tailwind class merging es unreliable (gap/padding en Card consumers)

### Tokens
- `globals.css @theme` mapea 1:1 con `tokens.ts`
- Clases resultantes: `bg-bg-surface`, `text-text-primary`, `border-border-subtle`, `rounded-lg`, `shadow-soft`, etc.
- `tokens.ts` se mantiene como referencia — screens no migradas aún lo importan

## Próxima sesión (WS33)

### Archivos pendientes de migrar (orden del plan maestro)
1. **`home-screen.tsx`** (~587 líneas) — el más grande
2. `matches-screen.tsx` (~529 líneas)
3. `match-detail-screen.tsx` (~515 líneas)
4. `leagues-screen.tsx` (~444 líneas)
5. `league-detail-screen.tsx`
6. `rankings-screen.tsx`
7. `macro-picks-screen.tsx` (~755 líneas)
8. Landing page, profile, tournament, modals

### Patrón a seguir
Cada screen: leer → migrar inline styles → agregar CSS classes si hacen falta → build → visual → commit atómico

### Archivos de referencia
- `globals.css` — todas las CSS classes disponibles
- `components.tsx` — ejemplo de componentes ya migrados
- `MASTER_PLAN_SHIP_IT.md` — plan general

## Dev
- `corepack pnpm --filter @prode/web dev` → `http://localhost:3000`
- Build: `corepack pnpm --filter @prode/web build`
- Tests: `corepack pnpm test` (71 pass)
