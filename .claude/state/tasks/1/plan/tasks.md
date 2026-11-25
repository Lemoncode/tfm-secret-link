# Tasks — monorepo-scaffold

> PRD: `docs/prds/monorepo-scaffold-2026-11-18.md`

## Before code

- **`@lemoncode/lemony@0.12.0` se publicó el 2026-11-16 (hace 2 días), así que el `minimumReleaseAge` de 7 días de PD2 bloquearía instalar el propio harness tras migrar a pnpm.** El plan añade una única excepción exacta, `minimumReleaseAgeExclude: ['@lemoncode/lemony@0.12.0']`, y el resto de paquetes respetan los 7 días (la excepción se puede borrar a partir del 2026-11-23). Discarded: retrasar la migración a pnpm hasta el 2026-11-23, o excluir `@lemoncode/lemony` sin versión (cualquier versión futura del harness se saltaría la regla).
- **`@lemoncode/lemony` declara `engines.pnpm >=11.5.1`, pero PD12 fija `pnpm@10.19.0`.** pnpm 10 solo avisa ("Unsupported engine") al instalar y el CLI del harness sigue funcionando (no usa pnpm). El plan mantiene `pnpm@10.19.0` y no activa `engine-strict`, y T1 comprueba que `.claude/hooks/lib/lemony.sh` sigue resolviendo `node_modules/.bin/lemony`.
- **Los puntos abiertos del PRD: se declaran los `gates` y no se toca el documento de producto.** T13 declara `gates` en `harness.config.yml` con los scripts reales (`typecheck`, `format:check`, `test`, `build`, `audit`). Ninguna tarea actualiza Redis→MongoDB en `doc/00-definicion-transferencia-segura-secretos .md`, y la carpeta `doc/` (hoy sin versionar) no se commitea: eso lo decides tú. Discarded: dejar los `gates` para otro paso.
- **El back escucha por defecto en `127.0.0.1:3000` (se puede cambiar con `HOST`/`PORT`).** Así no queda expuesto a la red local en desarrollo, igual que Mongo en PD4. Discarded: el valor por defecto de `@hono/node-server`, que escucha en todas las interfaces.
- **Hono solo sirve `apps/front/dist` cuando `NODE_ENV=production`.** En dev los estáticos los sirve Vite (PD6), y el back no intenta leer un `dist` antiguo. Discarded: servir `dist` siempre que exista.

## Agent-decided

### User-visible

- **Idioma y textos de la página de estado.** Página en español (`<html lang="es">`) con tres estados: "Comprobando servidor…", "Servidor operativo" y "Servidor no disponible" (también si la respuesta no es `{ status: "ok" }`). El texto se pinta con `textContent`. Discarded: textos en inglés.
- **`pnpm dev` no arranca MongoDB.** El contenedor se levanta aparte con `docker compose up -d` (historia de usuario 2), porque el back aún no usa Mongo. Discarded: que `pnpm dev` lance también `docker compose`.
- **`docker compose` se niega a arrancar sin credenciales.** Las variables de usuario y contraseña root se exigen con la sintaxis `${VAR:?mensaje}`, con un error claro si falta `.env`. `.env.example` lleva solo valores de ejemplo. Discarded: valores por defecto dentro del compose.
- **Sección "Cómo arrancar" en el `README.md`, en español.** Cuenta los requisitos (Node 24, pnpm 10.19.0, Docker), `cp .env.example .env`, `docker compose up -d`, `pnpm install` y `pnpm dev`, y la lista de scripts. Discarded: dejar el README como está.
- **Añadidos a `.gitignore`.** `.env` (sin ignorar `.env.example`), `dist/`, `coverage/`, `.turbo/` y `.DS_Store` (hoy hay uno sin versionar en la raíz). Discarded: añadir solo `.env`.

### Internal

