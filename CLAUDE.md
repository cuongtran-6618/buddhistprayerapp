# CLAUDE.md

Buddhist prayer reminder app — reminds users to chant at scheduled times and displays chant lyrics with a player.

**Verification order after any change: lint → tsc → test (all must pass)**

```bash
npm run lint
npx tsc --noEmit
npm test
```

---

## Code Conventions

- **Naming**: all variable, function, and parameter names must be descriptive words. No single-character names — no exceptions, including loop indices. Use `index`, `trackIndex`, `reminderId`, not `i`, `j`, `x`.

- **Screen pattern**: route file in `app/` (navigation wiring only) + component file in `components/` (all UI and business logic). Never put business logic in route files.
- **Store pattern**: Zustand + `persist` with AsyncStorage. Computed values as pure helper functions, not store state.
- **Hook pattern**: one concern per hook. Never merge audio + notification + gesture logic.
- **Type pattern**: use discriminated unions for variant data (`{ type: 'local', asset } | { type: 'remote', uri }`).
- **Analytics pattern**: all events go through `useAnalytics()` in `hooks/use-analytics.ts`. Never call `posthog.capture()` directly. Add the event type to the `AnalyticsEvent` union first, then call it at the action site.
- **Animation pattern**: `useNativeDriver: true` everywhere. Animation values in `useRef`, never `useState`.
- **Theme pattern**: import `Colors` and `Fonts` from `constants/` directly. No theme context or hook.

---

## Security

- Never commit or expose any key, auth or payment data in client code.
- Never store auth tokens, session secrets, or payment data in AsyncStorage.
- Notification payloads: embed only non-sensitive identifiers (`trackId`, `reminderId`, `snoozeMinutes`). No auth tokens, session data, or PII.
- AsyncStorage: never store auth tokens, session secrets, or payment data.
- Always validate `trackId` from a notification payload against the track list before navigating.

---

## Performance

- All animation loops must use `useNativeDriver: true`. Never trigger re-renders to drive animations.
- `ScrollView` is acceptable up to ~200 script lines. Beyond that, use `FlatList` with `getItemLayout`.
- Callbacks passed as props must use `useCallback`. List items rendered from the tracks array must use `React.memo`.
- Audio player must call `player.remove()` in its cleanup effect — no instance leaks on navigation.
- Computed values (streak, progress) are derived on demand via pure functions — never stored as Zustand state.

---

## Testing

- Test pure exported functions from stores and Zod schemas. Do not test UI components unless they contain an untested pure logic function.
- Never mock AsyncStorage in store tests — use `jest-async-storage-mock`.
- UI flows: use mobile-mcp via simulator. Start the dev server first (`npm start`), then boot the iOS simulator.

---

## Internationalization

- Every user-facing string must go through `i18n.t("key.path")`. No hardcoded strings in JSX.
- Both locale files (`app/locales/en.json` and `app/locales/vi.json`) must be updated in the same commit.

---

## Working Rules

- Only reference code that currently exists in the repo.
- Do not suggest patterns, files, or functions that have been removed.
- Do not implement features not explicitly requested.
