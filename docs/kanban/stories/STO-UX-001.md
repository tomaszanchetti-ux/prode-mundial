---
id: STO-UX-001
type: story
project: prode-mundial
title: Crear TeamFlag y TeamIdentityRow como base transversal de selecciones
description: Reemplazar la representacion principal basada en initials por bandera real + nombre en los componentes compartidos y flows prioritarios.
epic: EPI-UX-001
status: done
priority: high
assignee: null
agent_owner: codex-main
execution_mode: agent
story_type: feature
blocked_by: []
blocks:
  - STO-UX-002
  - STO-UX-003
  - STO-UX-004
related_to: []
context_files:
  - packages/ui/src/components.tsx
  - packages/ui/src/index.tsx
  - apps/web/src/components/home/home-screen.tsx
  - apps/web/src/components/matches/matches-screen.tsx
  - apps/web/src/components/matches/quick-prediction-modal.tsx
  - apps/web/src/components/matches/marathon-prediction-modal.tsx
agent_status_note: Completada. Quedo creada la base transversal de identidad de equipos en packages/ui y aplicada a Home, Matches y modales de prediccion.
last_agent_update: 2026-04-10T14:08:00.000Z
labels:
  - ux
  - ui-system
  - shared-ui
subtasks:
  - title: Diseñar API minima de TeamFlag y TeamIdentityRow
    done: true
  - title: Integrar nuevos componentes en packages/ui sin romper TeamDisplay
    done: true
  - title: Reemplazar la UI principal de selecciones en Home y Matches
    done: true
ready_criteria:
  - id: source-doc-reviewed
    label: Documento UX/UI v2 releido y desglosado
    kind: manual
    checked: true
  - id: deps-cleared
    label: Sin dependencias bloqueantes
    kind: derived
    rule: dependencies_done
done_criteria:
  - id: impl-complete
    label: Implementacion transversal completada
    kind: manual
    checked: true
  - id: tests-updated
    label: Tests o snapshots relevantes ajustados
    kind: manual
    checked: true
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Contexto

Fuente principal: `/Users/tzanchetti/Documents/NewCo - Proyectos/Prode Mundial/PRODE MUNDIAL - UX _ UI Iteration v2.md`

## Criterios de aceptacion

- la representacion principal de equipos deja de depender de bubbles con iniciales
- la combinacion bandera + nombre queda disponible como primitive reutilizable
- la API resultante es compatible con el sistema visual actual
