# Prode Mundial - ATOMIC_TASKING_GUIDE.md

## Propósito

Definir cómo dividir trabajo para que Codex implemente sin caos, retrabajo ni prompts gigantes.

---

# 1. Regla base

Una task correcta debe poder expresarse como:

- un objetivo
- un alcance
- una salida verificable

Si una task necesita demasiadas aclaraciones, todavía no está bien cortada.

---

# 2. Qué es una task atómica

Una task atómica:

- resuelve una sola pieza de comportamiento
- afecta un set chico de archivos o un único flujo
- tiene criterio de aceptación claro
- puede probarse sin depender de media épica completa

Ejemplos buenos:

- definir contrato `LeagueSummary`
- implementar validación `LEAGUE_CAPACITY_REACHED`
- renderizar empty state de `Mis ligas`

Ejemplos malos:

- implementar todo ligas
- hacer auth + home + rankings
- dejar listo backend completo

---

# 3. Orden recomendado de corte

Para cada épica, cortar así:

1. contratos shared
2. entidades / repositorios
3. use-cases
4. endpoints
5. pantallas
6. endurecimiento y tests

---

# 4. Regla de tamaño

Si una task:

- cambia más de un dominio principal
- mezcla backend y frontend sin un contrato ya cerrado
- requiere explicar demasiadas decisiones nuevas

entonces debe dividirse.

---

# 5. Regla documental

Antes de ejecutar una task:

1. leer la épica
2. leer el contrato o estado implicado
3. verificar que no haya contradicción con canon/data model/API/state matrix

Si falta una definición crítica:

- no avanzar
- documentar gap
- escalar o corregir

---

# 6. Checklist corto por task

- objetivo único
- alcance acotado
- contrato claro
- estados claros
- errores claros
- validación clara
- criterio de done claro

---

# 7. Anti-patrones

- tasks “catch-all”
- tasks con múltiples decisiones abiertas
- tasks que mezclan roadmap con MVP
- tasks que dependen de documentos aún contradictorios
- tasks que fuerzan a Codex a inventar estructura

---

# 8. Relación entre tasks, branches y sesiones

Para mantener trazabilidad y bajar riesgo operativo:

1. cada épica debe empezar en su branch dedicada
2. las cards deben trabajarse de manera secuencial y atómica dentro de esa branch
3. cada sesión con avance material debe cerrar con:
   - validación mínima razonable
   - commit
   - push
4. el merge a `main` debe ocurrir solo cuando la épica esté cerrada y QA confirmada

Regla práctica:

- branch por épica como default
- branch por card solo si la complejidad o duración lo justifican
