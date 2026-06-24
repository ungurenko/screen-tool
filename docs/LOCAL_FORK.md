# ScreenTool Local Notes

This checkout is Alexander's ScreenTool workspace.

## Current State

- The original upstream repository is not connected.
- The `main` branch uses Alexander's `origin` repository.
- Package metadata uses the ScreenTool identity.
- GitHub Releases are the public download channel.
- Packaged releases use Alexander's GitHub Releases feed for updates by default.

## Do Not Reconnect To Upstream By Default

Do not add the original upstream author repository back as a remote unless Alexander explicitly asks for it.

## Current Repository

`origin` should point to `https://github.com/ungurenko/screen-tool.git`.

Packaged auto-updates use:

```bash
https://github.com/ungurenko/screen-tool/releases/latest/download
```

For private staging, override it with `SCREENTOOL_UPDATE_FEED_URL`. For emergency shutdown, launch with `SCREENTOOL_DISABLE_AUTO_UPDATES=1`.

## Useful Local Checks

```bash
npm run lint
npm test
npm run i18n:check
```

## Baseline Check Notes

Checked on 2026-06-24:

- `npm run i18n:check` passed.
- `npm test` passed: 93 files, 800 tests.
- `npx tsc --noEmit` passed.
- Targeted project and recording tests passed: project manager, project persistence, recording prune, binary paths, smoke export config.
- `node scripts/smoke-packaged-binaries.mjs` requires a packaged app under `release/`; it fails in a source-only checkout when `release/**/app.asar.unpacked` does not exist.
- `npm run lint` still fails on existing repo-wide rules outside the ScreenTool rename: React hook dependency diagnostics, CSS-module `:global(...)` parsing in `ItemGlass.module.css`, and several older `any`/empty-block diagnostics.
- `npm install` reported dependency audit issues. Review them separately before any public release.
