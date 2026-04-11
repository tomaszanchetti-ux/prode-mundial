---
id: STO-UX-010
type: story
project: prode-mundial
title: Diseñar la base tecnica para soporte bilingue ENG / ESP
description: Definir e introducir la base minima para copys en espanol e ingles, con selector/classic toggle de idioma y estructura reutilizable para escalar despues al resto de la app.
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
  - apps/web/src/app/layout.tsx
  - apps/web/src/components/home/home-screen.tsx
  - apps/web/src/components/matches/matches-screen.tsx
  - apps/web/src/components/matches/quick-prediction-modal.tsx
  - apps/web/src/components/matches/marathon-prediction-modal.tsx
  - apps/web/src/components/rankings/rankings-screen.tsx
  - apps/web/src/components/leagues/leagues-screen.tsx
  - apps/web/src/components/profile/profile-screen.tsx
  - apps/web/src/components/tournament/tournament-screen.tsx
agent_status_note: Completada en su alcance inicial. Quedo instalada una base i18n liviana con locale activo, toggle ENG/ESP y primer slice bilingue funcional en shell, home, matches y flujo de prediccion.
last_agent_update: 2026-04-10T15:31:00.000Z
labels:
  - i18n
  - english
  - spanish
  - platform
subtasks:
  - title: Definir estrategia minima de diccionarios y locale activo
    done: true
  - title: Reemplazar copys hardcodeados en el primer slice visible
    done: true
  - title: Encapsular formateo de fecha/numero por locale
    done: true
ready_criteria:
  - id: current-state-reviewed
    label: Estado actual de i18n relevado
    kind: manual
    checked: true
done_criteria:
  - id: architecture-defined
    label: Base tecnica de i18n definida e iniciada
    kind: manual
    checked: true
  - id: first-slice-bilingual
    label: Primer slice visible con ENG/ESP funcional
    kind: manual
    checked: true
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Recomendacion tecnica

Arrancar con un enfoque liviano:

- `apps/web/src/lib/i18n/` con diccionarios `es` y `en`
- helper de `getLocaleCopy`
- wrapper de formato fecha/hora por locale
- selector simple `ESP / ENG` visible en header o profile

Evitar una libreria pesada antes de validar el slice inicial.
