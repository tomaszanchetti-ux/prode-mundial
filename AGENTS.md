# Prode Mundial - AGENTS.md

## Propósito

Este documento define cómo debe trabajar Codex o cualquier otro LLM sobre Prode Mundial.

No redefine producto.
No redefine arquitectura.
No redefine UX.

Su función es convertir el corpus actual en una forma de ejecución segura, predecible y costo-eficiente.

---

# 0. Base documental del proyecto

La base principal del proyecto es esta carpeta:

`/Users/tzanchetti/Documents/Proyectos Claudio/prode-mundial`

La documentación de trabajo vive aquí:

- `AGENTS.md`
- `ATOMIC_TASKING_GUIDE.md`
- `docs/product`
- `docs/engineering`
- `docs/backlog`

La carpeta documental anterior en:

`/Users/tzanchetti/Documents/NewCo - Proyectos/Prode Mundial`

debe considerarse archivo histórico / origen de migración.  
No debe usarse como base operativa principal salvo para verificar contexto faltante que todavía no se haya copiado.

---

# 1. Principios rectores

## 1.1 Documento antes que código

No empezar a implementar una épica si:

- el comportamiento no está cerrado en el corpus
- hay contradicción entre documentos
- falta contrato, estado o regla crítica

Si aparece contradicción:

1. detener implementación
2. identificar documentos en conflicto
3. corregir o escalar
4. recién después seguir

## 1.2 El canon manda

La fuente de verdad funcional y técnica parte de:

1. `docs/product/00. Prode Mundial - MVP CANON.md`
2. `docs/engineering/Prode Mundial - TECH DECISIONS.md`
3. `docs/engineering/Prode Mundial - DATA MODEL.md`
4. `docs/engineering/03. Prode Mundial - API Specification (Endpoints + Contracts + Payloads).md`
5. `docs/engineering/Prode Mundial - STATE MATRIX + BUSINESS STATES SPEC (MVP v1).md`
6. `docs/engineering/Prode Mundial - BACKEND EXECUTION MODEL (Jobs + Scoring + Orchestration) — MVP v1.md`
7. `docs/product/DESIGN_SYSTEM.md` para cualquier decisión visual, de componentes o interacción UI

Los demás docs desarrollan o aterrizan esas decisiones.

## 1.3 Simplicidad primero

Siempre preferir:

- menos moving parts
- menos estados
- menos abstractions
- menos campos
- menos runtime magic

No introducir features o flexibilidad “por si acaso”.

## 1.4 Backend source of truth

No mover al frontend lógica de:

- scoring
- standings
- locking
- deadlines
- permisos efectivos
- `canJoin`

## 1.5 MVP real, no roadmap

Implementar solo el MVP operativo actual:

- sin ranking global
- ligas con capacidad operativa de 20 miembros
- sin checkout
- sin billing runtime
- sin branding premium

Todo lo post-MVP debe quedar documentado, no implementado.

---

# 2. Flujo de trabajo obligatorio

## 2.1 Antes de tocar código

Para cada tarea:

1. identificar épica y card
2. leer solo los docs necesarios
3. confirmar contratos, estados y entidades afectadas
4. detectar gaps o tensiones
5. recién después editar código

## 2.2 Orden de implementación recomendado

1. shared contracts
2. data model / repositorios
3. use-cases y reglas de dominio
4. API / handlers
5. frontend
6. tests

## 2.3 Orden dentro de una task

1. definir o validar input/output
2. implementar regla de negocio
3. conectar persistencia
4. exponer contrato
5. conectar UI
6. cubrir con tests mínimos útiles

## 2.3 Regla adicional para frontend/UI

Antes de tocar pantallas o componentes visuales:

1. leer `docs/product/DESIGN_SYSTEM.md`
2. validar si ya existe primitive o componente en `packages/ui`
3. evitar crear estilos o componentes fuera del sistema salvo transición explícita

## 2.4 Flujo Git obligatorio

Para evitar trabajo mezclado y sesiones difíciles de auditar:

1. abrir una branch específica por épica antes de empezar trabajo real
2. usar prefijo claro, por ejemplo:
   - `epic/epic-1-foundation-auth-shell`
   - o `epic/epic-1-foundation-auth-shell-card-5` si hiciera falta aislar una card grande
3. trabajar las cards en local, una por vez, siguiendo atomicidad
4. al cierre de cada sesión con avance material:
   - correr validaciones razonables
   - hacer commit
   - hacer push al branch activo
5. al terminar la épica:
   - hacer QA sobre ese branch
   - corregir desvíos
   - recién entonces mergear a `main`

## 2.5 Regla práctica recomendada

Si una épica fuera demasiado grande para vivir cómodamente en un solo branch durante varios días:

- mantener una branch madre de épica
- permitir sub-branches por card solo si agregan claridad real
- evitar abrir branches por tareas demasiado pequeñas si eso agrega fricción innecesaria

---

# 3. Reglas de ejecución

## 3.1 Atomicidad

Trabajar una task atómica por vez.

Una task atómica:

- toca un objetivo claro
- tiene input/output definidos
- puede verificarse sola
- no mezcla múltiples dominios sin necesidad

## 3.2 Cambios mínimos

Cuando un documento o módulo ya resuelve el problema:

- extenderlo
- no duplicarlo

Cuando una decisión no está cerrada:

- no inventarla
- dejar nota explícita

## 3.3 Contratos explícitos

Todo cambio en payload, estado o entidad debe reflejarse donde corresponda:

- shared
- API spec
- data model
- state matrix
- tests si aplica

## 3.4 Testing pragmático

Priorizar tests sobre:

- reglas de dominio
- constraints
- idempotencia
- errores públicos
- flows críticos

No sobrediseñar test infra antes de que exista producto suficiente.

---

# 4. Definition of Done

Una task está terminada solo si:

- respeta el canon
- no contradice contratos ni estados
- no introduce features fuera de alcance
- deja código coherente con el repo structure
- deja validación razonable
- deja trazabilidad documental si cambió una decisión

Una épica está terminada solo si:

- cumple su documento épico
- no deja roto el flujo demo esperado
- no empuja deuda documental crítica a la siguiente épica

---

# 5. Qué no hacer

- no codear directo desde una idea suelta
- no asumir roadmap como si fuera MVP
- no agregar pagos, branding premium o planes pagos operativos
- no recrear ranking global
- no crear modelos “future-proof” complejos sin necesidad actual
- no duplicar tipos, contratos o enums
- no mover lógica crítica a componentes UI

---

# 6. Relación con otros assets

Este documento se complementa con:

- `ATOMIC_TASKING_GUIDE.md`
- `docs/backlog/BACKLOG.md`
- `docs/product/DESIGN_SYSTEM.md`

Si alguno contradice el canon, manda el canon.

---

# 7. Cierre de sesión

Al cerrar una sesión relevante, debe hacerse siempre:

1. actualizar `docs/handoff/PROJECT_MEMORY.md`
2. crear o actualizar un handoff de sesión en `docs/handoff`
3. usar nombre:
   - `Prode Mundial_WS[N°]_DDMMAAAA.md`
4. registrar:
   - qué se hizo
   - qué quedó pendiente
   - qué debe hacerse después
5. si hubo cambios de código con valor material:
   - commit en el branch de trabajo
   - push al remoto
   - riesgos o notas operativas

## Regla

El cierre de sesión no es opcional cuando hubo:

- decisiones documentales
- bootstrap técnico
- cambios de arquitectura
- avance material de épica
