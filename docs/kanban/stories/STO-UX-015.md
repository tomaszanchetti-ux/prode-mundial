---
id: STO-UX-015
type: story
project: prode-mundial
title: Elevar el flujo de prediccion V3 con modal estrella y score picker premium
description: Refactorizar quick prediction y Marathon para que el modal se sienta central, tactil, rapido y con una jerarquia de guardado inequívoca.
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
  - STO-UX-004
context_files:
  - apps/web/src/components/matches/quick-prediction-modal.tsx
  - apps/web/src/components/matches/marathon-prediction-modal.tsx
  - apps/web/src/components/matches/marathon-prediction-modal.test.tsx
  - packages/ui/src/components.tsx
agent_status_note: El modal debe seguir siendo el corazon del producto. No dejar dos acciones primarias compitiendo ni un score picker con look de calculadora.
last_agent_update: 2026-04-11T00:00:00.000Z
labels:
  - ux
  - prediction
  - modal
  - critical-moment
subtasks:
  - title: Reordenar la jerarquia del modal alrededor de contexto, duelo, score y guardado
    done: false
  - title: Redisenar el score picker con menos masa visual y mejor foco en el marcador elegido
    done: false
  - title: Alinear CTA principal, secundaria y terciaria dentro del flujo
    done: false
  - title: Resolver feedback de guardado y microinteracciones sutiles
    done: false
ready_criteria:
  - id: foundation-ready
    label: Foundation visual, flags y navegacion ya disponibles
    kind: derived
    rule: dependencies_done
done_criteria:
  - id: modal-star
    label: El modal se percibe como componente estrella del producto
    kind: manual
    checked: false
  - id: one-primary-action
    label: Existe una sola accion primaria inequívoca
    kind: manual
    checked: false
  - id: score-picker-premium
    label: El score picker se ve tactil, limpio y premium
    kind: manual
    checked: false
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- el modal se siente mas mobile-native y menos modular
- el guardado se entiende y devuelve feedback claro sin torpeza
- los equipos se muestran con identidad visual fuerte
- la continuidad guardar -> seguir queda clara cuando aplica
