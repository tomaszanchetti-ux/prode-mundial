# Prode Mundial - DESIGN_SYSTEM.md

## Propósito

Este documento define el Design System oficial del MVP.

Es binding para:

- frontend (`apps/web`)
- componentes compartidos (`packages/ui`)
- cualquier contribución de Codex sobre UI/UX

No reemplaza el UX brief ni la especificación funcional.
Los aterriza en reglas reutilizables para implementación.

---

# 1. Principios de diseño no negociables

## 1.1 Mobile-first real

- diseñar primero para mobile
- desktop es adaptación, no origen

## 1.2 Acción inmediata > exploración

- la interfaz debe ayudar a detectar qué falta hacer
- el usuario debe poder completar una acción crítica rápido

## 1.3 Backend-driven UX

- la UI no interpreta lógica crítica
- la UI refleja estados ya resueltos por backend
- para MVP priorizar flags como:
  - `isEditable`
  - `isLocked`
  - `isScored`
  - `predictionStatus`
  - `adjustmentAvailable`

## 1.4 Simplicidad extrema

- evitar fricción
- evitar navegación profunda innecesaria
- evitar densidad visual tipo dashboard complejo

## 1.5 Feedback inmediato

- toda acción debe devolver confirmación visible
- todo estado crítico debe ser entendible en segundos

---

# 2. UX core del producto

## 2.1 Loop principal

`HOME -> detectar pendiente -> predecir -> confirmar -> volver`

## 2.2 Predicción primero

Siempre que exista una acción pendiente, la UX debe priorizar resolverla antes que explicar demasiado contexto.

## 2.3 Modal de predicción como patrón prioritario

Cuando haya partidos pendientes, el producto debe poder priorizar su resolución vía modal de predicción.

Triggers objetivo:

1. usuario entra a home y hay pendientes
2. usuario entra a matches y hay pendientes
3. usuario guarda un partido y existe otro pendiente editable

## 2.4 Regla de compatibilidad con el corpus actual

El modal de predicción es el patrón prioritario del sistema, pero NO invalida:

- la pantalla de listado `/matches`
- la vista de detalle/predicción de partido

Mientras el MVP evoluciona, el modal puede convivir con la pantalla/detalle como superficie principal o fallback, siempre respetando los mismos contratos, estados y validaciones.

## 2.5 Lógica de priorización del modal

Seleccionar el próximo partido:

- no predicho
- editable
- más cercano en tiempo

## 2.6 Reglas del modal

Debe incluir:

- equipos (`flag + nombre`)
- kickoff en texto simple
- inputs de score
- CTA guardar

No debe incluir:

- navegación secundaria
- distracciones
- múltiples decisiones simultáneas

En mobile debe ser fullscreen o equivalente de foco total.

---

# 3. Representación de equipos

Formato obligatorio:

`[FLAG] + Nombre país`

Ejemplo:

- Argentina
- Brasil

Reglas:

- flag siempre visible
- tamaño consistente
- alineación horizontal
- spacing fijo entre flag y nombre

Cuando el flag no pueda renderizarse como emoji, usar `flagUrl` o asset visual equivalente.

---

# 4. Design tokens oficiales

## 4.1 Colores

### Primary

- `primary-500`: `#3B82F6`
- `primary-700`: `#1D4ED8`

### Success

- `success-500`: `#16A34A`

### Error

- `error-500`: `#DC2626`

### Warning

- `warning-500`: `#F59E0B`

### Neutrals dark-first

- `bg-main`: `#0F172A`
- `bg-surface`: `#111827`
- `border`: `#1F2937`
- `text-primary`: `#F9FAFB`
- `text-secondary`: `#9CA3AF`

## 4.2 Tipografía

Fuente base:

- `Inter`

Escala:

- `h1`: `24px / 700`
- `h2`: `20px / 600`
- `h3`: `18px / 600`
- `body`: `14px / 400`
- `small`: `12px / 400`

## 4.3 Spacing

Base: `4px`

Escala:

- `4`
- `8`
- `12`
- `16`
- `20`
- `24`
- `32`

## 4.4 Bordes

- `radius-sm`: `6px`
- `radius-md`: `10px`
- `radius-lg`: `14px`

---

# 5. Tono visual

La interfaz debe sentirse:

- rápida
- clara
- deportiva sin exceso
- social
- accionable

Evitar:

- sobrecarga decorativa
- gamificación visual excesiva
- componentes visualmente ambiguos

