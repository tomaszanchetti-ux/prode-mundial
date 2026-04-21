# Prode Mundial_WS15_09042026

## Resumen de cierre

Sesión enfocada en reordenar formalmente el roadmap del proyecto a partir de dos nuevos documentos de UX/UI orientados al período pre-torneo.

Resultado principal:

- se analizó el impacto de:
  - `Pre-Tournament UX Mode + Dynamic Standings`
  - `Tu Mundial + Mundial Real + Marathon Mode`
- se decidió que NO conviene entrar todavía a `Epic 4`
- se creó una nueva épica intermedia:
  - `Epic 3.5 — Pre-Tournament Mode, Tu Mundial & Marathon Mode`

Esta sesión no implementó código de producto.
Dejó listo el corpus documental para arrancar la próxima ventana con ejecución concreta sobre `Epic 3.5`.

---

# 1. Objetivo logrado

El proyecto ya no queda con ambigüedad sobre cuál es el siguiente paso.

Quedó formalmente definido que:

- `Epic 3` ya tiene un primer corte funcional cerrado
- la siguiente prioridad NO es `Epic 4`
- antes debe entrar una capa pre-torneo que reordena el loop visible del producto

La decisión central de esta sesión fue:

- priorizar engagement pre-evento
- priorizar completitud de grupos
- priorizar `Tu Mundial`
- diferir `Mundial Real` hasta contar con ingestión real

---

# 2. Decisiones cerradas

## 2.1 Nueva prioridad de roadmap

Nuevo orden recomendado:

1. `Epic 3`
2. `Epic 3.5`
3. `Epic 4`

Razón:

- el producto ahora necesita una UX principal pre-torneo
- no conviene construir la capa social siguiente sobre una prioridad de `home` ya desactualizada

## 2.2 Qué entra ahora

Conviene implementar antes de `Epic 4`:

- `Pre-Tournament Mode`
- progreso global de grupos
- `Marathon Mode`
- `Tu Mundial`

## 2.3 Qué NO entra ahora

No conviene implementar todavía:

- `Mundial Real`

Razón:

- depende de fuente oficial / proveedor
- depende de normalización backend
- depende de persistencia y refresh de standings reales
- su lugar natural está ligado a ingestión real y operación

---

# 3. Cambios documentales principales

## Product docs nuevos

- `docs/product/07. Prode Mundial - Pre-Tournament UX Mode + Dynamic Standings Spec.md`
- `docs/product/08. Prode Mundial - Tu Mundial, Mundial Real + Marathon Mode UX Spec.md`

## Backlog

- nuevo:
  - `docs/backlog/EPIC 3.5 — Pre-Tournament Mode, Tu Mundial & Marathon Mode.md`
- actualizado:
  - `docs/backlog/BACKLOG.md`

## Handoff / memoria

- actualizado:
  - `docs/handoff/PROJECT_MEMORY.md`

---

# 4. Alcance concreto de Epic 3.5

La épica nueva quedó bajada con suficiente detalle para ejecución.

Incluye:

- modo `preTournament`
- `home` pre-torneo
- progreso global de grupos
- `Marathon Mode`
- `Tu Mundial`
- standings proyectados backend-driven
- transición a modo torneo cuando abre la ventana del primer partido

No incluye:

- `Mundial Real`
- ingestión oficial
- standings reales
- comparativas entre predicción y realidad

---

# 5. Estado Git

- branch de trabajo durante la sesión:
  - `main`
- working tree al cierre:
  - cambios documentales solamente
- pedido del usuario:
  - cierre de sesión formal con docs, commit y push si corresponde

---

# 6. Validaciones ejecutadas

No se corrieron tests ni typecheck en esta sesión porque los cambios fueron exclusivamente documentales.

Sí se validó:

- coherencia del backlog actualizado
- coherencia de `PROJECT_MEMORY`
- existencia de la nueva épica ejecutable
- orden documental de continuidad

---

# 7. Próximo paso recomendado

Abrir una nueva ventana y arrancar directamente con `Epic 3.5`.

Orden sugerido de arranque:

1. `CARD 1 — Shared Contracts for Pre-Tournament Mode`
2. `CARD 2 — Backend Read Model for Group Progress`
3. `CARD 3 — Home Pre-Tournament Mode`

Recomendación operativa:

- empezar backend/shared-first
- no saltar todavía a UI final de `Tu Mundial`
- asegurar primero:
  - contratos
  - flags de modo
  - progreso global
  - siguiente pendiente cronológico

Eso deja la base correcta para:

- `Marathon Mode`
- `Tu Mundial`

sin mover lógica crítica al frontend.
