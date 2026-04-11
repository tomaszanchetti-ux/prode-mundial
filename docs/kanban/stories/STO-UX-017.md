---
id: STO-UX-017
type: story
project: prode-mundial
title: Pulir standings y ligas V3 sin invadir el alcance funcional de Epic 4
description: Reordenar la capa social visible para que se sienta competencia real y no admin, dejando claros los limites previos a create/join/detail real de ligas.
epic: EPI-UX-002
status: backlog
priority: high
assignee: null
agent_owner: codex-main
execution_mode: agent
story_type: feature
blocked_by:
  - STO-UX-011
  - STO-UX-012
  - STO-UX-013
blocks:
  - STO-UX-018
related_to:
  - STO-UX-009
context_files:
  - apps/web/src/components/leagues/leagues-screen.tsx
  - apps/web/src/components/leagues/leagues-screen.test.tsx
  - apps/web/src/components/rankings/rankings-screen.tsx
  - apps/web/src/components/rankings/rankings-screen.test.tsx
  - docs/backlog/EPIC 4 — Leagues, Invite Flow, Membership & League Detail.md
agent_status_note: Historia de frontera. Pulir competencia social, pero no convertir CTAs de crear/invitar/join en pseudo-funcionalidad antes de Epic 4.
last_agent_update: 2026-04-11T00:00:00.000Z
labels:
  - ux
  - leagues
  - rankings
  - social-layer
  - epic-4-boundary
subtasks:
  - title: Reforzar top 3, puntos y highlight del usuario en standings
    done: false
  - title: Reordenar la pantalla de ligas priorizando contenido valioso antes que acciones
    done: false
  - title: Limpiar CTAs fake o ambiguos para dejar la frontera con Epic 4 explicita
    done: false
  - title: Diseñar empty states sociales y deportivos para rankings y ligas
    done: false
ready_criteria:
  - id: foundation-ready
    label: Foundation visual, flags y navegacion ya disponibles
    kind: derived
    rule: dependencies_done
  - id: epic-4-doc-reviewed
    label: Documento de Epic 4 revisado como limite de alcance
    kind: manual
    checked: true
done_criteria:
  - id: social-tone-improved
    label: Ligas y posiciones se sienten competencia social y no admin
    kind: manual
    checked: false
  - id: epic-4-boundary-clear
    label: La frontera visual y funcional con Epic 4 quedo clara
    kind: manual
    checked: false
  - id: empty-states-real
    label: Existen vacios mas reales y accionables para la capa social
    kind: manual
    checked: false
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- posiciones se siente tabla competitiva y no tabla funcional
- el usuario actual y el top 3 tienen jerarquia clara y elegante
- ligas prioriza contexto, posicion y contenido antes que acciones secundarias
- no se prometen flujos reales de `Epic 4` que todavia no existen
