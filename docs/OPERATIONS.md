# CVsolucion Operations

## Production Runtime

- App directory: `/var/www/cvsolucion`
- Shared data directory: `/var/www/cvsolucion_shared/data`
- PM2 app name: `cvsolucion`
- Default app port: `3000`
- Storage driver: `APP_STORAGE_DRIVER=sqlite`
- SQLite database: `/var/www/cvsolucion_shared/data/cvsolucion.sqlite`
- JSON mirror: optional. Keep `APP_SQLITE_JSON_MIRROR=false` after SQLite is verified to avoid stale JSON files becoming a deploy source.

## Storage Commands

Run from the app directory:

```bash
pnpm run storage:migrate
pnpm run storage:rebuild
pnpm run storage:health
```

`storage:migrate` imports root JSON data files into SQLite documents and rebuilds structured tables. Use it for first-time import or a deliberate restore from JSON files.

`storage:rebuild` rebuilds structured tables from the current SQLite `documents` table. Use it during normal deploys because SQLite is the production source of truth.

`storage:health` validates stored JSON documents and prints structured table row counts.

## Required GitHub Secrets For Manual Deploy

The `Deploy Production` workflow is manual and requires these repository or environment secrets:

- `PRODUCTION_SSH_HOST`
- `PRODUCTION_SSH_PORT` optional, defaults to `22`
- `PRODUCTION_SSH_USER`
- `PRODUCTION_SSH_PRIVATE_KEY`
- `PRODUCTION_APP_DIR`
- `PRODUCTION_PM2_APP`

## Deploy Safety

The deploy workflow runs:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm run check
pnpm run audit:prod
pnpm run build
pnpm run storage:rebuild
pnpm run storage:health
pm2 restart cvsolucion --update-env
```

Before changing production data, it creates a tar backup under:

```bash
/root/backups/
```

## Manual Health Check

```bash
curl -fsS http://127.0.0.1:3000/api/auth/me
curl -I https://cvsolucion.com/
curl -I https://cvsolucion.com/nonexistent-test-asset-xyz.png
pm2 describe cvsolucion
pnpm run storage:health
```

Expected:

- `/api/auth/me` returns `{"user":null}` for anonymous requests.
- Missing static assets return HTTP `404`.
- PM2 status is `online`.
- `storage:health` prints the expected documents and structured table counts.

## Rollback Notes

If a deployment fails before PM2 restart, the previous PM2 process remains online.

If it fails after PM2 stop, the deploy workflow attempts to restart `cvsolucion` and preserve SQLite mode.

For manual rollback:

```bash
cd /var/www/cvsolucion
pm2 restart cvsolucion --update-env
```

Data backups can be restored from `/root/backups/` if a migration issue is confirmed.