- **Dónde va cada herramienta.** `turbo` y `prettier` como devDependencies de la raíz. `typescript`, `vitest` y `@vitest/coverage-v8` en cada app que los usa (con node_modules estricto, cada paquete declara lo que ejecuta). `@types/node` en el back. Discarded: concentrar todas las herramientas en la raíz.
- **Versiones.** Cada dependencia nueva se fija en la versión más reciente que tenga ya 7 días al instalar (la resuelve pnpm con `minimumReleaseAge`). Discarded: fijar a mano versiones mayores concretas.
- **Allowlist de scripts de instalación.** `onlyBuiltDependencies` queda vacía y los scripts que pnpm bloquee (p. ej. el postinstall de validación de esbuild, si aparece) se dejan bloqueados. Si una herramienta no funciona sin su script, el Implementer abre un discovery en vez de autorizarlo. Discarded: autorizar esbuild por adelantado.
- **Directivas de la CSP.** `default-src 'self'`, `script-src 'self'`, `style-src 'self'`, `img-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'` y `form-action 'none'`. Discarded: solo `default-src 'self'`.
- **Alcance de `Cache-Control: no-store`.** Va en todas las respuestas del back, también en los estáticos de producción. Discarded: cachear los assets con hash.
- **Alcance de `format:check`.** Prettier revisa `apps/*`, `packages/*` y los archivos de configuración de la raíz (incluidos el compose y el workflow), y `.prettierignore` excluye `.claude/`, `.lemony/`, `doc/`, `docs/`, `harness.config*`, `pnpm-lock.yaml`, `dist/` y `coverage/`. Discarded: formatear también los archivos del harness y la documentación.
- **Cobertura.** `test:coverage` genera el informe, sin umbral mínimo. Discarded: imponer un umbral en este paso.
- **Forma del CI.** Un único job en `ubuntu-latest`: Node desde `.nvmrc`, pnpm desde `packageManager` y `pnpm audit` con su nivel por defecto. Discarded: una matriz de versiones de Node.
- **Healthcheck de Mongo.** `mongosh --quiet --eval "db.adminCommand('ping')"`, y el digest fijado es el del índice multi-arquitectura del tag `8.0.x`. Discarded: un healthcheck con TCP.
- **Puerto y host del back.** `PORT` (por defecto 3000) y `HOST` (por defecto `127.0.0.1`), leídos del entorno en `src/index.ts`, mientras que la app Hono se exporta aparte para los tests. Discarded: valores fijos en el código.

## Group 1 — Base del workspace y política de dependencias _(el gestor de paquetes y su política deciden qué código de terceros se ejecuta; además deben mantener vivo el harness)_ [risk: supply-chain]

- [x] **T1 — La raíz migra de npm a un workspace pnpm y el harness sigue funcionando; implements PD1, PD12.**
  Desaparece `package-lock.json` y aparece `pnpm-lock.yaml`. Se añaden `pnpm-workspace.yaml` (`apps/*`, `packages/*`), `packageManager: pnpm@10.19.0`, `.nvmrc` (24) y `engines.node`. `@lemoncode/lemony` queda fijado exacto a `0.12.0`. Comprobación con una ejecución real: tras `pnpm install`, `.claude/hooks/lib/lemony.sh --version` imprime `0.12.0` y resuelve el bin local `node_modules/.bin/lemony`.
- [x] **T2 — La política estricta de dependencias está activa; implements PD2.**
  `save-exact`, `minimumReleaseAge: 10080`, la única excepción `@lemoncode/lemony@0.12.0` y `onlyBuiltDependencies` vacía. Comprobación con una ejecución real: añadir una versión publicada hace menos de 7 días se rechaza, y ninguna dependencia ejecuta scripts de ciclo de vida.
- [x] **T3 — Turborepo, el tsconfig base y Prettier están en la raíz; implements PD9, PD12, and respects PD7.**
  `turbo.json` define las tareas `dev` (persistente, sin caché), `build`, `typecheck`, `format:check`, `test` y `test:coverage`. `tsconfig.base.json` lleva `strict`, `noUncheckedIndexedAccess` y `erasableSyntaxOnly`. Los scripts raíz son `pnpm dev|build|typecheck|format:check|test|test:coverage`, más `audit`. No hay tarea ni dependencia de linter. Los añadidos a `.gitignore` van aquí.

## Group 2 — Back Hono _(abre la primera superficie HTTP: cabeceras de seguridad y servicio de archivos estáticos)_ [risk: transport, injection, supply-chain]

