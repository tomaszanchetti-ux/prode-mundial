---
id: STO-UX-004
type: story
project: prode-mundial
title: Convertir el modal de prediccion en una experiencia tactil y secuencial
description: Mejorar quick prediction y Marathon para que el marcador se cargue mas rapido y el flujo guardar -> siguiente sea mas claro.
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
  - apps/web/src/components/matches/quick-prediction-modal.tsx
  - apps/web/src/components/matches/marathon-prediction-modal.tsx
  - apps/web/src/components/matches/marathon-prediction-modal.test.tsx
  - packages/ui/src/components.tsx
agent_status_note: Completada. Quick prediction y Marathon quedaron mas tactiles, con copy mas claro y continuidad visible hacia el siguiente partido.
last_agent_update: 2026-04-10T14:30:00.000Z
labels:
  - ux
  - prediction
  - epic-3-5
subtasks:
  - title: Diseñar score picker mas tactil dentro de packages/ui
    done: true
  - title: Reordenar quick prediction como experiencia maestra
    done: true
  - title: Reforzar el comportamiento secuencial de Marathon
    done: true
ready_criteria:
  - id: team-identity-ready
    label: Primitive de identidad de equipos disponible
    kind: derived
    rule: dependencies_done
done_criteria:
  - id: impl-complete
    label: Modales de prediccion refinados
    kind: manual
    checked: true
  - id: tests-updated
    label: Tests de prediccion ajustados
    kind: manual
    checked: true
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- el modal se percibe mas tactil que formulario
- el CTA principal usa una jerarquia consistente
- queda clara la preparacion para guardar y abrir el siguiente partido
