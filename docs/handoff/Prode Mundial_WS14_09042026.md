# Prode Mundial_WS14_09042026

## Resumen de cierre

Sesión enfocada en cerrar el primer corte real del loop competitivo y en dejar operativo un workflow local estable para demo data.

Resultado principal:

- ya existe una base funcional de `Epic 3` con:
  - puntos por usuario
  - standings por liga materializados
  - scoring match-level
  - UI mínima conectada para `Posiciones` y `Ligas`
- además quedó formalizado el flujo de demo data:
  - seed explícito
  - reset explícito
  - rebuild demo completo en un paso

Esta sesión dejó el entorno listo para avanzar sobre `Epic 4` sin depender de datos manuales o inconsistentes.

---

# 1. Objetivo logrado

Se cerró una primera capa competitiva usable de punta a punta:

- contracts shared nuevos para `points` y `leagues`
- endpoints reales:
  - `GET /api/v1/points`
  - `GET /api/v1/leagues`
  - `GET /api/v1/leagues/:leagueId/standings`
- scoring engine puro para partidos
- recálculo de aggregates de usuario
- materialización de `leagueStandings`
- pantallas web de:
  - `Ligas`
  - `Posiciones`

Adicionalmente:

- se sembró y validó una demo competitiva real sobre Firebase local
- se documentó el workflow dummy vs ingestión real

---

# 2. Decisiones cerradas

## 2.1 Estrategia de datos local

Quedó definida una lógica de dos capas:

- base real del torneo:
  - `teams`
  - `groups`
  - `matches`
- capa demo competitiva temporal:
  - `leagues`
  - `leagueMembers`
  - `leagueStandings`
  - usuarios demo
  - predicciones demo
  - partidos demo

Regla importante:

- la demo NO corre automáticamente en cada `pnpm dev`
- la demo sí se puede sembrar y resetear explícitamente

## 2.2 Testing con resultados reales

Quedó acordado que la validación con fuente externa real va en una etapa posterior y separada:

1. primero endurecer producto con demo data controlada
2. luego implementar ingestión real
3. probar primero con `dry-run`
4. persistir solo después de validar

---

# 3. Cambios principales

## Shared

- nuevos contratos y schemas para:
  - `points`
  - `leagues`
  - `standings`
- nuevos códigos de error públicos para dominio leagues

## API

- dominio nuevo `leagues`
- dominio nuevo `points`
- `score-match` y `scoring-engine`
- servicio reusable de aggregates de usuario
- scripts nuevos:
  - `seed:competition-demo`
  - `reset:competition-demo`
  - `fresh:competition-demo`

## Web

- `LeaguesScreen` conectada a datos reales
- `RankingsScreen` conectada a:
  - puntos
  - standings por liga

## DX / Scripts

- nuevo comando raíz:
  - `pnpm dev:demo`

---

# 4. Validaciones ejecutadas

- `corepack pnpm --filter @prode/shared build`
- `corepack pnpm --filter @prode/api typecheck`
- `corepack pnpm --filter @prode/api test`
- `corepack pnpm --filter @prode/web typecheck`
- `corepack pnpm --filter @prode/web test`
- `corepack pnpm --filter @prode/api fresh:competition-demo`

Todas OK al cierre.

Resultado validado del workflow demo:

- `reset:competition-demo` limpia demo anterior
- recompone aggregates del usuario real ancla si existía
- `seed:competition-demo` vuelve a sembrar:
  - 2 ligas demo
  - 2 partidos demo
  - 4 usuarios con predicciones demo
  - scoring + standings recalculados

---

# 5. Estado Git

- branch de trabajo durante la sesión:
  - `main`
- working tree al cierre de implementación:
  - cambios reales de producto + docs + handoff
- pedido del usuario:
  - cerrar sesión formalmente con docs, commit y push

---

# 6. Próximo paso recomendado

Entrar a `Epic 4 — Leagues, Invite Flow, Membership & League Detail`.

Orden sugerido:

1. `POST /api/v1/leagues`
2. `GET /api/v1/leagues`
3. `POST /api/v1/leagues/join`
4. `GET /api/v1/leagues/:leagueId`
5. conectar detalle de liga y navegación hacia standings

Con el entorno demo ya estable, esta épica se puede validar mucho más rápido y con menos fricción.
