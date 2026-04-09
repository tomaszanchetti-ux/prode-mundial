# Prode Mundial - BACKLOG.md

## Propósito

Este documento consolida el backlog ejecutable del proyecto.

Las `EPIC *.md` son el detalle principal del backlog.
Este archivo actúa como índice, secuencia y marco de priorización.

---

# 1. Regla importante

El backlog no es solo “la lista de épicas”.

El backlog incluye:

- épicas
- cards dentro de cada épica
- tasks dentro de cada card
- orden de ejecución
- dependencias

Las épicas son la capa superior del backlog, no el backlog completo.

---

# 2. Secuencia principal

## Epic 1

`EPIC 1 — Foundation, Auth, Bootstrap & App Shell.md`

Objetivo:

- bootstrap técnico base
- auth
- app shell
- contratos iniciales

## Epic 2

`EPIC 2 — Fixtures, Match Detail & Match Predictions.md`

Objetivo:

- fixtures
- detalle de partido
- guardado y edición de predicción

## Epic 3

`EPIC 3 — Scoring, Points & League Standings.md`

Objetivo:

- scoring match-level
- puntos
- standings por liga

## Epic 4

`EPIC 4 — Leagues, Invite Flow, Membership & League Detail.md`

Objetivo:

- crear liga
- join
- detalle de liga
- membership

Nota MVP:

- solo ligas con capacidad operativa de 20 miembros
- planes pagos quedan post-MVP

## Epic 5

`EPIC 5 — Macro Picks & Post-Group Adjustment.md`

Objetivo:

- picks macro
- ajuste post grupos

## Epic 6

`EPIC 6 — Macro Scoring, Rebuilds & Standings Impact.md`

Objetivo:

- scoring macro
- rebuilds
- impacto en standings

## Epic 7

`EPIC 7 — Home Aggregation, Points UX & Daily Loop.md`

Objetivo:

- home agregada
- loop diario
- resumen de puntos

## Epic 8

`EPIC 8 — Admin Ops, Result Ingestion & Rebuild Control.md`

Objetivo:

- operación admin mínima
- ingesta de resultados
- recálculos seguros

## Epic 9

`EPIC 9 — Analytics & Ads.md`

Objetivo:

- analytics mínima
- ads inline no intrusivos

---

# 3. Dependencias de alto nivel

- Epic 1 desbloquea todo lo demás
- Epic 2 desbloquea Epic 3
- Epic 3 y Epic 4 habilitan la capa competitiva base
- Epic 5 desbloquea Epic 6
- Epic 3, 4 y 6 alimentan Epic 7
- Epic 8 endurece operación del core ya construido
- Epic 9 se apoya sobre flows ya vivos

---

# 4. Qué queda fuera del backlog MVP

- ranking global
- checkout / billing runtime
- planes pagos operativos
- branding premium de ligas
- logo upload de ligas
- upgrades de plan

Eso puede entrar luego como backlog post-MVP / v1.
