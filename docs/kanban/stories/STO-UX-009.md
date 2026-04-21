---
id: STO-UX-009
type: story
project: prode-mundial
title: Preparar la capa social de ligas para Epic 4
description: Dejar explicitado el trabajo de Crear liga, Invitar amigos, compartir codigo/link y detalle social como parte del desarrollo propio de Epic 4.
epic: EPI-UX-001
status: backlog
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
  - docs/backlog/EPIC 4 — Leagues, Invite Flow, Membership & League Detail.md
agent_status_note: Historia de frontera. No ejecutar como simple polish UI si implica nuevos flujos o contratos.
last_agent_update: 2026-04-10T14:42:00.000Z
labels:
  - epic-4
  - leagues
  - social-layer
subtasks:
  - title: Identificar UX que requiere backend o flujos de producto nuevos
    done: false
  - title: Separar CTA fake de CTA reales para Epic 4
    done: false
  - title: Dejar lista la expansion a historias de implementacion
    done: false
ready_criteria:
  - id: epic-4-doc-reviewed
    label: Documento de Epic 4 revisado
    kind: manual
    checked: true
done_criteria:
  - id: scope-defined
    label: Alcance de Epic 4 social claramente definido
    kind: manual
    checked: false
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Alcance

Esta historia existe para evitar mezclar simple polish con nuevas features sociales de liga que merecen desarrollo dedicado.
