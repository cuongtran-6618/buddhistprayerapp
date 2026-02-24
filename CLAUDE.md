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
- **expo-av** for audio playback, **expo-notifications** for prayer reminders
- **react-native-purchases** for in-app purchases (PRO chants)

## Architecture

### Screen Structure

Screens are split into a route file (`app/`) and a component file (`components/`). Route files handle navigation wiring; component files contain all UI logic.

```
app/_layout.tsx              → Root Stack navigator, loads Be Vietnam Pro fonts
app/(tabs)/index.tsx         → Mounts OnboardingScreen; on finish: router.replace("/home")
app/(tabs)/home.tsx          → Mounts HomeScreen; on chant select: router.push("/chant")
app/(tabs)/chant.tsx         → Mounts PlayerScreen; back: router.back()
```

```
components/onboarding-screen.tsx   → 3-slide carousel with animated rings + slide transitions
components/home-screen.tsx         → Dashboard: time-based greeting, streak card, schedule, chant library
components/player-screen.tsx       → Audio player with rotating mandala, scrolling lyrics, progress bar
components/phone-frame.tsx         → Web-only iPhone frame wrapper (transparent on native)
components/icons/bell-icon.tsx     → SVG bell icon
components/icons/lotus-icon.tsx    → SVG lotus icon
```

### Theming

No dynamic light/dark switching — the app uses a **single dark Buddhist theme** defined in:
- `constants/colors.ts` — exports `Colors` object (bg, surface, card, gold, red, cream, muted, etc.)
- `constants/fonts.ts` — exports `Fonts` object mapping semantic names to Be Vietnam Pro variants

All components import `Colors` and `Fonts` directly; there is no theme context or hook.

### Internationalization

`app/lib/i18n.ts` sets up `i18n-js` with English and Vietnamese locales. Device language is auto-detected via `expo-localization`. Import `i18n` and call `i18n.t("key.path")`. Translation files are in `app/locales/en.json` and `app/locales/vi.json`.

### Animation Pattern

All animations use React Native's built-in `Animated` API with `useNativeDriver: true`. The common slide-transition pattern (fade + scale out → update state → fade + scale in) is centralized in `transitionToStep()` in the onboarding screen. Player animations (mandala rotation, breathing lotus, glow pulses) pause when audio is not playing.
