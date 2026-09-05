# CVsolucion Operations

## Production Runtime

- App directory: `/var/www/cvsolucion`
- Active release link: `/var/www/cvsolucion/current`
- Release directory: `/var/www/cvsolucion/releases/<git-sha>`
- Shared data directory: `/var/www/cvsolucion_shared/data`
- PM2 app name: `cvsolucion`
- Default app port: `3000`
- Node runtime: Node 24 LTS (the deploy refuses a different major version)
- Storage driver: `APP_STORAGE_DRIVER=sqlite`
- SQLite database: `/var/www/cvsolucion_shared/data/cvsolucion.sqlite`
- JSON mirror: optional. Keep `APP_SQLITE_JSON_MIRROR=false` after SQLite is verified to avoid stale JSON files becoming a deploy source.

Recommended security environment:

```bash
APP_BIND_HOST=127.0.0.1
ADMIN_SESSION_MAX_AGE_MS=43200000
ADMIN_EMAIL_OTP_ENABLED=false
VISITOR_RETENTION_DAYS=180
OPENAI_STORE_RESPONSES=false
```

`ADMIN_SESSION_MAX_AGE_MS` defaults to 12 hours. Customer sessions still use `AUTH_SESSION_MAX_AGE_MS` or the one-year default.
Set `ADMIN_EMAIL_OTP_ENABLED=true` only after SMTP delivery is verified, because admin sign-in will require a 6-digit email code after the password step.

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
RCLONE_CONFIG=/home/cvsolucion/.config/rclone/rclone.conf
RCLONE_BACKUP_REMOTE=cvsolucion-drive:cvsolucion-backups
RCLONE_BACKUP_RETENTION_DAYS=30
BACKUP_OUTPUT_DIR=/var/backups/cvsolucion
BACKUP_ENCRYPTION_PASSPHRASE=
REQUIRE_ENCRYPTED_BACKUPS=true
```

`RCLONE_BACKUP_REMOTE` must point to an already configured rclone remote and folder path. For a personal Google Drive, configure the remote with OAuth as the Google user who owns the storage. A service account still needs a Workspace Shared Drive or OAuth delegation; rclone does not give service accounts personal Drive quota.

Useful setup checks:

```bash
rclone version
rclone listremotes
rclone lsd cvsolucion-drive:
rclone copy /var/backups/cvsolucion/example.tar.gz cvsolucion-drive:cvsolucion-backups --dry-run
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
BACKUP_OUTPUT_DIR=/var/backups/cvsolucion
BACKUP_ENCRYPTION_PASSPHRASE=
REQUIRE_ENCRYPTED_BACKUPS=true
```

Prefer `GOOGLE_DRIVE_BACKUP_FOLDER_ID` because folder names are not unique. If using `GOOGLE_DRIVE_BACKUP_FOLDER_NAME`, the folder must already be shared with the service account email from the JSON key.

Google service accounts cannot upload into a normal personal Drive quota. Use a Google Workspace Shared Drive folder, or switch this backup to an OAuth user flow if the target account is a personal Google Drive.

The backup command creates a safe SQLite backup with `better-sqlite3`, includes the production `uploads/` directory when present, stores a local `.tar.gz` copy, uploads it to Drive, and prunes Drive backups older than the configured retention window. Set `BACKUP_ENCRYPTION_PASSPHRASE` to upload `.tar.gz.enc` encrypted archives. Set `REQUIRE_ENCRYPTED_BACKUPS=true` in production so a missing passphrase fails the backup instead of uploading plain data.

Create a consistent local backup and verify an isolated restore with:

```bash
pnpm run backup:local
pnpm run backup:verify -- /path/to/cvsolucion-backup-....tar.gz.enc
```

`backup:verify` decrypts and extracts into a temporary directory, parses the manifest, runs SQLite `quick_check`, reports the document count, and removes the temporary restore. Schedule this check periodically and alert on failure. Keep the decryption passphrase outside the application host as well as in the protected runtime secret store.

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

Use a dedicated, non-root deployment/service account. Grant it write access only to the application, release, shared-data, and backup directories plus the narrowly required PM2 commands. Verify key-based login and recovery access before setting `PermitRootLogin no` and `PasswordAuthentication no` in SSH, then reload SSH and test a second session before closing the first.

## Deploy Safety

The deploy workflow builds and checks a new immutable release before changing the `current` symlink. It runs:

```bash
pnpm install --frozen-lockfile
pnpm run secrets:audit
pnpm test
pnpm run check
pnpm run audit:prod
pnpm run build
pnpm run test:e2e
pnpm run backup:local
pnpm run storage:rebuild
pnpm run storage:health
pm2 startOrReload current/ecosystem.config.cjs --only cvsolucion --update-env
```

Before changing production data, it creates a consistent SQLite backup under `BACKUP_OUTPUT_DIR`. The deployment then atomically switches `current`, checks the local health endpoint, and restores the prior symlink automatically if health fails. It keeps five release directories as rollback candidates.

```bash
/var/backups/cvsolucion/
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

Express is the single owner of CSP for proxied responses and sets the other core security headers. Nginx must pass that CSP through without adding a second policy. This lets Express remove analytics origins for requests carrying `DNT: 1`. Use [`deploy/nginx/cvsolucion-proxy.conf`](../deploy/nginx/cvsolucion-proxy.conf) inside the HTTPS proxy location; it also replaces client-supplied forwarding headers instead of appending them.

Quick checks:

```bash
curl -I https://cvsolucion.com/
curl -I 'https://cvsolucion.com/assets/index-does-not-exist.js?cache-miss=1'
```

Expected: one public CSP header on HTML responses, one `X-Content-Type-Options` header, and missing assets returning `404`. Also verify `curl -I -H 'DNT: 1'` returns a CSP without Google, Meta, Ahrefs, or Clarity origins.

## Rollback Notes

If a deployment fails before the atomic switch, the previous PM2 process remains online. If the new release fails its health check, the workflow restores the previous `current` target and reloads it.

For manual rollback:

```bash
cd /var/www/cvsolucion
ln -s /var/www/cvsolucion/releases/<known-good-sha> .current-manual
mv -Tf .current-manual current
PM2_APP_NAME=cvsolucion pm2 startOrReload current/ecosystem.config.cjs --only cvsolucion --update-env
```

Data backups can be restored from `/var/backups/cvsolucion/` if a migration issue is confirmed.
