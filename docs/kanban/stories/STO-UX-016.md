---
id: STO-UX-016
type: story
project: prode-mundial
title: Compactar fixtures V3 y redefinir estados para escaneo rapido
description: Reducir densidad vertical de la pantalla de partidos, integrar mejor la prediccion cargada y redefinir los estados de accion para que el azul solo marque disponibilidad real.
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
  - STO-UX-003
context_files:
  - apps/web/src/components/matches/matches-screen.tsx
  - apps/web/src/components/matches/matches-screen.test.tsx
  - apps/web/src/components/matches/match-detail-screen.tsx
  - packages/ui/src/components.tsx
  - apps/api/src/domains/matches/services/match-payloads.ts
agent_status_note: La lista debe mostrar mas partidos por viewport y bajar el peso de estados no accionables como Disponible pronto.
last_agent_update: 2026-04-11T00:00:00.000Z
labels:
  - ux
  - matches
  - scanability
  - states
subtasks:
  - title: Redisenar cards compactas con layout mas horizontal y menos wrappers internos
    done: false
  - title: Integrar PredictionSummary sin subcard redundante
    done: false
  - title: Reemplazar Disponible pronto por un tratamiento informativo sobrio
    done: false
  - title: Alinear sistema de estados pendiente, abierto, cargado y cerrado
    done: false
ready_criteria:
  - id: foundation-ready
    label: Foundation visual, flags y navegacion ya disponibles
    kind: derived
    rule: dependencies_done
done_criteria:
  - id: higher-density
    label: Se ven mas partidos por viewport
    kind: manual
    checked: false
  - id: states-clear
    label: Los estados se distinguen sin competir mal con la accion principal
    kind: manual
    checked: false
  - id: prediction-integrated
    label: La prediccion cargada se integra al card sin parecer modulo aparte
    kind: manual
    checked: false
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- la lista se escanea claramente mas rapido que antes
- el azul fuerte solo aparece cuando la accion esta disponible
- los partidos no se sienten registros de sistema sino duelos deportivos
- la metadata se lee rapido y sin tono dashboard
