# **EPIC 3.5 — Pre-Tournament Mode, Tu Mundial & Marathon Mode**

---

# **1. Propósito de la épica**

Esta épica introduce la capa UX principal previa al inicio del Mundial.

Su objetivo es dejar implementado, de punta a punta:

- un `preTournamentMode` explícito
- una `home` orientada a completitud de grupos
- progreso global visible de fase de grupos
- `Marathon Mode` para carga secuencial de predicciones
- la pantalla `Tu Mundial`
- standings proyectados de grupos calculados desde backend

Esta épica existe para resolver una necesidad de producto concreta:

- antes del primer partido todavía no existe loop diario real
- por lo tanto la app debe optimizar preparación, completitud y ownership emocional

---

# **2. Decisión de alcance**

## **Incluido**

- detección del modo `preTournament`
- nueva priorización de `home` en pre-torneo
- progreso global `x/48`
- CTA principal `Seguir completando`
- `Marathon Mode`
- entrada a `Tu Mundial`
- read model o endpoint estable para standings proyectados por grupo
- UI mobile-first de tablas de grupo proyectadas
- transición a modo torneo cuando abre la ventana del primer partido

## **No incluido**

- `Mundial Real`
- ingestión oficial de resultados
- standings reales persistidos desde proveedor
- comparativas entre proyección y realidad
- bracket knockout proyectado
- cambios en reglas de scoring
- cambios en reglas de ligas

`Mundial Real` queda diferido a una etapa posterior, ligada a operación e ingestión real.

---

# **3. Objetivos funcionales**

Al finalizar esta épica, el sistema debe permitir que un usuario autenticado:

1. entre a la app antes del inicio del Mundial
2. vea en `home` cuántos partidos de grupos ya completó
3. reciba un CTA principal para continuar desde el siguiente pendiente cronológico
4. cargue múltiples predicciones seguidas sin volver manualmente a la lista
5. vea cómo quedarían los grupos según sus predicciones actuales
6. edite luego cualquier partido cargado, respetando deadlines reales del sistema
7. perciba una transición natural al modo partido-a-partido cuando se abre la ventana del primer partido

Además, el sistema debe permitir:

- resolver server-side si la app está en modo `preTournament` o no
- exponer progreso global de grupos
- exponer el siguiente partido pendiente cronológico para marathon
- exponer standings proyectados por grupo
- mantener frontend sin lógica crítica pesada

---

# **4. Resultado esperado visible**

### **Flujo demo A — Home pre-torneo**

1. abrir la app antes del primer partido
2. entrar a `/home`
3. ver bloque principal de progreso global
4. ver CTA `Seguir completando`
5. no ver puntos o scoring como prioridad dominante

### **Flujo demo B — Marathon Mode**

1. tocar `Seguir completando`
2. abrir el siguiente partido pendiente cronológico
3. guardar predicción
4. ver feedback inmediato
5. avanzar automáticamente al siguiente partido
6. repetir sin fricción

### **Flujo demo C — Tu Mundial parcial**

1. cargar parte de los partidos de grupos
2. entrar a `Tu Mundial`
3. ver tablas parciales por grupo
4. ver orden actualizado según predicciones ya cargadas
5. ver top 2 resaltado cuando corresponda

### **Flujo demo D — Transición a modo torneo**

1. acercarse a la apertura de la ventana del primer partido
2. volver a entrar a la app
3. confirmar que el producto ya prioriza el loop de próximo partido editable
4. confirmar que no se rompe acceso a `Tu Mundial`

---

# **5. Dependencias documentales**

Esta épica debe obedecer estrictamente:

- `MVP CANON`
- `Functional Specification v1`
- `DESIGN_SYSTEM.md`
- `07. Prode Mundial - Pre-Tournament UX Mode + Dynamic Standings Spec.md`
- `08. Prode Mundial - Tu Mundial, Mundial Real + Marathon Mode UX Spec.md`

En caso de conflicto:

- los documentos 7 y 8 mandan sobre el orden y la estructura UX pre-torneo
- `MVP CANON` sigue mandando sobre reglas del producto y principios de backend

---

# **6. Definition of Done**

La épica se considera terminada solo si:

- existe una forma backend-driven de resolver `preTournamentMode`
- `home` cambia de prioridad durante ese modo
- existe progreso global de grupos
- existe CTA principal para continuar predicciones
- existe flujo secuencial usable de Marathon Mode
- el flujo respeta orden cronológico real del fixture de grupos
- existe una pantalla o sección `Tu Mundial`
- `Tu Mundial` consume standings proyectados desde backend o read model estable
- el frontend no calcula por su cuenta la verdad principal de la tabla
- existe transición clara al modo torneo normal
- hay tests unitarios y/o de integración para lógica de standings proyectados
- hay tests UI mínimos para `home` pre-torneo y `Marathon Mode`
- CI pasa con `typecheck` + `test`

---

# **7. Cards de la épica**

---

## **CARD 1 — Shared Contracts for Pre-Tournament Mode**

### **Objetivo**

Crear contratos compartidos para el modo pre-torneo, el progreso global y `Tu Mundial`.

### **Alcance**

- tipos y schemas para progreso
- tipos y schemas para standings proyectados
- flags necesarias para resolver modo UX desde backend

### **Tareas**

#### **Task 1.1**

Definir un payload base para `preTournamentSummary`.

Campos mínimos sugeridos:

- `isPreTournament`
- `completedMatches`
- `totalMatches`
- `remainingMatches`
- `completionPercentage`
- `nextPendingMatchId`

#### **Task 1.2**

Definir contratos para `PredictedGroupStandingRow`.

Campos mínimos:

