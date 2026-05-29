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

## Off-Site Google Drive Backups

Preferred production path uses rclone:

```bash
pnpm run backup:rclone
```

Required production environment:

```bash
RCLONE_CONFIG=/root/.config/rclone/rclone.conf
RCLONE_BACKUP_REMOTE=cvsolucion-drive:cvsolucion-backups
RCLONE_BACKUP_RETENTION_DAYS=30
BACKUP_OUTPUT_DIR=/root/backups
```

`RCLONE_BACKUP_REMOTE` must point to an already configured rclone remote and folder path. For a personal Google Drive, configure the remote with OAuth as the Google user who owns the storage. A service account still needs a Workspace Shared Drive or OAuth delegation; rclone does not give service accounts personal Drive quota.

Useful setup checks:

```bash
rclone version
rclone listremotes
rclone lsd cvsolucion-drive:
rclone copy /root/backups/example.tar.gz cvsolucion-drive:cvsolucion-backups --dry-run
```

Legacy direct Google Drive API backup is still available:

Run from the app directory:

```bash
pnpm run backup:drive
```

Direct API environment:

```bash
GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE=/var/www/cvsolucion_shared/secrets/google-drive-service-account.json
GOOGLE_DRIVE_BACKUP_FOLDER_ID=
GOOGLE_DRIVE_BACKUP_FOLDER_NAME=CVsolucion production backups
GOOGLE_DRIVE_BACKUP_RETENTION_DAYS=30
BACKUP_OUTPUT_DIR=/root/backups
```

Prefer `GOOGLE_DRIVE_BACKUP_FOLDER_ID` because folder names are not unique. If using `GOOGLE_DRIVE_BACKUP_FOLDER_NAME`, the folder must already be shared with the service account email from the JSON key.

Google service accounts cannot upload into a normal personal Drive quota. Use a Google Workspace Shared Drive folder, or switch this backup to an OAuth user flow if the target account is a personal Google Drive.

The backup command creates a safe SQLite backup with `better-sqlite3`, includes the production `uploads/` directory when present, stores a local `.tar.gz` copy, uploads it to Drive, and prunes Drive backups older than the configured retention window.

## Scheduled Backup Timer

Recommended systemd unit:

```ini
[Unit]
Description=CVsolucion Google Drive backup

[Service]
Type=oneshot
WorkingDirectory=/var/www/cvsolucion
EnvironmentFile=/var/www/cvsolucion/.env
ExecStart=/bin/bash -lc 'pnpm run backup:rclone'
```

Recommended timer:

```ini
[Unit]
Description=Run CVsolucion Google Drive backup daily

[Timer]
OnCalendar=*-*-* 03:15:00
Persistent=true

[Install]
WantedBy=timers.target
```

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
pnpm run secrets:audit
pnpm test
pnpm run check
pnpm run audit:prod
pnpm run build
pnpm run test:e2e
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

## Security Headers

Express sets the application CSP and core security headers. In production, Nginx should be the only public layer adding static-site security headers; hide duplicate upstream headers for proxied responses to avoid repeated `Content-Security-Policy`, `X-Content-Type-Options`, and related values.

Quick checks:

```bash
curl -I https://cvsolucion.com/
curl -I 'https://cvsolucion.com/assets/index-does-not-exist.js?cache-miss=1'
```

Expected: one public CSP header on HTML responses, one `X-Content-Type-Options` header, and missing assets returning `404`.

## Rollback Notes

If a deployment fails before PM2 restart, the previous PM2 process remains online.

If it fails after PM2 stop, the deploy workflow attempts to restart `cvsolucion` and preserve SQLite mode.

For manual rollback:

```bash
cd /var/www/cvsolucion
pm2 restart cvsolucion --update-env
```

Data backups can be restored from `/root/backups/` if a migration issue is confirmed.
