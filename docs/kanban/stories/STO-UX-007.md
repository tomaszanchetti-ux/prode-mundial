---
id: STO-UX-007
type: story
project: prode-mundial
title: Rehacer Perfil en single-column mobile-first
description: Ajustar Profile para dejar atras el layout pseudo-desktop, compactar stats y simplificar copy/acciones.
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
  - apps/web/src/components/profile/profile-screen.tsx
agent_status_note: Completada. Perfil quedo en single-column mobile-first, con stats compactas y copy mas corto para una experiencia mas clara.
last_agent_update: 2026-04-10T15:08:00.000Z
labels:
  - ux
  - profile
  - ui-safe-now
subtasks:
  - title: Pasar a single column real en mobile
    done: true
  - title: Compactar stats de usuario en una sola superficie
    done: true
  - title: Limpiar copy y CTA principal de guardado
    done: true
ready_criteria:
  - id: docs-reviewed
    label: Review UX/UI v2 revisada para Perfil
    kind: manual
    checked: true
done_criteria:
  - id: impl-complete
    label: Perfil refinado
    kind: manual
    checked: true
  - id: tests-or-smoke
    label: Validacion suficiente del refactor
    kind: manual
    checked: true
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Alcance

No cambia contratos de perfil. Solo jerarquia, layout y copy.
