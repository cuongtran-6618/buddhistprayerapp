# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm start              # Start Expo dev server (press i for iOS, a for Android, w for web)
npm run ios            # Run on iOS simulator (requires native build)
npm run android        # Run on Android emulator (requires native build)
npm run web            # Start web version

# Code quality
npm run lint           # Run ESLint

# EAS Build (requires eas-cli)
eas build --profile development   # Development build with dev client
eas build --profile preview       # Internal distribution build
eas build --profile production    # Production build
```

## Project

Buddhist prayer reminder app — reminds users to chant at scheduled times and displays chant lyrics with a player.

## Tech Stack

- **Expo SDK 54** with React Native 0.81.5 and React 19.1
- **expo-router** for file-based routing (Stack navigator, no tabs yet)
- **React Native New Architecture** + **React Compiler** (experimental) both enabled
- **TypeScript** strict mode; path alias `@/*` → project root
- **Supabase** for auth/backend, **Zustand** for state, **Zod** for validation
- **expo-audio** for audio playback, **expo-notifications** for prayer reminders
- **react-native-purchases** (RevenueCat) for in-app purchases (PRO chants)

## Architecture

### Screen Structure

Screens are split into a route file (`app/`) and a component file (`components/`). Route files handle navigation wiring; component files contain all UI logic.

```
app/_layout.tsx              → Root Stack navigator, loads Be Vietnam Pro fonts
app/(tabs)/index.tsx         → Mounts OnboardingScreen; on finish: router.replace("/home")
app/(tabs)/home.tsx          → Mounts HomeScreen; on chant select: router.push("/chant")
app/(tabs)/chant.tsx         → Mounts ChantListScreen
app/(tabs)/reminders.tsx     → Mounts RemindersScreen
app/(tabs)/create-reminder.tsx → Mounts CreateReminderScreen (hidden tab)
app/player.tsx               → Full-screen player (outside tabs)
```

```
components/onboarding-screen.tsx      → 3-slide carousel with animated rings + slide transitions
components/home-screen.tsx            → Dashboard: time-based greeting, streak card, schedule
components/player-screen.tsx          → Audio player with rotating mandala, scrolling lyrics, progress bar
components/chant-list-screen.tsx      → Chant library list
components/reminders-screen.tsx       → Reminder management
components/create-reminder-screen.tsx → Reminder form (title, time, track, snooze)
components/phone-frame.tsx            → Web-only iPhone frame wrapper (transparent on native)
components/icons/bell-icon.tsx        → SVG bell icon
components/icons/lotus-icon.tsx       → SVG lotus icon
```

### State Management

Four Zustand stores, all persisted to AsyncStorage unless noted:

```
store/app-store.ts             → hasSeenOnboarding, _hydrated (hydration gate)
store/player-store.ts          → currentTrack (non-persistent, in-memory only)
store/reminders-store.ts       → reminders[] with addReminder/updateReminder/removeReminder
store/chanting-history-store.ts → daily completion records; pure helpers for streak/progress
```

**Pattern**: Computed values (streak, schedule status, month progress) are pure helper functions in the store file — not stored as state. Derive, don't store.

### Hooks

```
hooks/use-audio-player.ts      → Wraps expo-audio; syncs lyrics to playback position
hooks/use-notifications.ts     → Schedules/cancels/snoozes daily reminder notifications
hooks/use-tracks.ts            → Returns TRACKS array (future: swaps to Supabase query)
hooks/use-seek-gesture.ts      → PanResponder drag-to-seek for progress bar
```

Each hook wraps a single concern. Never mix audio, notification, and gesture logic in one hook.

### Theming

No dynamic light/dark switching — the app uses a **single dark Buddhist theme** defined in:
- `constants/colors.ts` — exports `Colors` object (bg, surface, card, gold, red, cream, muted, etc.)
- `constants/fonts.ts` — exports `Fonts` object mapping semantic names to Be Vietnam Pro variants

All components import `Colors` and `Fonts` directly; there is no theme context or hook.

### Internationalization

`app/lib/i18n.ts` sets up `i18n-js` with English and Vietnamese locales. Device language is auto-detected via `expo-localization`. Import `i18n` and call `i18n.t("key.path")`. Translation files are in `app/locales/en.json` and `app/locales/vi.json`.

### Animation Pattern

All animations use React Native's built-in `Animated` API with `useNativeDriver: true`. All `Animated.Value` instances live in `useRef` — never `useState`. The common slide-transition pattern (fade + scale out → update state → fade + scale in) is centralized in `transitionToStep()` in the onboarding screen. Player animations (mandala rotation, breathing lotus, glow pulses) pause when audio is not playing.

---

## Scaling

### User Growth

- **Anonymous Supabase sessions** on first launch — no sign-up required. Users get a session automatically; their data is scoped to that session via RLS.
- **RLS on every table** — no Supabase table should be accessible without a Row Level Security policy. Default deny. Test policies before shipping.
- **Connection pooling** — the Supabase client handles pooling via the PostgREST API. Never open raw Postgres connections from the app.
- **Paginate list queries** — always use `limit`/`offset` or cursor-based pagination. Never fetch unbounded rows.

### Content Growth

- **Track metadata** will live in a Supabase `tracks` table. `constants/tracks.ts` is the fallback/seed for offline and initial load.
- **Free tracks**: audio bundled in `assets/audio/` (local, always available offline).
- **Premium tracks**: audio URI stored in DB, file hosted on CDN (Supabase Storage or external). Never bundle premium audio in the app binary.
- **Script lines** (lyrics + millisecond timings): stored as JSONB in the `tracks` table when migrated, not hardcoded.
- **`useTracks()` is the single interface** for consuming track data. When migrating to Supabase, only this hook changes — no component updates needed.

### Team / Code Conventions

- **Screen pattern**: route file in `app/` (navigation wiring only) + component file in `components/` (all UI and business logic). Never put business logic in route files.
- **Store pattern**: Zustand + `persist` with AsyncStorage. Computed values as pure helper functions, not store state. See `chanting-history-store.ts` as the reference.
- **Hook pattern**: one concern per hook. Never merge audio + notification + gesture logic.
- **Type pattern**: use discriminated unions for variant data. See `AudioSource` in `constants/tracks.ts` (`{ type: 'local', asset } | { type: 'remote', uri }`).
- **Animation pattern**: `useNativeDriver: true` everywhere. Animation values in `useRef`, never `useState`.

---

## Security

- **Supabase public keys**: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are intentionally public (publishable keys safe for mobile clients). Never commit the `service_role` key to the repository or expose it in client code.
- **RLS testing**: before shipping any Supabase table, verify policies reject requests from other users' sessions. Test both authenticated and unauthenticated access paths.
- **IAP validation — never trust the client**: `isPremium` from RevenueCat SDK must not gate access by itself. RevenueCat webhooks post `PURCHASE`/`RENEWAL`/`CANCELLATION` events to a Supabase Edge Function, which writes to a `user_entitlements` table. The app reads entitlements from Supabase — the server is the source of truth.
- **Notification payloads**: embed only non-sensitive identifiers (`trackId`, `reminderId`, `snoozeMinutes`). No auth tokens, session data, or user PII in notification payloads.
- **AsyncStorage**: stores only non-sensitive data (reminders, onboarding flag, chanting history). Never store auth tokens, session secrets, or payment data in AsyncStorage.
- **Deep link / notification parameter validation**: always confirm that `trackId` from a notification payload exists in the track list before navigating. Never pass raw payload values to navigation without validation.

---

## Performance

- **JS thread protection**: all animation loops must use `useNativeDriver: true`. Never trigger re-renders to drive animations — use `Animated.Value` and `Animated.event` directly.
- **Lyrics list threshold**: `ScrollView` is acceptable up to ~200 script lines. Beyond that, switch to `FlatList` with `getItemLayout` for O(1) `scrollToIndex`.
- **Re-render guards**:
  - Callbacks passed as props must use `useCallback`.
  - List item components that render from the TRACKS array should use `React.memo`.
- **Audio cleanup**: `use-audio-player.ts` must release the audio player instance in its cleanup effect (`player.remove()`). Verify no instance leaks when navigating away from the player screen.
- **No derived state in stores**: streak, schedule status, and month progress are computed on demand via pure functions — never stored as Zustand state that must be kept in sync.

---

## Testing

Test coverage targets critical paths only. Use **Jest** + **`@testing-library/react-native`**.

**What to test**:
- All pure helper functions in `store/chanting-history-store.ts`: `computeStreak`, `computeScheduleStatus`, `computeTodayProgress`, `computeMonthProgress`
- All Zod validation schemas (current and future)
- CRUD operations in `store/reminders-store.ts`

**Rules**:
- Do not mock AsyncStorage in store tests — use `jest-async-storage-mock` for a realistic in-memory implementation.
- Do not add tests for UI components unless a pure logic function inside them is untested.

---

## Internationalization

**Rule**: every user-facing string must go through `i18n.t("key.path")`. No hardcoded strings in JSX.

**Adding a new translation key**:
1. Add the key to `app/locales/en.json` (English is authoritative)
2. Add the same key to `app/locales/vi.json` with the Vietnamese translation
3. Both files must be updated in the same commit — never ship with a key missing in any locale

**Adding a new language**:
1. Create `app/locales/<code>.json` with all keys from `en.json`
2. Register the locale in `app/lib/i18n.ts`
3. Test auto-detection by setting the device language via simulator settings

---

## Cloud Sync (Opt-in)

Chanting history and reminders sync to Supabase only when the user explicitly enables cloud backup.

- Sync preference is stored in `app-store.ts` as `cloudSyncEnabled: boolean`
- When **disabled**: AsyncStorage is the sole source of truth. App is fully functional offline.
- When **enabled**: Supabase is the source of truth. AsyncStorage acts as a write-through cache for offline reads.
- Never initiate a sync write without checking `cloudSyncEnabled` first.

---

<do_not_act_before_instructions>
Do not jump to implementing features or fixes that are not explicitly mentioned in the current codebase. Focus on understanding and working with the existing code as it is. Do not jump to implementing features or changes files unless clearly instructed to do so based on the current codebase. Always refer back to the existing code and instructions before making any suggestions or changes.
Do not suggest code that has been deleted. Only suggest code that is currently present in the repository. If a file has been recently edited, do not suggest code from before the edit if it has been removed.
Do not jump to conclusions about what code should be added or removed. Only work with the code that is currently in the repository and has not been deleted.
</do_not_act_before_instructions>
