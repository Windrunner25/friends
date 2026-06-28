# Friends — Working Notes

Privacy-first relationship manager (iOS-first, Expo/RN + Supabase). Solo build, commercialization in mind.

**Core product rule:** create opportunities to connect, never obligations. **No "overdue" or guilt-inducing copy anywhere user-facing** — this overrides aesthetic/convenience tradeoffs because it's the product's entire reason to exist over a calendar reminder.

---

## Quick Reference

- **Working dir & git root:** `friends/` — the parent folder is *not* a repo; run git from here.
- **Run:** `npm start`, then `i` for iOS or scan the QR in Expo Go.
- **Check before device:** `npm run typecheck` (clean — 0 errors) and `npm run lint` (0 errors, 2 pre-existing exhaustive-deps warnings). Any new `error TS` line is a regression to fix.
- **Required config:** `lib/supabase.js` reads `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` from a **gitignored `.env`**. A fresh clone won't connect until that file exists.
- **Theme:** import `Palette` from `@/constants/theme`; never hardcode hex so a palette change stays one-line.
- **Path alias:** `@/*` → project root.

---

## Dev Mode — auth is bypassed (important)

The app intentionally runs unauthenticated for solo dev. Non-obvious because the code "works" while being pre-launch:

- Every query filters by a hardcoded `DEV_USER_ID` (`lib/supabase.js`) instead of `auth.uid()`.
- Sign-in (`app/(auth)/sign-in.tsx`) is email/password placeholder; **`app/_layout.tsx` does NOT gate `(tabs)` on a session** — the "routes to (tabs)" comment in sign-in is stale.
- `AuthProvider` inserts a `users` row on first `SIGNED_IN` — relevant when wiring real auth.

**Before launch:** (1) wire Apple/Google via the installed `expo-auth-session`; (2) gate `(tabs)` on a session in `app/_layout.tsx`; (3) replace `DEV_USER_ID` with the live user id; (4) **confirm Supabase RLS is enabled** — client-side `user_id` filtering is not a security boundary.

---

## Architecture & data flow

- **Provider scope is the main gotcha:** `AuthProvider` is at the root (`useAuth()` everywhere); `PeopleProvider` is mounted only at `app/(tabs)/_layout.tsx`. Screens outside `(tabs)` — `settings`, `(auth)`, `modal` — **cannot** call `usePeopleContext()`.
- New screens that need the roster consume `usePeopleContext()`, not `usePeople()` directly, so the whole tree shares one fetch.
- Domain fetches live in `hooks/`; `lib/supabase.js` is the only client.
- **Mutations are optimistic:** local context update (`updatePerson`/`addPerson`) + Supabase write, no full refetch. Capture the returned `{ error }` on every write and roll back local state on failure — several inline-edit writes in `ContactCard.tsx` historically skipped this.
- Gate debug logging behind `if (__DEV__)` so production stays quiet.

---

## Design system

Colors and fonts: `constants/theme.ts` (`Palette`, `Fonts`). Tier color/icon/label/nudge helpers: `utils/people.ts`. The non-obvious parts:

- Tier tint uses a hex-alpha suffix — `'30'` for tier bubbles/icon circles, `'28'` for name bubbles inside cards. Match the neighboring screen; don't introduce a third value.
- Tier icon + color language must stay consistent everywhere a tier appears (cards, Up Next, leaderboard) — it's the app's primary visual vocabulary.
- iOS-first, **light mode only** (`Colors.dark === Colors.light`); Plus Jakarta Sans designed-for but not loaded.

---

## Data model

Types: `types/index.ts`. Facts not inferrable from the TS:

- `days_overdue` and `last_interaction_note` are **derived client-side** in `usePeople`, not columns.
- **No `Stats` table** — streak/totals/leaderboard computed live in `stats.tsx`. **No `Reminder` table** (notifications unbuilt). A `users` table exists but isn't typed.
- **`supabase/migrations/` has the RLS schema** — check there before altering tables. Schema was previously hosted-only; RLS policies and the migration were added in the 2026-06-27 audit.
- **Cadence** (`utils/people.ts > CADENCE_DAYS`): drives `days_overdue` and Up Next order. Never-contacted people are treated as overdue by one full cadence period — deliberate so new contacts surface.
- `defaultNudgeForTier` (`AddPersonModal.tsx`) takes only `tier`, not `type`, so Friend/Network share a default per tier. Change the signature if a Network-specific override is needed.

---

## Conventions & gotchas

- **Icons:** new SF Symbol names need an entry in `components/ui/icon-symbol.tsx > MAPPING` or they silently render nothing on Android. `tierIconName`/`nudgeIconName` return `string` but `IconSymbol` expects `SFSymbols7_0` — all existing call sites cast `as any`; do the same for any new ones.
- **Bottom sheets:** ContactCard/AddPersonModal use a custom `Modal` + `PanResponder` + inner `ScrollView bounces={false}` pattern — reuse it; `@gorhom/bottom-sheet` is not installed.
- **Selectors:** `showActionSheet` (`utils/action-sheet.ts`); short text input via `Alert.prompt` (iOS-only).
- **Paged tabs:** Friends/Network use `ScrollView pagingEnabled` (not pager-view); see `index.tsx`/`people.tsx`.
- **`// Bug N` comments** mark non-obvious fixes (DST math, recompute-on-merge, stable refs). Keep them; there's no external bug list.
- **Intentional duplication:** `TierBubble`/`InitialAvatar` are re-implemented per screen on purpose (per-screen sizing) — don't DRY until a 5th+ variant appears.
- `data/mock.ts` is mostly dead but `MOCK_MOMENTS` is still used by `index.tsx` — don't delete the file.

---

## Roadmap

**Built:** Home, People, Stats, Contact card, LogModal, AddPersonModal, email/password sign-in, settings (email + sign-out).

**Not started:** onboarding (9-step flow), reminders/notifications, OAuth, contacts import (`expo-contacts` not installed; FAB shows "Coming soon"), Claude-generated conversation starters, Up Next weekly-cohort rotation (today: top-4 by `days_overdue`), font loading, notification/digest settings.

---

## Build approach & commercialization

- One screen/feature at a time; run the static gate, then verify on a real device before moving on.
- Multi-user from day one (`user_id` on `people`/`interactions`); everything per-user configurable.
- **Claude API key must live server-side (Supabase edge function), never bundled.**
- Cloud sync from launch; privacy is a brand value (no ads, no data selling).