- [x] **T4 — `GET /api/health` responde 200 con `{ status: "ok" }`; implements PD5, PD7, PD8, PD11.**
  `apps/back` usa Hono y `@hono/node-server`, sin driver de Mongo. Lleva un test Vitest (environment `node`) que llama a `app.request()` y está primero en rojo. Usa imports relativos con extensión `.ts` y nada de sintaxis no borrable.
- [x] T5 — Toda respuesta del back lleva `secureHeaders` con la CSP estricta y `Cache-Control: no-store`, y ninguna lleva `X-Powered-By`; lo comprueban tests sobre `/api/health` y sobre una ruta inexistente; implements PD11.
- [x] T6 — `pnpm --filter back dev` arranca con `node --watch src/index.ts` y `start` con `node src/index.ts`, sin tsx ni esbuild, en `127.0.0.1:3000`; `typecheck` ejecuta `tsc --noEmit`; ejecución real con `curl` a `/api/health`; implements PD5, PD12.
- [x] **T7 — Con `NODE_ENV=production` Hono sirve los estáticos de `apps/front/dist` desde el mismo origen; implements PD6.**
  Tests contra un directorio de fixture: `/` devuelve `index.html`, un asset existente se sirve, `/api/health` no queda tapado y un intento de path traversal (`/../package.json`, también codificado) no sale del directorio. Fuera de producción no se sirven estáticos.

## Group 3 — Front Vite sin dependencias de cliente _(primer código que se entrega al navegador; Vite y Vitest entran como dependencias de desarrollo)_ [risk: supply-chain]

- [x] T8 — Una función pura interpreta la respuesta de `/api/health` ("operativo" solo con `{ status: "ok" }`; cualquier otra respuesta, cuerpo no JSON o error de red da "no disponible"); tests Vitest con environment `node`; implements PD8, PD11.
- [x] T9 — `apps/front` tiene `index.html`, `styles.css` (CSS puro) y `main.ts`, que llama a `/api/health` y muestra el estado con `textContent`; `package.json` no tiene `dependencies` (solo devDependencies) y no hay estilos ni scripts inline ni recursos de terceros; implements PD11, PD6.
- [x] **T10 — `pnpm dev` levanta front y back juntos y `pnpm build` produce un `dist` que el back sirve; implements PD6, PD12.**
  Vite en 5173 hace proxy de `/api` y `/ws` (`ws: true`) a `127.0.0.1:3000`. Ejecución real: con `pnpm dev`, la página en `localhost:5173` muestra "Servidor operativo". Con `pnpm build` y el back en producción, `localhost:3000` sirve la página con la CSP sin que el navegador registre violaciones.

## Group 4 — Contenedor MongoDB _(credenciales y exposición de red del almacén de datos)_ [risk: secrets]

- [x] **T11 — `docker compose up -d` levanta un MongoDB autenticado, solo en local y que llega a healthy; implements PD4, and respects PD3.**
  `docker-compose.yml` en la raíz con `mongo:8.0.x` fijado por tag y digest sha256, credenciales root desde `.env`, `127.0.0.1:27017:27017`, un volumen con nombre y un healthcheck. Se versiona `.env.example`. No se crean base de datos, colecciones ni índice TTL. Ejecución real: `docker compose ps` muestra `healthy`, la conexión sin credenciales no puede listar bases de datos y el puerto no escucha en `0.0.0.0`.

## Group 5 — CI y cierre _(el workflow ejecuta código de terceros con un token del repositorio; la documentación y los gates se cierran contra los scripts reales)_ [risk: supply-chain]

- [x] **T12 — GitHub Actions en PR y push a `main`; implements PD10, and respects PD2.**
  Pasos: `pnpm install --frozen-lockfile`, `turbo typecheck`, `format:check`, `test`, `build` y `pnpm audit`. Cada action se fija por SHA de commit (con la versión en un comentario) y el workflow lleva `permissions: contents: read`. Comprobación: en un PR el workflow pasa en verde, y con el lockfile desalineado falla.
- [x] T13 — `harness.config.yml` declara `gates` (`typecheck`, `format:check`, `test`, `build`, `audit`) con los nombres exactos de los scripts raíz, y el `README.md` gana la sección "Cómo arrancar" en español; `lemony doctor` deja de avisar de que faltan gates; implements PD12, PD10.
