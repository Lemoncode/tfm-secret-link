# tfm-secret-link

Aplicación de transferencia segura de secretos. Monorepo TypeScript con Turborepo:

- `apps/front`: front web servido por Vite, sin dependencias de ejecución en el cliente y con CSS puro.
- `apps/back`: back en Hono sobre Node 24 (type-stripping nativo, sin paso de compilación).
- `docker-compose.yml`: MongoDB local autenticado, publicado solo en `127.0.0.1`.

## Cómo arrancar

### Requisitos

- Node 24 (ver `.nvmrc`; con nvm: `nvm use`)
- pnpm 10.19.0 (ver `packageManager` en `package.json`; con Corepack: `corepack enable`)
- Docker

### Pasos

```sh
cp .env.example .env      # y cambia el usuario y la contraseña de MongoDB
docker compose up -d      # levanta MongoDB (aparte: `pnpm dev` no lo arranca)
pnpm install
pnpm dev                  # front en http://localhost:5173 y back en http://127.0.0.1:3000
```

En desarrollo, Vite hace de proxy de `/api` y `/ws` hacia el back, así que todo se sirve desde el mismo origen.

Para probar el modo producción (el back sirve `apps/front/dist`):

```sh
pnpm build
NODE_ENV=production pnpm --filter back start   # http://localhost:3000
```

### Scripts

| Script               | Qué hace                                                       |
| -------------------- | -------------------------------------------------------------- |
| `pnpm dev`           | Arranca front y back en modo desarrollo                        |
| `pnpm build`         | Genera el `dist` del front                                     |
| `pnpm typecheck`     | Comprueba los tipos (`tsc --noEmit`) en cada app               |
| `pnpm format:check`  | Comprueba el formato con Prettier (`pnpm format` lo corrige)   |
| `pnpm test`          | Ejecuta los tests (Vitest)                                     |
| `pnpm test:coverage` | Ejecuta los tests con informe de cobertura                     |
| `pnpm audit`         | Busca vulnerabilidades conocidas en las dependencias           |

### Política de dependencias

`pnpm-workspace.yaml` fija versiones exactas, rechaza versiones publicadas hace menos de 7 días
(`minimumReleaseAge`) y no deja que ninguna dependencia ejecute scripts de instalación
(`onlyBuiltDependencies` vacía).
