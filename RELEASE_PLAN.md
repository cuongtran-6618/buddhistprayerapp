# Release Plan — Chu Dai Bi · Buddhist Prayer

Last updated: 2026-08-30

## Goal

Ship the app on the App Store (iOS first) targeting Vietnamese diaspora users (US, EU, Australia).
Monetisation comes later once content exists; first release is free.

---

## Decisions Made

| # | Topic | Decision |
|---|-------|----------|
| 1 | Monetisation | Free now. Add IAP when 3–5 more chants are recorded. |
| 2 | Content | Ship with 1 track (Chú Đại Bi). Position as the best Chu Dai Bi practice app. |
| 3 | Primary market | Vietnamese diaspora. iOS first, then Play Store. |
| 4 | First-launch UX | Auto-create a 7 AM "Morning Prayer" reminder during onboarding if user grants permission. |
| 5 | Permission timing | Request notification permission at end of onboarding slide 3 ("Get Started"). |
| 6 | Legal hosting | GitHub Pages from the `docs/` folder: privacy policy + Terms of Service. |
| 7 | Store listing language | English primary + Vietnamese secondary listing. |
| 8 | App name | "Chu Dai Bi · Buddhist Prayer" (29 chars, fits App Store 30-char limit). |
| 9 | Experimental features | Disabled `newArchEnabled` and `reactCompiler` for stable first release. Re-enable after crash reporting is in place. |
| 10 | Empty state | Richer card: bell icon + title + hint + gold-outlined "+ Add First Reminder" CTA. |

---

## What's Been Done

### Code (committed to `master`)

| Commit | What changed |
|--------|-------------|
| `724d477` | `docs/terms.html` — Terms of Service created |
| `02bd962` | `app.json` — app name updated, `newArchEnabled` + `reactCompiler` set to false |
| `21f970d` | Onboarding: permission request + auto-create default 7 AM reminder on grant |
| `e523c09` | Home screen: richer empty state (bell icon + CTA button) |

### Legal docs (in `docs/`)

- `docs/privacy-policy.html` — existing, last updated May 2026
- `docs/terms.html` — created 2026-08-30

Both pushed to GitHub. URLs once Pages is enabled:
- `https://cuongtran-6618.github.io/buddhistprayerapp/privacy-policy.html`
- `https://cuongtran-6618.github.io/buddhistprayerapp/terms.html`

---

## What Still Needs To Be Done

### You need to do (manual, no code)

- [ ] **Enable GitHub Pages** — go to https://github.com/cuongtran-6618/buddhistprayerapp/settings/pages → Deploy from branch → `master` / `/docs` → Save. Takes ~2 min to go live.
- [ ] **Create App Store Connect listing** — app name, description, screenshots, privacy URL, ToS URL.
- [ ] **Create Google Play Console listing** — same metadata, plus store graphics.
- [ ] **Write store descriptions** — English primary, Vietnamese secondary. Keywords: "chant Chu Dai Bi", "Buddhist prayer app", "Great Compassion Mantra", "Kinh Chu Dai Bi".

### Code — before submission

- [ ] **Error boundary** — wrap root in a React error boundary so crashes show a recovery screen instead of a white screen. Low effort (~30 min).
- [ ] **Sentry crash reporting** — `@sentry/react-native`, configure in `_layout.tsx`. Needed before you have real users. Medium effort (~2 hours).

### Code — after first release (when more content exists)

- [ ] **More chants** — add 3–5 tracks to `constants/tracks.ts`. Mark some as `isPremium: true`.
- [ ] **IAP integration** — install `react-native-purchases` (RevenueCat), build paywall screen, gate premium tracks. ~40–60 hours.
- [ ] **Re-enable New Architecture + React Compiler** — after Sentry is in place and you can see crash rates.

---

## Build & Submit

```bash
# Build for App Store
eas build --platform ios --profile production

# Build for Play Store
eas build --platform android --profile production

# Submit (after build completes)
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

EAS project ID: `36460078-f18e-42eb-bb45-45fa29706098`
Bundle ID: `com.tiikeritran.buddhistprayerapp`

---

## Monetisation Roadmap (Post-Launch)

Once you have 3–5 chants recorded:

1. Mark premium tracks with `isPremium: true` in `constants/tracks.ts`
2. Install `react-native-purchases` (RevenueCat)
3. Create `hooks/use-purchases.ts` — exposes `isPro: boolean` and `purchase()`
4. Create `components/paywall-screen.tsx` — show pricing, handle purchase
5. Gate premium tracks in `chant-list-screen.tsx` and `player-screen.tsx`
6. Set up products in App Store Connect + Play Console
7. Configure RevenueCat dashboard with product IDs

Suggested pricing: $4.99/month · $39.99/year · $99.99 lifetime.

---

## Architecture Notes (Do Not Change Without Reason)

- **Screen pattern**: route file in `app/` (navigation only) + component in `components/` (all logic)
- **Stores**: Zustand + AsyncStorage. Computed values are pure functions, never stored state.
- **Tracks**: `constants/tracks.ts` is the seed. `useTracks()` hook is the only consumer — swap to Supabase there when ready, no component changes needed.
- **i18n**: every user-facing string goes through `i18n.t("key.path")`. Add to both `en.json` and `vi.json` in the same commit.
- **Animations**: `useNativeDriver: true` always. `Animated.Value` in `useRef`, never `useState`.
