---
id: STO-UX-018
type: story
project: prode-mundial
title: Cerrar V3 con loading, empty states, copy cleanup y auditoria visual global
description: Ejecutar la pasada final de polish sobre copy, skeletons, estados vacios, consistencia visual y QA mobile para cerrar la elevacion V3 antes de Epic 4.
epic: EPI-UX-002
status: backlog
priority: medium
assignee: null
agent_owner: codex-main
execution_mode: agent
story_type: chore
blocked_by:
  - STO-UX-011
  - STO-UX-012
  - STO-UX-013
  - STO-UX-014
  - STO-UX-015
  - STO-UX-016
  - STO-UX-017
blocks: []
related_to:
  - STO-UX-010
context_files:
  - apps/web/src/components/home/home-screen.tsx
  - apps/web/src/components/matches/matches-screen.tsx
  - apps/web/src/components/matches/quick-prediction-modal.tsx
  - apps/web/src/components/leagues/leagues-screen.tsx
  - apps/web/src/components/rankings/rankings-screen.tsx
  - apps/web/src/components/tournament/tournament-screen.tsx
  - apps/web/src/components/profile/profile-screen.tsx
  - packages/ui/src/components.tsx
agent_status_note: Historia de cierre. No arrancar hasta que las historias nucleares de V3 esten resueltas.
last_agent_update: 2026-04-11T00:00:00.000Z
labels:
  - ux
  - qa
  - copy
  - polish
subtasks:
  - title: Reemplazar loading copy dominante por skeletons reconocibles
    done: false
  - title: Limpiar copys de staging, tono interno o explicacion redundante
    done: false
  - title: Auditar consistencia visual y reduccion final de wrappers redundantes
    done: false
  - title: Ejecutar QA manual mobile-first sobre home, matches, modal, nav y social layer
    done: false
ready_criteria:
  - id: core-v3-complete
    label: Historias principales de V3 completadas
    kind: derived
    rule: dependencies_done
done_criteria:
  - id: skeletons-live
    label: Loading states reales disponibles
    kind: manual
    checked: false
  - id: copy-clean
    label: Se elimino el tono staging e interno remanente
    kind: manual
    checked: false
  - id: qa-complete
    label: Checklist visual y mobile ejecutado
    kind: manual
    checked: false
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- los empty/loading states ya no parecen placeholders de developer
- el copy es corto, accionable y deportivo
- la app se siente consistente de punta a punta
- V3 queda documentalmente y visualmente cerrada antes de abrir `Epic 4`
