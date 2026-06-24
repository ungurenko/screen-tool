# Local Fork Notes

This checkout is prepared as a local working copy for Alexander.

## Current State

- The original Git remote has been removed.
- The `main` branch is local-only.
- Package metadata no longer points at the upstream GitHub repository.
- Electron Builder GitHub publishing is disabled.
- Auto-updates are disabled by default.

## Do Not Reconnect To Upstream By Default

Do not add `https://github.com/webadderallorg/Recordly.git` back as a remote unless Alexander explicitly asks for it.

## If We Later Create Our Own Repository

Add Alexander's own repository as the new `origin`, then push the local branch there:

```bash
git remote add origin <our-repository-url>
git push -u origin main
```

Before enabling releases or auto-updates, configure a new release workflow and a new update feed. For packaged auto-updates, set:

```bash
RECORDLY_UPDATE_FEED_URL=<our-update-feed-url> RECORDLY_ENABLE_AUTO_UPDATES=1
```

## Useful Local Checks

```bash
npm run lint
npm test
npm run i18n:check
```

## Baseline Check Notes

Checked on 2026-06-24:

- `npm install` completed and rebuilt the native macOS helpers.
- `npx biome check package.json electron-builder.json5 electron/updater.ts AGENTS.md docs/LOCAL_FORK.md` passed for the local fork setup files.
- `npm run lint` currently fails on existing repo-wide formatting/import issues outside this setup change.
- `npm run i18n:check` currently fails on existing locale key drift in `settings.json` translations.
- `npm test` ran 794 tests: 793 passed, 1 failed in `electron/ipc/paths/binaries.test.ts`. The failure is a cross-platform path mismatch: the test stages a Windows helper while the code resolves the current macOS native helper tag.
- `npm install` reported dependency audit issues. Review them separately before any public release.
