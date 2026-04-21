---
id: STO-UX-013
type: story
project: prode-mundial
title: Aligerar header, bottom nav y jerarquia global de CTAs
description: Reducir el peso visual de la navegacion y unificar jerarquia de acciones primarias y secundarias para liberar viewport y bajar tono administrativo.
epic: EPI-UX-002
status: backlog
priority: high
assignee: null
agent_owner: codex-main
execution_mode: agent
story_type: feature
blocked_by:
  - STO-UX-011
blocks:
  - STO-UX-014
  - STO-UX-015
  - STO-UX-016
  - STO-UX-017
  - STO-UX-018
related_to:
  - STO-UX-010
context_files:
  - apps/web/src/components/layout/bottom-nav.tsx
  - apps/web/src/components/layout/language-toggle.tsx
  - apps/web/src/app/layout.tsx
  - apps/web/src/app/(protected)/layout.tsx
  - packages/ui/src/components.tsx
agent_status_note: La navegacion debe acompanar y no liderar la pantalla. Resolver aca la jerarquia global de CTA antes de tocar pantallas.
last_agent_update: 2026-04-11T00:00:00.000Z
labels:
  - ux
  - navigation
  - layout
  - mobile-first
subtasks:
  - title: Achicar el header superior y bajar peso de marca, subtitulos y controles
    done: false
  - title: Redisenar bottom nav para que sea mas nativa y menos encapsulada
    done: false
  - title: Consolidar PrimaryCTA y SecondaryCTA para evitar jerarquias inconsistentes
    done: false
  - title: Limpiar labels blandos o ambiguos de acciones globales
    done: false
ready_criteria:
  - id: foundation-ready
    label: Base visual V3 disponible
    kind: derived
    rule: dependencies_done
done_criteria:
  - id: nav-lighter
    label: Header y bottom nav consumen menos altura util
    kind: manual
    checked: false
  - id: cta-hierarchy-aligned
    label: Las acciones primarias y secundarias quedaron consistentes
    kind: manual
    checked: false
  - id: layout-less-admin
    label: La app pierde tono de barra administrativa
    kind: manual
    checked: false
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- la bottom nav se siente mas ligera y precisa
- el estado activo no roba foco al contenido
- el header deja mas altura util en mobile
- la jerarquia de CTA se percibe consistente en toda la app
