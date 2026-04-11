---
id: STO-UX-014
type: story
project: prode-mundial
title: Redisenar Home V3 con hero protagonista y progreso de soporte
description: Transformar la home en una pantalla editorial y accionable donde el proximo partido domine claramente el primer viewport y el progreso quede como soporte.
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
  - STO-UX-002
context_files:
  - apps/web/src/components/home/home-screen.tsx
  - apps/web/src/components/home/home-screen.test.tsx
  - packages/ui/src/components.tsx
agent_status_note: No sumar mas modulos. La prioridad es reforzar el momento estrella del producto y reducir texto explicativo.
last_agent_update: 2026-04-11T00:00:00.000Z
labels:
  - ux
  - home
  - hero
  - critical-moment
subtasks:
  - title: Reconvertir el hero del proximo partido en una pieza editorial premium
    done: false
  - title: Reducir subtitulos largos, KPIs inflados y wrappers secundarios
    done: false
  - title: Compactar el progreso para que no se sienta dashboard
    done: false
  - title: Reforzar el CTA principal visible sin scroll y la lectura en 1 segundo
    done: false
ready_criteria:
  - id: foundation-ready
    label: Foundation visual, flags y navegacion ya disponibles
    kind: derived
    rule: dependencies_done
done_criteria:
  - id: hero-dominant
    label: El proximo partido domina el primer viewport
    kind: manual
    checked: false
  - id: action-clear
    label: La accion principal se entiende sin leer demasiado
    kind: manual
    checked: false
  - id: progress-supportive
    label: El progreso acompana y no compite con el partido
    kind: manual
    checked: false
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- el hero se siente partido destacado y no modulo de dashboard
- el CTA principal azul se ve completo en el primer viewport
- el progreso resume pendientes, puntos o avance sin robar foco
- desaparece copy tipo staging o demasiado explicativa
