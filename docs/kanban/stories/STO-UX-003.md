---
id: STO-UX-003
type: story
project: prode-mundial
title: Compactar la pantalla de Partidos para escaneo rapido y tono mas deportivo
description: Refinar hero, filtros y lista de partidos para bajar peso panel, mejorar lectura y acelerar accion desde mobile.
epic: EPI-UX-001
status: done
priority: high
assignee: null
agent_owner: codex-main
execution_mode: agent
story_type: feature
blocked_by:
  - STO-UX-001
blocks: []
related_to: []
context_files:
  - apps/web/src/components/matches/matches-screen.tsx
  - apps/web/src/components/matches/matches-screen.test.tsx
  - packages/ui/src/components.tsx
agent_status_note: Completada. Partidos quedo mas escaneable con hero reusable, filtros mas livianos y cards/lista mas compactas.
last_agent_update: 2026-04-10T14:30:00.000Z
labels:
  - ux
  - matches
  - epic-3-5
subtasks:
  - title: Rediseñar el bloque superior del proximo pendiente
    done: true
  - title: Compactar y hacer sticky la tira de filtros
    done: true
  - title: Reemplazar la lista pesada por items mas compactos y accionables
    done: true
ready_criteria:
  - id: team-identity-ready
    label: Primitive de identidad de equipos disponible
    kind: derived
    rule: dependencies_done
done_criteria:
  - id: impl-complete
    label: Pantalla de partidos refinada
    kind: manual
    checked: true
  - id: tests-updated
    label: Tests de partidos ajustados
    kind: manual
    checked: true
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- todos los equipos se ven con bandera + nombre
- la lista reduce densidad y se escanea mejor
- el CTA principal se entiende de inmediato
