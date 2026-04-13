# Prode Mundial_WS26_13042026

## Resumen de cierre

Sesion enfocada en cerrar un polish UX corto sobre `Macro Picks` en web.

Resultado principal:

- la pantalla ya evita combinaciones imposibles antes de guardar o confirmar
- el usuario recibe mejor guia sobre avance, faltantes y errores concretos
- `typecheck` web OK
- `test` web OK

---

# 1. Trabajo ejecutado

## 1.1 Validaciones client-side

Se agrego un helper dedicado de validacion para el modulo macro.

Reglas cubiertas:

- mismo equipo repetido en 1° y 2° dentro de un grupo
- finalistas duplicados
- campeon fuera de una dupla valida de finalistas
- ajuste post-grupos sin 2 finalistas validos
- ajuste post-grupos sin campeon valido

## 1.2 Mejoras visibles en la UI

`MacroPicksScreen` ahora muestra mejor contexto operativo:

- card de ayuda con lo que falta para cerrar el pick inicial
- bloque de validaciones antes de guardar picks
- bloque de validaciones dentro del ajuste
- CTA de guardar o confirmar deshabilitada cuando la combinacion actual es invalida
- feedback de draft guardado con porcentaje real de completitud

La decision de producto se mantuvo consistente:

- se siguen permitiendo drafts parciales
- solo se bloquean estados imposibles o inconsistentes

## 1.3 Testing

Se amplio la cobertura para incluir:

- validacion de picks iniciales invalidos
- validacion de campeon fuera de finalistas
- validacion del ajuste incompleto
- hint de completitud

---

# 2. Validaciones ejecutadas

Se ejecuto:

- `./pnpm --filter @prode/web typecheck`
- `./pnpm --filter @prode/web test`

Resultado:

- `typecheck` web OK
- `test` web OK

---

# 3. Punto exacto para retomar

`Epic 5` queda muy cerca de cerrable en web.

Siguiente paso recomendado:

1. decidir si `Macro Picks` tambien necesita acceso directo desde `home`
2. hacer una pasada visual/manual corta en mobile y desktop
3. si no aparecen fricciones nuevas, marcar `Epic 5` como cerrable
4. recien despues abrir `Epic 6`

Frontera recomendada:

- no abrir todavia scoring macro
- no mezclar todavia standings/scoring real con este modulo
- mantener el siguiente bloque enfocado en cierre de epica, no en expansion de alcance