- `teamId`
- `teamName`
- `flagUrl | flagEmoji`
- `played`
- `won`
- `drawn`
- `lost`
- `goalsFor`
- `goalsAgainst`
- `goalDifference`
- `points`
- `position`
- `isProjectedQualified`

#### **Task 1.3**

Definir contrato para `TuMundialGroupCard`.

Campos mínimos:

- `groupId`
- `groupName`
- `completedMatches`
- `totalMatches`
- `isComplete`
- `items`

#### **Task 1.4**

Definir `TuMundialResponse`.

Campos mínimos:

- `mode`
- `groups`
- `updatedAt`

### **Acceptance**

- shared listo para frontend y backend
- schemas validan payloads públicos
- naming consistente con el resto del proyecto

---

## **CARD 2 — Backend Read Model for Group Progress**

### **Objetivo**

Exponer progreso global y siguiente pendiente cronológico del usuario.

### **Alcance**

- servicio backend
- endpoint o expansión del payload actual que alimente `home` pre-torneo
- orden cronológico de grupos

### **Tareas**

#### **Task 2.1**

Definir fuente de verdad para partidos de fase de grupos.

#### **Task 2.2**

Resolver qué partidos del usuario cuentan como completados.

#### **Task 2.3**

Calcular el siguiente partido pendiente cronológico.

#### **Task 2.4**

Exponer resumen listo para render en frontend.

### **Acceptance**

- el cliente no necesita ordenar ni contar por su cuenta
- el siguiente pendiente es estable y reproducible

---

## **CARD 3 — Home Pre-Tournament Mode**

### **Objetivo**

Reorientar `home` para el período previo al torneo.

### **Alcance**

- nuevo bloque principal de progreso
- CTA `Seguir completando`
- acceso a `Tu Mundial`
- reducción de ruido de scoring/ligas como prioridad central

### **Tareas**

#### **Task 3.1**

Definir state matrix de `home` pre-torneo:

- empty
- partial
- complete
- transition to live

#### **Task 3.2**

Implementar copy y jerarquía visual binding para ese modo.

#### **Task 3.3**

Mantener compatibilidad con la `home` actual cuando ya no sea pre-torneo.

### **Acceptance**

- la `home` deja claro qué hacer primero
- el usuario entiende su progreso sin leer demasiado

---

## **CARD 4 — Marathon Mode**

### **Objetivo**

Implementar el flujo secuencial de predicción rápida.

### **Alcance**

- modal o fullscreen modal especializado
- progreso visible
- auto-advance luego de guardar
- salida clara

### **Tareas**

#### **Task 4.1**

Resolver selección del siguiente partido pendiente.

#### **Task 4.2**

Diseñar `MarathonProgressHeader`.

#### **Task 4.3**

Diseñar `MarathonPredictionModal` reutilizando componentes ya existentes cuando convenga.

#### **Task 4.4**

Mantener compatibilidad con guardado real de predicciones y reglas actuales.

### **Acceptance**

- el flujo permite cargar varios partidos seguidos
- no rompe el detalle de partido ni el modal actual donde siga aplicando

---

## **CARD 5 — Tu Mundial**

### **Objetivo**

Mostrar standings proyectados de grupos usando datos derivados de backend.

### **Alcance**

- servicio de proyección de grupos
- endpoint / read model
- UI mobile-first de cards por grupo

### **Tareas**

#### **Task 5.1**

Implementar lógica de tabla proyectada desde predicciones del usuario.

#### **Task 5.2**

Resolver criterio de orden de equipos.

#### **Task 5.3**

Construir `GroupStandingsCard` variant `predicted`.

#### **Task 5.4**

Mostrar estados:

- vacío
- parcial
- completo

### **Acceptance**

- cada guardado puede reflejarse luego en la tabla proyectada
- el top 2 es legible a simple vista
- la tabla es escaneable en mobile

---

## **CARD 6 — Transition to Live Tournament UX**

### **Objetivo**

Hacer convivir sin fricción el modo pre-torneo y el loop actual partido-a-partido.

### **Alcance**

- detección de transición
- priorización correcta del quick modal actual
- fallback limpio a la home y matches ya existentes

### **Tareas**

#### **Task 6.1**

Definir el trigger exacto de salida de `preTournamentMode`.

#### **Task 6.2**

Verificar que el quick modal actual retome prioridad cuando corresponde.

#### **Task 6.3**

Asegurar que `Tu Mundial` siga accesible luego del cambio de modo.

### **Acceptance**

- no hay cambio brusco de experiencia
- no se duplican prioridades UX en conflicto

---

# **8. Orden recomendado de ejecución interna**

1. `CARD 1`
2. `CARD 2`
3. `CARD 3`
4. `CARD 4`
5. `CARD 5`
6. `CARD 6`

Razón:

- primero cerrar contratos y modo
- luego habilitar progreso y `home`
- después resolver el flujo secuencial
- recién entonces construir `Tu Mundial`

---

# **9. Relación con Epic 4**

Esta épica NO reemplaza `Epic 4`.

La desplaza.

Nuevo orden recomendado:

1. `Epic 3`
2. `Epic 3.5`
3. `Epic 4`

Justificación:

- `Epic 3.5` redefine el loop visible principal antes del torneo
- `Epic 4` sigue siendo central para la capa social
- pero no conviene continuar la capa social sobre una prioridad UX ya desactualizada

---

# **10. Nota explícita sobre Mundial Real**

`Mundial Real` queda documentado como siguiente gran superficie de torneo, pero fuera de esta épica.

Su implementación debe esperar:

- ingestión real
- normalización backend
- persistencia de tablas oficiales
- estrategia de refresh visible

Hasta entonces:

- se puede preparar naming
- se puede preparar diseño
- no se debe construir la capa de datos real
