# Security Policy

## Reporting

If you find a vulnerability, please open a private report or contact the
maintainer before publishing details. Include reproduction steps, affected
platforms, and any relevant logs with secrets removed.

## Secret Handling

- Do not commit `.env`, `.env.*`, API tokens, Sentry auth tokens, signing keys,
  or local user data.
- `.env.example` is the only environment file intended to be tracked.
- `SENTRY_AUTH_TOKEN` must be stored only in local environment variables or CI
  secrets.
- Source map upload requires `SENTRY_UPLOAD_SOURCEMAPS=true`; credentials alone
  should not make a normal local build upload artifacts.
- Public DSN examples in docs and tests are placeholders and are not secrets.

## Runtime Data

TinyPals stores local settings in Electron `userData`. For isolated manual
testing, set `TINYPALS_USER_DATA_DIR` to a temporary directory.

## Dependency Checks

Before public releases, run:

```bash
npm audit --omit=dev
npm audit
npm run test
npm run typecheck
npm run build
```
