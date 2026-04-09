# Prode Mundial - DESIGN_SYSTEM.md

## Propósito

Definir una base visual y de interacción mínima para implementar el MVP con consistencia.

Este documento no reemplaza el UX brief.
Lo complementa con reglas de sistema reutilizable.

---

# 1. Principios visuales

- claridad antes que espectacularidad
- mobile-first real
- foco en acción y estado
- fricción mínima
- consistencia entre pantallas críticas

---

# 2. Tono visual

La interfaz debe sentirse:

- rápida
- limpia
- deportiva sin exceso
- social
- entendible en segundos

Evitar:

- sobrecarga decorativa
- dashboards densos
- gamificación visual excesiva

---

# 3. Jerarquía base

Priorizar siempre:

1. acción principal
2. estado actual
3. deadline
4. feedback
5. contexto secundario

---

# 4. Componentes núcleo del MVP

- top bar
- bottom navigation
- card de partido
- card de liga
- ranking row
- input numérico de score
- button primary
- button secondary
- badge de estado
- toast de feedback
- empty state
- inline ad slot seguro

---

# 5. Estados visuales obligatorios

Todo componente crítico debe soportar, si aplica:

- default
- loading
- success
- error
- disabled
- locked
- scored

---

# 6. Reglas de copy UX

- frases cortas
- verbos directos
- deadlines explícitos
- confirmaciones visibles
- errores concretos, no ambiguos

---

# 7. Reglas específicas del MVP

- no insertar ads entre input y guardado
- destacar siempre la fila del usuario en rankings de liga
- mostrar límites de liga de forma simple cuando aplique
- no mostrar features post-MVP como si estuvieran operativas

---

# 8. Referencias canónicas

Para detalle de pantallas y flujos, usar:

- `06. Prode Mundial - UX Sitemap Wireframe Brief.md`
- `05. Prode Mundial - Functional Specification v1.md`

Si este documento contradice esos assets, corregir este documento.
