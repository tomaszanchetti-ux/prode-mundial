---
id: STO-UX-012
type: story
project: prode-mundial
title: Implementar sistema robusto de banderas y TeamIdentity con soporte de datos
description: Resolver identidad visual de selecciones con assets locales, helper centralizado y refuerzo del modelo de datos para evitar adivinar banderas en runtime.
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
  - STO-UX-001
context_files:
  - packages/ui/src/components.tsx
  - packages/shared/src/contracts/matches.ts
  - packages/shared/src/contracts/tournament.ts
  - packages/shared/src/schemas/matches.ts
  - packages/shared/src/schemas/tournament.ts
  - apps/api/src/domains/matches/types.ts
  - apps/api/src/domains/matches/data/world-cup-2026.ts
  - apps/api/src/domains/matches/services/match-payloads.ts
  - apps/web/src/components/home/home-screen.tsx
  - apps/web/src/components/matches/matches-screen.tsx
  - apps/web/src/components/matches/quick-prediction-modal.tsx
  - apps/web/src/components/matches/marathon-prediction-modal.tsx
  - apps/web/src/components/tournament/tournament-screen.tsx
agent_status_note: Esta historia si toca frontend y soporte de datos/back. No dejar el mapping librado a strings inconsistentes.
last_agent_update: 2026-04-11T00:00:00.000Z
labels:
  - ux
  - flags
  - data-model
  - shared-contracts
subtasks:
  - title: Definir el shape estable de identidad de equipo con fifaCode, iso2, iso3 y flag asset
    done: false
  - title: Versionar assets locales de banderas y helper centralizado de resolucion
    done: false
  - title: Evolucionar TeamFlag y TeamIdentityRow hacia una primitive unica reutilizable
    done: false
  - title: Implementar fallbacks elegantes con warning en dev sin romper layout
    done: false
ready_criteria:
  - id: foundation-ready
    label: Base visual V3 disponible
    kind: derived
    rule: dependencies_done
done_criteria:
  - id: data-shape-updated
    label: Contratos y datos de equipo enriquecidos para flags confiables
    kind: manual
    checked: false
  - id: assets-live
    label: Assets locales y helper de resolucion disponibles
    kind: manual
    checked: false
  - id: no-primary-monogram
    label: La app deja de depender de monogramas como solucion principal
    kind: manual
    checked: false
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- todos los contextos partido-pais muestran bandera correctamente
- el front no inventa banderas a partir de strings inseguros
- los fallbacks no rompen composicion ni alineacion
- la logica de identidad no queda dispersa por archivos de pantalla
