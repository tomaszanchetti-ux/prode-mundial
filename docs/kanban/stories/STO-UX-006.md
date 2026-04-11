---
id: STO-UX-006
type: story
project: prode-mundial
title: Refinar Posiciones como tabla social cerrada sin tono tecnico
description: Rehacer Rankings/Posiciones para eliminar copy tecnico, mejorar jerarquia de liga y destacar al usuario actual con una lectura mas social y final.
epic: EPI-UX-001
status: done
priority: high
assignee: null
agent_owner: codex-main
execution_mode: agent
story_type: feature
blocked_by: []
blocks: []
related_to: []
context_files:
  - apps/web/src/components/rankings/rankings-screen.tsx
  - apps/web/src/components/rankings/rankings-screen.test.tsx
agent_status_note: Completada. Posiciones quedo reencuadrada como tabla social cerrada, con mejor selector de liga y deteccion mas clara del usuario actual.
last_agent_update: 2026-04-10T14:55:00.000Z
labels:
  - ux
  - rankings
  - ui-safe-now
subtasks:
  - title: Reemplazar copy tecnico y framing interno
    done: true
  - title: Convertir el selector de liga en un switcher mas compacto
    done: true
  - title: Mejorar rows de standings para detectar al usuario y top 3 mas rapido
    done: true
ready_criteria:
  - id: docs-reviewed
    label: Review UX/UI v2 revisada para Rankings
    kind: manual
    checked: true
done_criteria:
  - id: impl-complete
    label: Pantalla de posiciones refinada
    kind: manual
    checked: true
  - id: tests-updated
    label: Tests de posiciones ajustados
    kind: manual
    checked: true
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Alcance

UI y copy solamente. No crear todavia flujos nuevos de invitacion o creacion si requieren comportamiento adicional.