## 5.1 Dark mode

- el sistema es dark-first por default
- no diseñar light como base primaria del MVP

---

# 6. Componentes core del MVP

Todos los componentes reutilizables deben vivir en `packages/ui`.

## 6.1 Button

Variants:

- `primary`
- `secondary`
- `ghost`

Props mínimas:

- `loading`
- `disabled`
- `fullWidth`

## 6.2 MatchCard

Debe mapear 1:1 con API `/matches`.

Incluye:

- equipos
- kickoff
- estado visual
- resumen de predicción del usuario
- CTA contextual

Estados visuales mínimos:

- editable
- locked
- scored

## 6.3 PredictionModal

Componente central del producto.

Props mínimas:

- `match`
- `userPrediction`
- `onSubmit`
- `onClose`

Debe:

- concentrar la acción principal
- bloquear el background cuando corresponda
- soportar mobile fullscreen o equivalente

## 6.4 ScoreInput

- input doble (`home` / `away`)
- solo enteros
- validación inline

Si es knockout y el usuario predice empate:

- mostrar selector obligatorio de clasificado

## 6.5 TeamDisplay

Props mínimas:

- `teamName`
- `flagUrl`

Render:

- `flag + teamName`

## 6.6 StatusTag

Estados:

- `editable`
- `locked`
- `live`
- `scored`

Color mapping:

- `editable` -> azul
- `locked` -> gris
- `live` -> amarillo
- `scored` -> verde

## 6.7 PointsBadge

- positivo -> verde
- cero -> gris

## 6.8 LeagueCard

Incluye:

- nombre de liga
- posición
- puntos
- miembros

## 6.9 Base shells existentes

También deben alinearse al sistema:

- `TopBar`
- `BottomNavigation`
- `Card`
- `Toast` o feedback inline
- empty states

---

# 7. Reglas de interacción

## 7.1 Guardado

- optimista cuando tenga sentido
- feedback inmediato
- no bloquear UX innecesariamente

## 7.2 Errores

Mostrar:

- mensaje claro
- sin tecnicismos
- orientado a la próxima acción posible

## 7.3 Loading

- usar skeletons o spinners
- nunca pantallas en blanco

## 7.4 Deadlines y estados

Todo input editable debe mostrar deadline o cierre aplicable.

El usuario debe entender rápido si algo está:

- pendiente
- guardado
- editable
- bloqueado
- puntuado
- expirado

---

# 8. Reglas de copy UX

- frases cortas
- verbos directos
- deadlines explícitos
- confirmaciones visibles
- errores concretos

---

# 9. Analytics hooks

Eventos clave a contemplar:

- `match_prediction_started`
- `match_prediction_saved`
- `modal_opened`
- `modal_completed`

Que existan en este documento no obliga a implementarlos ya fuera del alcance de la épica activa.

---

# 10. Estructura de implementación recomendada

En `packages/ui` priorizar:

- `tokens/`
- `components/`
- `primitives/`

---

# 11. Reglas para Codex

## Prohibido

- inventar estilos arbitrarios fuera del sistema
- usar colores fuera de tokens sin justificarlo y documentarlo
- crear componentes duplicados
- ignorar estados backend

## Obligatorio

- usar componentes compartidos cuando existan
- mapear API -> UI sin reinterpretar lógica crítica
- mantener consistencia visual entre home, matches, rankings y leagues

## Regla de transición para el estado actual del repo

El repo todavía tiene componentes MVP previos con estilos inline simples.

Eso no invalida este design system.

La integración debe hacerse progresivamente:

1. definir tokens y primitives base en `packages/ui`
2. migrar componentes críticos del flujo activo
3. evitar refactors cosméticos amplios sin valor funcional

---

# 12. Relación con otras fuentes

Este documento complementa y debe leerse junto con:

- `docs/product/05. Prode Mundial - Functional Specification v1.md`
- `docs/product/06. Prode Mundial - UX Sitemap Wireframe Brief.md`
- `docs/backlog/EPIC 2 — Fixtures, Match Detail & Match Predictions.md`

Si aparece contradicción:

1. manda el canon del MVP
2. luego la spec funcional y el UX brief
3. este documento debe corregirse para quedar alineado

---

# 13. Filosofía final

Este producto no es de exploración.

Es de acción rápida.

Si el usuario tarda más de 5 segundos en entender qué hacer, el diseño está mal.
