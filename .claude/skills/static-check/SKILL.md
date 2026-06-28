---
name: static-check
description: Run the static verification gate for the Friends Expo app — TypeScript typecheck (tsc --noEmit, strict) plus expo lint — and interpret the results against the project's known error baseline. Use this whenever you've edited any .ts/.tsx in this repo and want to confirm it still compiles, when the user asks to typecheck / lint / "check it builds" / "make sure nothing broke" before testing on a device or committing, or after a multi-file refactor. Prefer this over hand-rolling a one-off `tsc` invocation.
---

# Static Check (Friends app)

A fast, no-simulator gate for confirming a change still compiles and lints cleanly. Run this before device-testing or committing — it catches type and lint breakage in seconds. It does **not** replace running the app: behavior, layout, and navigation still need Expo Go on a device (use the global `run` / `verify` skills for that).

## Run both checks

From the project root (`friends/`):

```bash
npm run typecheck   # tsc --noEmit, strict
npm run lint        # expo lint
```

Run them together and report both. `typecheck` is the one that catches most regressions (strict mode, `@/*` path alias resolution, prop-type mismatches).

## The typecheck baseline

`tsc --noEmit` is **clean (0 errors)** as of the 2026-06-27 audit. Any error output is a genuine regression to fix.

The goal is to stay at 0. Report results:
1. 0 errors → **pass**.
2. Any `error TS` line → **fail**: show it and fix it.

## If you touched icon code

`tierIconName` / `nudgeIconName` return `string`, while `<IconSymbol name=... />` expects `SFSymbols7_0`. All existing call sites already cast `as any`. If you add a new `IconSymbol` fed by one of these helpers, add `as any` at the call site. New icon names also need an entry in `components/ui/icon-symbol.tsx > MAPPING` to render on Android (see CLAUDE.md → Conventions → Icons).

## Report format

State, plainly: typecheck result (baseline-only vs. new errors, with the new ones quoted), lint result, and whether the change is clear to test on device. If something failed, fix it and re-run rather than handing back a red gate.
