---
name: add-screen
description: Scaffold a new screen or route in the Friends Expo app so it matches the four existing tab screens and the project's conventions. Use whenever adding a new screen, tab, route, onboarding step, settings sub-page, or modal to this app — for example building the onboarding flow (welcome / contacts checklist / friend-and-network swipe / summary), a reminders or notifications screen, or any new file under `app/` — even if the user just says "add a page" or "make a new screen." Covers where the file goes, the import/layout skeleton, theming, data access, and the gotchas (SafeAreaView edges, the Android icon MAPPING, provider scope).
---

# Add a Screen (Friends app)

Build new screens so they're indistinguishable from the existing four (`app/(tabs)/index.tsx`, `people.tsx`, `log.tsx`, `stats.tsx`). The point is consistency: same theming, same data flow, same structural idioms. Read CLAUDE.md (`Conventions`, `Screen Flow`) for the full picture — this skill is the assembly checklist.

When done, run the `static-check` skill, then verify on a device.

## 1. Decide where the file lives, and register it

expo-router is file-based — the file's path *is* the route.

- **New bottom tab** → `app/(tabs)/<name>.tsx`, and add a `<Tabs.Screen name="<name>" .../>` in `app/(tabs)/_layout.tsx`. (Inside `(tabs)` you get `usePeopleContext()` for free — the `PeopleProvider` is mounted there.)
- **Full-screen route outside the tabs** (settings sub-page, onboarding step) → `app/<name>.tsx` or a group like `app/(onboarding)/<step>.tsx`, and add a matching `<Stack.Screen>` in `app/_layout.tsx`. **These screens are outside `(tabs)`, so `usePeopleContext()` is unavailable** — pass data as props or read Supabase directly (see `app/settings.tsx`, which uses `useAuth()` only).
- **Modal** → reuse the custom bottom-sheet pattern, not a route (see step 5).

`useAuth()` works everywhere (its provider is at the root). `usePeopleContext()` works only inside `(tabs)`.

## 2. Start from the standard skeleton

Match the imports, the `// ─── Section ───` comment dividers, and the bottom `StyleSheet.create`. A tab-style screen looks like:

```tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/theme';
import { ContactCard } from '@/components/ContactCard';
import { usePeopleContext } from '@/contexts/people-context';
import type { Person } from '@/types';
import { tierColor, tierLabel, tierIconName, relativeTime } from '@/utils/people';

// ─── Sub-components ──────────────────────────────────────────────────────────

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MyScreen() {
  const { people, loading, updatePerson } = usePeopleContext();
  const [selected, setSelected] = useState<Person | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* content */}
      <ContactCard
        person={selected}            // ContactCard accepts Person | null — no guard needed
        visible={selected !== null}
        onClose={() => setSelected(null)}
        onPersonChanged={(id, changes) => {
          updatePerson(id, changes); // propagate inline edits back to the shared roster
          setSelected((prev) => (prev?.id === id ? { ...prev, ...changes } : prev));
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
});
```

Pick `SafeAreaView` `edges` to match the screen's chrome — tab screens typically need `['top']`; a stack screen with a header often needs `['bottom']` (see `settings.tsx`); a full-bleed screen uses `['top','bottom']` (see `(auth)/sign-in.tsx`). When unsure, copy the nearest existing screen.

## 3. Theme from `Palette` only

Never hardcode hex. Pull every color from `Palette` (`@/constants/theme`): `background`, `text`, `cardSurface`, `tabBarBorder`, `iconInactive`, `accent`, `midTier`, `lightTier`. For tier-derived colors use `tierColor(tier)` and tint with the hex-alpha suffix the surrounding screens use — `+ '30'` for tier bubbles and icon circles, `+ '28'` for the name bubble inside cards. Match the neighbor; don't invent a third value.

## 4. Reuse the tier/avatar idioms — don't extract them

`TierBubble` and `InitialAvatar` are **intentionally re-implemented per screen** (≤10 lines each, per-screen size/alpha tuning). Copy the small local version from `people.tsx` / `index.tsx` into your screen rather than building a shared component. Use `tierLabel`, `tierIconName`, `nudgeIconName`, `relativeTime` from `utils/people.ts` for all labels and dates so language stays consistent.

## 5. Wire the shared interactions

- **Open a person** → render `<ContactCard person={selected|null} visible onClose onPersonChanged />` driven by local state (see any tab screen). Always pass `onPersonChanged` and call `updatePerson` in it, or inline edits made in the card won't propagate back to the roster.
- **Add a person** → `<AddPersonModal visible defaultType onClose onSave />`; call `addPerson(person)` in `onSave` (the People screen's FAB flow).
- **Log an interaction** → don't build your own; the `LogModal` is hosted in `app/(tabs)/_layout.tsx`. Trigger it the way Up Next's "Mark Complete" does.
- **Selectors** → `showActionSheet` (`utils/action-sheet.ts`). **Short text input** → `Alert.prompt` (iOS-only).
- **New custom sheet** → copy the `Modal` + `PanResponder` + inner `ScrollView bounces={false}` pattern from `ContactCard` / `AddPersonModal` (CLAUDE.md → Conventions → Bottom sheets). Don't reach for `@gorhom/bottom-sheet`; it isn't installed.

## 6. Icons

Use `<IconSymbol name="sf.symbol.name" .../>`. Two gotchas:
- If you feed it a helper that returns `string` (`tierIconName` / `nudgeIconName`), you hit the `SFSymbols7_0` type error — cast `as any` to match the screens that do, or fix the cluster (see the `static-check` skill).
- Any **new** icon name needs an entry in `components/ui/icon-symbol.tsx > MAPPING` or it renders nothing on Android.

## 7. Copy / tone

No "overdue" or guilt-inducing language anywhere user-facing — surface gentle opportunities, never obligations. This is the product's central rule.

## 8. Finish

Run the `static-check` skill (typecheck + lint, against the known baseline), then test the screen on a device in Expo Go. Build one screen at a time and verify before starting the next.
