# Prode Mundial_WS9_09042026

## Resumen de la sesion

Sesion dedicada a alinear el proyecto al fixture real oficial FIFA 2026 antes de entrar de lleno en `CARD 2`.

---

# 1. Cambio estructural cerrado

Se dejo atras la suposicion documental anterior de formato reducido.

Ahora el proyecto queda alineado a FIFA 2026 con:

- 48 equipos
- 12 grupos
- 104 partidos
- knockout real con:
  - `R32`
  - `R16`
  - `QF`
  - `SF`
  - `BRONZE`
  - `FINAL`

Tambien se ajusto la logica de ventana macro:

- cierre por kickoff del primer partido knockout
- ya no por kickoff del primer partido de octavos

---

# 2. Archivos clave tocados

## Contratos / codigo

- `packages/shared/src/constants/matches.ts`
- `apps/api/src/domains/matches/data/world-cup-2026.ts`
- `scripts/extract_fifa_world_cup_2026_schedule.py`
- `scripts/normalize_fifa_world_cup_2026_schedule.py`
- `package.json`

## Datos generados

- `apps/api/src/domains/matches/data/world-cup-2026-raw-schedule.json`
- `apps/api/src/domains/matches/data/world-cup-2026-normalized-matches.json`

## Documentacion binding alineada

- `docs/engineering/Prode Mundial - DATA MODEL.md`
- `docs/engineering/04. Prode Mundial - Data Model + Backend Logic Spec (MVP v1).md`
- `docs/engineering/03. Prode Mundial - API Specification (Endpoints + Contracts + Payloads).md`
- `docs/engineering/Prode Mundial - STATE MATRIX + BUSINESS STATES SPEC (MVP v1).md`
- `docs/engineering/Prode Mundial - BACKEND EXECUTION MODEL (Jobs + Scoring + Orchestration) — MVP v1.md`
- `docs/product/00. Prode Mundial - MVP CANON.md`
- `docs/product/05. Prode Mundial - Functional Specification v1.md`
- `docs/product/06. Prode Mundial - UX Sitemap Wireframe Brief.md`
- `docs/backlog/EPIC 2 — Fixtures, Match Detail & Match Predictions.md`
- `docs/backlog/EPIC 5 — Macro Picks & Post-Group Adjustment.md`
- `docs/backlog/EPIC 7 — Home Aggregation, Points UX & Daily Loop.md`

---

# 3. Estado resultante

- ya existe fuente oficial FIFA reproducible dentro del repo
- ya existe extractor del PDF oficial
- ya existe dataset crudo agrupado por numero oficial de partido
- ya existe dataset normalizado con UTC y slots knockout
- el modelo del proyecto ya no contradice el fixture real 2026

Validaciones ejecutadas:

- `./pnpm --filter @prode/shared build`
- `./pnpm --filter @prode/api typecheck`

Ambas OK.

---

# 4. Proximo paso recomendado

En la proxima ventana, entrar directo a:

1. cerrar `CARD 2`
2. convertir el dataset normalizado en seed real de:
   - `teams`
   - `groups`
   - `matches`
3. documentar como correr el seed local
4. dejar el repo listo para arrancar `CARD 3`
