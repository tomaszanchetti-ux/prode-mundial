---
id: STO-UX-011
type: story
project: prode-mundial
title: Recalibrar tokens visuales, superficies y jerarquia base para V3
description: Refactorizar tokens y primitives compartidas para reducir ruido de contenedores, diferenciar mejor superficies y establecer una jerarquia visual premium consistente.
epic: EPI-UX-002
status: backlog
priority: high
assignee: null
agent_owner: codex-main
execution_mode: agent
story_type: feature
blocked_by: []
blocks:
  - STO-UX-012
  - STO-UX-013
  - STO-UX-014
  - STO-UX-015
  - STO-UX-016
  - STO-UX-017
  - STO-UX-018
related_to:
  - STO-UX-001
  - STO-UX-002
  - STO-UX-003
  - STO-UX-004
context_files:
  - packages/ui/src/tokens.ts
  - packages/ui/src/components.tsx
  - apps/web/src/app/layout.tsx
agent_status_note: Primera historia obligatoria de V3. No avanzar con pantallas nuevas si antes no se fija la base visual.
last_agent_update: 2026-04-11T00:00:00.000Z
labels:
  - ux
  - ui-system
  - foundation
  - premium-pass
subtasks:
  - title: Redefinir niveles de superficie y contraste entre background, primary, secondary e interactive
    done: false
  - title: Ajustar radii, bordes y sombras con uso intencional por contexto
    done: false
  - title: Refinar tipografia y spacing para reducir inflado vertical y mejorar escaneo
    done: false
  - title: Preparar primitives reutilizables para CTA, section headers y estados sin duplicar estilos
    done: false
ready_criteria:
  - id: v3-doc-reviewed
    label: Documento UX/UI V3 releido y convertido en alcance tecnico
    kind: manual
    checked: true
  - id: deps-cleared
    label: Sin dependencias bloqueantes
    kind: derived
    rule: dependencies_done
done_criteria:
  - id: token-system-updated
    label: Sistema de tokens visuales recalibrado
    kind: manual
    checked: false
  - id: primitives-aligned
    label: Primitives compartidas alineadas a la nueva jerarquia
    kind: manual
    checked: false
  - id: visual-noise-reduced
    label: Reduccion visible de cajas, strokes y wrappers redundantes
    kind: manual
    checked: false
  - id: subtasks-done
    label: Todas las subtareas completadas
    kind: derived
    rule: all_subtasks_done
---

## Criterios de aceptacion

- existen 4 niveles visuales claros y consistentes
- no todo comparte el mismo radio ni el mismo tratamiento de borde
- la jerarquia depende mas de tipografia, spacing y contraste que de cajas anidadas
- la base visual permite continuar V3 sin hacks pantalla por pantalla
