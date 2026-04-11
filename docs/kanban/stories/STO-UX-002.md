---
id: STO-UX-002
type: story
project: prode-mundial
title: Refactorizar Home pre-torneo alrededor del proximo partido y progreso compacto
description: Reorganizar la home para que el hero principal sea el siguiente partido pendiente y mover el progreso a un bloque secundario mas compacto.
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
  - apps/web/src/components/home/home-screen.tsx
  - apps/web/src/components/home/home-screen.test.tsx
agent_status_note: Completada. Home quedo reorganizada alrededor del proximo partido con hero reusable, progreso compacto y bloque social visible.
last_agent_update: 2026-04-10T14:30:00.000Z
labels:
  - ux
  - home
  - epic-3-5
subtasks:
  - title: Crear hero del proximo pendiente con CTA principal y secundaria
    done: true
  - title: Compactar progreso y bajar peso panel
    done: true
  - title: Hacer visible el bloque social o de liga sin romper prioridad de prediccion
    done: true
ready_criteria:
  - id: team-identity-ready
    label: Primitive de identidad de equipos disponible
    kind: derived
    rule: dependencies_done
done_criteria:
  - id: impl-complete
    label: Home refactorizada segun iteracion v2
    kind: manual
    checked: true
  - id: tests-updated
    label: Tests de home ajustados
    kind: manual
    checked: true
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- el primer viewport prioriza claramente el proximo partido editable
- el progreso deja de ser el bloque dominante
- existe un segundo CTA contextual y un bloque social visible
