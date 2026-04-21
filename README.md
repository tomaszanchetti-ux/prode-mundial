# Prode Mundial

Bootstrap inicial del monorepo para el MVP de Prode Mundial.

## Stack

- `apps/web`: Next.js
- `apps/api`: Node.js + Express + TypeScript
- `apps/jobs`: runners batch skeleton
- `apps/admin`: placeholder administrativo
- `packages/shared`: contratos y tipos compartidos

## Documentación base

- `AGENTS.md`
- `ATOMIC_TASKING_GUIDE.md`
- `docs/engineering/Prode Mundial - TESTING STRATEGY.md`
- `docs/product`
- `docs/engineering`
- `docs/backlog`

## Requisitos locales

- Node.js 24+
- `corepack` habilitado
- `pnpm`

## Primer arranque

```bash
corepack enable
corepack prepare pnpm@10.18.3 --activate
pnpm install
pnpm dev:setup
```

`pnpm dev:setup` asegura primero la base de `teams`, `groups` y `matches` en Firestore si el proyecto está vacío y después levanta web + api en paralelo.

Para levantar el entorno con una demo competitiva fresca en un solo paso:

```bash
pnpm dev:demo
```

## Setup Firebase local

Para probar el flujo real de `Epic 1` hace falta configurar Firebase tanto para API como para web.

### 1. Variables de entorno raíz

Usa `.env.example` como base y crea un `.env` en la raíz:

```bash
cp .env.example .env
```

Completa estas variables con una service account válida de Firebase:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Notas:

- `FIREBASE_PRIVATE_KEY` debe conservar los saltos de línea escapados como `\n`
- `NEXT_PUBLIC_WEB_URL` debe apuntar a `http://localhost:3000`
- `NEXT_PUBLIC_API_URL` debe apuntar a `http://localhost:4000`

### 2. Variables públicas para Next.js

La web necesita exponer `NEXT_PUBLIC_FIREBASE_*` en `apps/web/.env.local`.

```bash
cat <<'EOF' > apps/web/.env.local
NEXT_PUBLIC_APP_NAME=Prode Mundial
NEXT_PUBLIC_WEB_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_FIREBASE_API_KEY=replace-me
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=replace-me
NEXT_PUBLIC_FIREBASE_PROJECT_ID=replace-me
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=replace-me
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=replace-me
NEXT_PUBLIC_FIREBASE_APP_ID=replace-me
EOF
```

### 3. Configuración en Firebase Console

- habilitar `Google` en Authentication > Sign-in method
- habilitar `Email link` en Authentication > Sign-in method
- agregar `http://localhost:3000` a los dominios autorizados
- verificar que Firestore esté creado y accesible para el proyecto

### 4. Flujo de prueba recomendado

