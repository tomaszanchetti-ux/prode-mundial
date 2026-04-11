---
id: STO-UX-005
type: story
project: prode-mundial
title: Preparar la segunda ola UX/UI para ligas, perfil, grupos y ads
description: Traducir al kanban las partes del documento v2 que exceden el cierre directo de Epic 3.5 para dejarlas listas para la siguiente etapa.
epic: EPI-UX-001
status: done
priority: medium
assignee: null
agent_owner: codex-main
execution_mode: agent
story_type: chore
blocked_by: []
blocks: []
related_to: []
context_files:
  - apps/web/src/components/leagues/leagues-screen.tsx
  - apps/web/src/components/rankings/rankings-screen.tsx
  - apps/web/src/components/profile/profile-screen.tsx
  - apps/web/src/components/tournament/tournament-screen.tsx
agent_status_note: Completada. Quedo separada la segunda ola entre UI segura inmediata, trabajo propio de Epic 4 y frente tecnico de bilinguismo ENG/ESP.
last_agent_update: 2026-04-10T14:42:00.000Z
labels:
  - ux
  - follow-up
  - epic-4-plus
subtasks:
  - title: Separar cambios que entran en Epic 4 de los puramente cosmeticos
    done: true
  - title: Identificar dependencias de producto o backend si existen
    done: true
  - title: Dejar un backlog claro para la segunda ola
    done: true
ready_criteria:
  - id: source-doc-reviewed
    label: Documento UX/UI v2 releido y desglosado
    kind: manual
    checked: true
done_criteria:
  - id: backlog-ready
    label: Segunda ola desglosada en trabajo ejecutable
    kind: manual
    checked: true
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- queda claro que parte del documento entra en 3.5 y que parte conviene mover a 4+
- el backlog siguiente queda listo para expandirse en historias nuevas
