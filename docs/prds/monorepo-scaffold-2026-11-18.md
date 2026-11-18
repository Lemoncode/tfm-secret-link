---
Status: completed
Topic: Monorepo TypeScript + Turborepo con front (Vite, cero deps cliente), back (Hono) y MongoDB en Docker
Date: 2026-11-18
---

# PRD: Monorepo scaffold (front / back / MongoDB)

**Date**: 2026-11-18
**Mode**: co-creation
**Status**: completed

## Problem Statement

Arrancamos la aplicación de transferencia segura de secretos descrita en
`doc/00-definicion-transferencia-segura-secretos .md` (contexto de producto; este paso NO
implementa el protocolo). Hace falta el andamiaje: un monorepo TypeScript con Turborepo, un
front web servido por Vite con **cero dependencias de ejecución en el cliente** y CSS puro, un
back en Hono con las mínimas dependencias, y un MongoDB local en Docker.

La aplicación transmitirá información sensible, así que el andamiaje debe minimizar la
superficie de cadena de suministro desde el primer commit: una dependencia comprometida —de
cliente o de desarrollo— puede exponer secretos o alterar el JS entregado (documento §9.3).

Estado de partida: el repo solo contiene el harness Lemony (`package.json` con
`@lemoncode/lemony`, instalado con npm, `package-lock.json`).

## User Stories

1. Como desarrollador, quiero clonar el repo y con `pnpm install` + `pnpm dev` tener front y back corriendo, para empezar a construir el protocolo.
2. Como desarrollador, quiero `docker compose up -d` para tener un MongoDB local autenticado y no expuesto a mi red.
3. Como responsable de seguridad, quiero que ninguna dependencia ejecute scripts de instalación ni se instale una versión recién publicada, para reducir el riesgo de supply chain.
4. Como usuario final, quiero que el navegador solo ejecute código propio servido desde el mismo origen, sin CDN ni terceros.
5. Como desarrollador, quiero que CI rechace un PR con lockfile desalineado, tipos rotos, formato incorrecto, tests fallidos o vulnerabilidades conocidas.

## Technical Decisions

- **PD1 — Gestor de paquetes**: pnpm 10 con workspaces; la raíz migra de npm (`package-lock.json`) a pnpm (`pnpm-lock.yaml`) — because bloquea lifecycle scripts de dependencias por defecto, soporta `minimumReleaseAge`, node_modules estricto (sin dependencias fantasma) y Turborepo lo soporta de primera.
  - Looked: `pnpm --version` → 10.19.0; `grep minimumReleaseAge|onlyBuiltDependencies /usr/local/lib/node_modules/pnpm/dist/pnpm.cjs` → ambas presentes.
  - Looked: `node_modules/@lemoncode/lemony/package.json` (0.12.0) → sin scripts preinstall/install/postinstall; deps: ignore, markdown-it, yaml, zod. La migración y el bloqueo de scripts no afectan al harness.
- **PD2 — Política de dependencias (estricta)**: versiones exactas (`save-exact`, sin `^`/`~`); `minimumReleaseAge` de 7 días (10080 min); lifecycle scripts bloqueados con allowlist explícita (`onlyBuiltDependencies`), vacía salvo que una herramienta (p. ej. esbuild) lo requiera y se autorice explícitamente; lockfile congelado en CI; `pnpm audit` como gate de CI — because el documento exige versiones reproducibles y ningún código de terceros no controlado.
- **PD3 — Almacén de estado**: MongoDB (no Redis, pese a §4.3/§11 del documento). La duración de la sala será un campo del documento (`expiresAt`) que el servidor valida en cada operación (hoy 5 min; puede crecer, p. ej. a 20 min); aparte, un índice TTL de purga de ~1 h solo para que la base no crezca. En este paso solo se levanta el contenedor: ni base de datos, ni colecciones, ni índice — because el usuario lo prefiere y el TTL de Mongo (granularidad ~60 s) basta para purga, mientras que la caducidad exacta la aplica el servidor.
- **PD4 — Contenedor MongoDB (endurecido)**: `docker-compose.yml` en la raíz; imagen oficial `mongo:8.0.x` fijada por tag **y** digest sha256; autenticación activada con usuario/contraseña root en `.env` (gitignored) y `.env.example` versionado; puerto publicado solo en `127.0.0.1:27017`; volumen con nombre para los datos; healthcheck — because evita exposición a la red local y que un re-tag del registro cambie la imagen.
- **PD5 — Runtime del back**: Hono + `@hono/node-server` sobre Node 24 con type-stripping nativo: `node --watch src/index.ts` en dev, `node src/index.ts` en producción; `typescript` solo para `tsc --noEmit`; sin tsx/esbuild en back. Restricción: `erasableSyntaxOnly` (sin `enum`, `namespace`, parameter properties) e imports relativos con extensión `.ts` — because minimiza dependencias del servidor.
  - Looked: `node <scratch>/i.ts` con anotaciones de tipo en Node v24.22.1 → imprime `ok 1` sin flags.
