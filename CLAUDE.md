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

# Reset to blank project
npm run reset-project  # Moves app/ to app-example/ and creates fresh app/
```

### Project
This is the mobile reminder app which can remind buddism to pray and display the chant

## Architecture

### Tech Stack
- **Expo SDK 54** with React Native 0.81.5 and React 19.1
- **expo-router** for file-based routing
- **React Native New Architecture** enabled
- **React Compiler** enabled (experimental)
- **TypeScript** with strict mode

### Routing Structure
Routes are defined by the file system in `app/`:
- `app/_layout.tsx` - Root layout with ThemeProvider and Stack navigator
- `app/(tabs)/` - Tab group with bottom tab navigation
- `app/modal.tsx` - Modal screen (presentation: 'modal')

The `unstable_settings.anchor` in root layout sets `(tabs)` as the initial route group.

### Theming System
Theme-aware components use a hook-based pattern:
1. `constants/theme.ts` - Defines `Colors` (light/dark) and `Fonts` (platform-specific)
2. `hooks/use-color-scheme.ts` - Returns current color scheme ('light' | 'dark')
3. `hooks/use-theme-color.ts` - Resolves color from theme or props override
4. `ThemedText` / `ThemedView` - Accept `lightColor`/`darkColor` props for per-component overrides

### Path Aliases
`@/*` maps to project root (configured in tsconfig.json):
```typescript
import { ThemedText } from '@/components/themed-text';
```
