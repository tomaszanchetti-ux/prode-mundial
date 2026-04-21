# Prode Mundial - TESTING STRATEGY

## Propósito

Este documento define la estrategia oficial de testing del proyecto.

Su objetivo es:

- ordenar el trabajo de producto, UX/UI y lógica
- evitar mezclar validaciones de distinta naturaleza demasiado pronto
- dejar claro qué se prueba en cada fase
- convertir el testing en parte explícita del workflow del proyecto

Este documento es binding para la ejecución del MVP actual.

---

# 1. Principio rector

El proyecto se valida en tres fases secuenciales.

El orden es obligatorio:

1. `Testing 1 - UX/UI`
2. `Testing 2 - Logica Cerrada`
3. `Testing 3 - Logica Abierta`

No conviene abrir fases posteriores si la anterior todavía tiene desvíos importantes.

La razón es simple:

- primero hay que validar experiencia
- después consistencia lógica en entorno controlado
- recién después comportamiento con usuarios y datos externos

---

# 2. Testing 1 - UX/UI

## Objetivo

Validar la experiencia completa de la app de punta a punta, sin depender todavía de condiciones reales de operación.

La prioridad de esta fase es:

- claridad visual
- continuidad entre pantallas
- jerarquía de información
- ritmo de interacción
- copys
- estados visibles
- fricción del flujo completo

## Entorno

- trabajo local
- data dummy
- seeds y fixtures controlados
- posibilidad de habilitar estados o recorridos de laboratorio si ayudan a probar UX/UI

## Alcance esperado

Esta fase debe ser deliberadamente amplia y muy exhaustiva.

Debe incluir:

- recorrido pantalla por pantalla
- recorrido click por click
- validación modo por modo
- validación estado por estado
- validación de empty, partial, complete, loading, error y success states
- validación mobile-first real
- validación de continuidad entre entry points
- validación de tono, copy, labels, CTA y feedback inmediato

## Regla clave

En esta fase se puede usar lógica dummy o condiciones locales controladas si eso acelera la validación UX/UI.

Eso incluye, si hiciera falta:

- data artificial
- estados preparados manualmente
- caminos de interacción habilitados solo para testing local

Siempre que:

- quede claro que es soporte de testing
- no se confunda con la regla final de producción
- no contradiga el canon del MVP sin nota explícita

## Resultado esperado

Al cerrar esta fase, la app debe sentirse coherente, usable, escaneable y convincente como producto, aun antes de endurecer toda la lógica real.

---

# 3. Testing 2 - Logica Cerrada

## Objetivo

Validar que frontend y backend funcionen correctamente juntos en un entorno controlado, con reglas reales del sistema y sin exposición abierta a usuarios externos.

## Entorno

- entorno cercano a producción
- backend real
- contratos reales
- persistencia real
- data dummy o controlada
- acceso restringido al equipo

## Alcance esperado

Debe validar:

- interacción real frontend/backend
- integridad de contratos
- persistencia
- deadlines
- locks
- scoring
- standings
- consistencia entre estados derivados y UI
- consistencia entre escritura y lectura

## Regla clave

En esta fase ya no conviene apoyarse en hacks de UX si alteran la lógica real del sistema.

Si una regla de laboratorio usada en `Testing 1` choca con la lógica real:

1. debe aislarse
2. debe retirarse
3. o debe formalizarse explícitamente si pasa a ser parte del producto

## Resultado esperado

Al cerrar esta fase, el producto debe poder sostenerse técnicamente en una prueba controlada sin inconsistencias relevantes entre backend, frontend y persistencia.

---

# 4. Testing 3 - Logica Abierta

## Objetivo

Abrir una validación controlada con un grupo reducido y empezar a probar condiciones más cercanas a operación real, incluyendo integración con fuentes externas cuando corresponda.

## Entorno

- entorno controlado pero abierto a un grupo reducido
- observación de uso real
- datos externos acotados o experimentales
- monitoreo manual cercano

## Alcance esperado

Debe validar:

- comportamiento con usuarios reales
- errores no previstos en uso natural
- robustez del flujo completo
- calidad de fetch, sync o ingestión externa
- estabilidad operativa básica

## Caso puente recomendado

Para la próxima fase de validación lógica abierta, el proyecto puede usar un caso puente con partidos de Champions League como entorno de prueba controlado de fetch y lógica externa.

Esto sirve para:

- probar ingestión
- probar normalización
- probar actualización de datos externos
- ganar confianza antes de depender del Mundial real

## Regla clave

Esta fase sigue siendo controlada.

No equivale todavía a operación masiva ni a una apertura sin supervisión.

---

# 5. Reglas operativas para el workflow

## 5.1 Orden de ejecución

El equipo debe respetar esta secuencia:

1. cerrar UX/UI en `Testing 1`
2. endurecer lógica en `Testing 2`
3. abrir validación reducida en `Testing 3`

## 5.2 Impacto sobre implementación

Cuando exista tensión entre:

- mejor experiencia local de test UX/UI
- y regla final de producción

se debe explicitar en qué fase está trabajando el equipo antes de decidir.

## 5.3 Impacto sobre documentación

Cuando una fase requiera:

- flags de laboratorio
- seeds especiales
- mocks
- fuentes externas puente

eso debe quedar documentado en el repo antes de que se vuelva parte del workflow.

## 5.4 Impacto sobre Epic 3.5

La implementación actual de `Epic 3.5` debe leerse bajo este marco:

- primero conviene cerrar la experiencia de `Pre-Tournament Mode`, `Marathon Mode` y `Tu Mundial` para `Testing 1`
- luego endurecer la lógica real que corresponda para `Testing 2`
- y recién después abrir validación con fuente externa o usuarios reducidos en `Testing 3`

---

# 6. Próximo hito ya acordado

Objetivo temporal acordado:

- apuntar la próxima semana a una fase inicial de prueba real controlada con Champions League como caso puente de `Testing 3`

Esto supone que antes deben quedar suficientemente avanzadas:

- la UX/UI del producto
- la base lógica cerrada necesaria
- la preparación documental y técnica para ingestión/fetch experimental

---

# 7. Relación con otros documentos

Este documento se complementa con:

- `AGENTS.md`
- `README.md`
- `docs/handoff/PROJECT_MEMORY.md`
- `docs/engineering/Prode Mundial - TECH DECISIONS.md`
- `docs/backlog/EPIC 3.5 — Pre-Tournament Mode, Tu Mundial & Marathon Mode.md`

Si alguna práctica contradice este orden de testing, debe corregirse o escalarse antes de continuar.