- **PD6 — Origen y despliegue**: mismo origen. En dev, Vite (5173) hace proxy de `/api` y `/ws` al back (3000); en producción Hono sirve los estáticos de `apps/front/dist` — because permite CSP `default-src 'self'` / `connect-src 'self'`, sin CORS ni proveedor externo entregando el JS.
- **PD7 — Layout**: `apps/front` y `apps/back` (convención Turborepo), con sitio para `packages/*` (p. ej. un futuro `packages/protocol`, no en este paso).
- **PD8 — Tests**: Vitest + `@vitest/coverage-v8` como devDependencies en front y back (environment `node` en ambos hasta que haga falta DOM); Playwright E2E se añadirá más adelante, no ahora — because cobertura medible y Vitest reutiliza Vite; el riesgo de dev-deps se cubre con PD2.
- **PD9 — Formato, sin linter**: solo Prettier; no habrá ESLint/Biome ni tarea `lint`. El script `format:check` (`prettier --check`) sustituye a `lint` como gate — because el usuario no quiere linter; Prettier no tiene dependencias transitivas.
- **PD10 — CI**: GitHub Actions mínimo en PR y push a main: `pnpm install --frozen-lockfile`, turbo `typecheck`, `format:check`, `test`, `build`, más `pnpm audit`; actions fijadas por SHA de commit; `permissions: contents: read`.
- **PD11 — Contenido funcional del andamiaje**: back con `GET /api/health` → `{ status: "ok" }` y el middleware `secureHeaders` de Hono (incluido en `hono`) con CSP estricta, `Cache-Control: no-store` y sin `X-Powered-By`; front con `index.html`, `styles.css` (CSS puro, sin Tailwind ni preprocesador) y `main.ts` que llama a `/api/health` y muestra el estado. Sin driver de Mongo en el back.
- **PD12 — Valores base del monorepo**: Node 24 fijado (`.nvmrc`, `engines`, `packageManager: pnpm@10.19.0`); `tsconfig` base compartido en la raíz (`strict`, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`); puertos back 3000 / Vite 5173; tareas turbo `dev`, `build`, `typecheck`, `format:check`, `test`, `test:coverage`.

## Testing Decisions

- **Back**: Vitest sobre la app Hono vía `app.request()` — `/api/health` responde 200 con `{ status: "ok" }` y las cabeceras de seguridad (CSP, `Cache-Control: no-store`, sin `X-Powered-By`).
- **Front**: Vitest (environment node) sobre la lógica de `main.ts` que sea pura (p. ej. interpretar la respuesta de health); sin DOM aún.
- **Infra**: verificación manual/real-run de `docker compose up -d` con healthcheck en verde y `pnpm dev` levantando ambos.
- **Supply chain**: `pnpm install --frozen-lockfile` y `pnpm audit` en CI.

## Out of Scope

- El protocolo (ECDH/HKDF/AES-GCM, WebSocket, salas, código de verificación).
- Crear base de datos, colecciones o el índice TTL en MongoDB; driver de Mongo en el back.
- Design system y diseño de pantallas (paso siguiente, lo trae el usuario).
- Playwright / E2E.
- Despliegue a producción (más allá de que Hono sepa servir `front/dist`).
- Linter de reglas.

## Discarded Alternatives

- **npm workspaces / Bun**: menos control de scripts y edad de release / runtime adicional.
- **Redis** (y Redis + Mongo): el usuario elige Mongo; Redis queda descartado por ahora.
- **tsx / tsc a dist en back**: tsx trae esbuild con binario y postinstall; tsc a dist añade build innecesario.
- **Orígenes separados**: requiere CORS y un proveedor externo sirviendo el JS.
- **Biome / ESLint+Prettier**: el usuario solo quiere Prettier.
- **node:test**: el usuario prefiere Vitest por cobertura e integración con Vite.

## Assumptions

None.

## Risks

- Vite/Vitest (y sus binarios nativos vía optionalDependencies: esbuild/rollup o rolldown) son dependencias de desarrollo que se ejecutan en la máquina del dev y en CI y podrían alterar el build; mitigado por PD2, no eliminado.
- El documento de producto sigue diciendo Redis (§4.3, §11); queda desalineado con PD3 hasta que se actualice.
- El nombre del archivo del documento lleva un espacio antes de `.md`, lo que complica enlazarlo.

## Open Points

- [ ] Actualizar el documento de producto para reflejar MongoDB en lugar de Redis.
- [ ] Declarar `gates` en `harness.config.yml` (hoy sin declarar) con los scripts reales.

## Next Steps

- [ ] Hand off to the Planner (`write-plan`) to turn this PRD into the task's plan.
