---
id: STO-UX-008
type: story
project: prode-mundial
title: Potenciar Tu Mundial y tablas de grupos con lenguaje mas futbolero
description: Mejorar la pantalla de Tournament/Groups para que se lea mas como simulacion viva del Mundial y menos como tabla administrativa.
epic: EPI-UX-001
status: done
priority: medium
assignee: null
agent_owner: codex-main
execution_mode: agent
story_type: feature
blocked_by: []
blocks: []
related_to: []
context_files:
  - apps/web/src/components/tournament/tournament-screen.tsx
  - apps/web/src/components/tournament/tournament-screen.test.tsx
agent_status_note: Completada. Tu Mundial quedo mas claro y futbolero, con estados de grupo semanticos y clasificados mas faciles de leer.
last_agent_update: 2026-04-10T15:15:00.000Z
labels:
  - ux
  - tournament
  - epic-3-5
subtasks:
  - title: Compactar header y CTA superiores
    done: true
  - title: Mejorar semantica visual de clasificados y estado de grupo
    done: true
  - title: Hacer mas futbolero el lenguaje de tablas y progreso
    done: true
ready_criteria:
  - id: docs-reviewed
    label: Review UX/UI v2 revisada para Grupos
    kind: manual
    checked: true
done_criteria:
  - id: impl-complete
    label: Grupos y Tu Mundial refinados
    kind: manual
    checked: true
  - id: tests-updated
    label: Tests de Tournament ajustados
    kind: manual
    checked: true
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Alcance

UI/copy y señales visuales. No modifica la logica server-driven de Tu Mundial.