1. levantar `pnpm dev`
2. abrir [http://localhost:3000](http://localhost:3000)
3. entrar por Google o pedir un magic link
4. verificar redirect a `/profile` si el usuario no completó perfil
5. completar nombre visible y confirmar llegada a `/home`

## Troubleshooting auth

- Si Google no abre popup: el navegador probablemente está bloqueando popups.
- Si el magic link no completa: pedir uno nuevo y usar el mismo email con el que se envió.
- Si la landing pública abre pero la API local no está arriba: la web ahora usa un fallback con el bootstrap por defecto para no bloquear DX.
- Si la API devuelve `401` luego de haber iniciado sesión: normalmente significa token vencido o inválido; cerrar sesión y volver a entrar resuelve el caso.

## Scripts

- `pnpm dev:setup`
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

## Seed local de World Cup 2026

Para cerrar `Epic 2 / CARD 2`, la API ya tiene un seed reproducible para `teams`, `groups` y `matches` usando el fixture oficial normalizado de FIFA 2026.

Resumen rápido:

```bash
pnpm --filter @prode/api ensure:wc2026
pnpm --filter @prode/api seed:wc2026 -- --dry-run
pnpm --filter @prode/api seed:wc2026
```

Notas:

- `ensure:wc2026` verifica si faltan `teams`, `groups` o `matches` y solo entonces ejecuta el seed real
- el script requiere las credenciales Firebase ya cargadas en `.env`
- `--dry-run` imprime el resumen del seed sin escribir en Firestore
- el seed deja una mezcla útil de estados para desarrollo: partidos `scheduled`, `live` y `finished`

## Workflow local de data dummy

Para desarrollo del core competitivo, el proyecto adopta una estrategia de dos capas:

- base real del torneo:
  - `teams`
  - `groups`
  - `matches`
- capa demo temporal:
  - `leagues`
  - `leagueMembers`
  - `leagueStandings`
  - usuarios demo
  - predicciones demo
  - partidos demo / scoring demo

Regla operativa:

- la base real del torneo puede quedar sembrada de forma estable en local
- la capa demo convive temporalmente con esa base
- la capa demo NO debe correr automáticamente en cada `pnpm dev`
- la capa demo debe poder sembrarse y resetearse de forma explícita

Objetivo:

- probar creación/join de ligas
- probar scoring
- probar puntos
- probar standings
- probar UX de rankings y detalle competitivo

sin depender todavía de una fuente externa de resultados reales

### Script demo actual

Existe un seed de demo competitivo:

```bash
pnpm --filter @prode/api seed:competition-demo
pnpm --filter @prode/api reset:competition-demo
pnpm --filter @prode/api fresh:competition-demo
```

Este seed:

- usa como usuario ancla uno real existente en `users` si lo encuentra
- crea ligas demo
- crea miembros demo
- crea partidos demo separados del fixture principal
- crea predicciones demo
- ejecuta scoring
- deja standings materializados para probar el loop completo

Scripts disponibles:

- `seed:competition-demo`
  crea o refresca la capa demo sin tocar la base real del torneo
- `reset:competition-demo`
  elimina ligas demo, memberships demo, standings demo, partidos demo y predicciones demo
- `fresh:competition-demo`
  ejecuta reset y seed seguidos para dejar un escenario limpio y repetible

### Política de uso en desarrollo

Flujo recomendado:

1. correr `pnpm dev:setup` para asegurar base real mínima
2. correr `pnpm --filter @prode/api fresh:competition-demo` cuando se quiera probar el loop competitivo desde cero
3. levantar `pnpm dev`
4. validar UI, puntos, standings y comportamiento de la liga demo

Atajo:

1. correr `pnpm dev:demo`
2. abrir la app con el usuario ancla que devuelve el seed si se necesita verificar standings

Importante:

- no asumir que el entorno local debe regenerarse automáticamente en cada arranque
- no mezclar cambios de lógica con dependencia obligatoria de datos demo preexistentes
- cuando haga falta repetir pruebas desde un estado limpio, usar `fresh:competition-demo`

## Estrategia oficial de testing

El proyecto trabaja con un orden obligatorio de validación:

1. `Testing 1 - UX/UI`
2. `Testing 2 - Logica Cerrada`
3. `Testing 3 - Logica Abierta`

Resumen práctico:

- `Testing 1`:
  trabajo local, data dummy y validación muy exhaustiva de UX/UI de punta a punta
- `Testing 2`:
  entorno cerrado con lógica real frontend/backend y validación de persistencia, deadlines, scoring y standings
- `Testing 3`:
  validación controlada con grupo reducido y primer uso de fuentes externas o casos puente

Referencia binding:

- `docs/engineering/Prode Mundial - TESTING STRATEGY.md`

## Estrategia futura de ingestión real

La validación con resultados reales NO se mezcla con el flujo dummy.

Secuencia esperada del proyecto:

1. primero validar el core con datos demo controlados
2. después implementar ingestión real en modo seguro
3. recién entonces probar resultados externos sobre pocos partidos

La capa de ingestión real debería entrar más adelante con un flujo de este tipo:

- `fetch:results --dry-run`
- `fetch:results`
- `score:match <matchId>`
- `rebuild:standings`

Objetivo:

- separar testing de producto del testing de integración externa
- poder verificar payload externo, normalización e impacto en scoring sin perder control del entorno local

## Estado actual

Este repo ya cubre una porción funcional de `Epic 1`:

- landing pública conectada al bootstrap real
- login con wiring Firebase client listo para Google + magic link
- validación backend de Firebase ID token
- bootstrap de perfil autenticado sobre Firestore
- shell protegido con guards y redirect a completar perfil

Últimos cierres de `Epic 1`:

- manejo UX más robusto para popup cancelado, link expirado y sesión inválida
- tests mínimos reales para auth guard, login view y `401` en API
- fallback de DX en landing pública cuando la API local no responde
