# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nabung Woi** is a React Native financial dashboard application built with Expo. It displays personal finance information including current balance, income/expense summary, savings goals, and recent transactions. The interface is in Indonesian and features a green-themed design.

## Architecture

The project follows a simple Expo-based React Native structure:

- **Entry point**: `index.ts` — registers the root component with Expo
- **Root component**: `App.tsx` — contains the entire dashboard UI with hardcoded financial data and inline StyleSheet styling
- **Styling**: Uses React Native `StyleSheet` API with a color scheme featuring green (#10b981) as the primary accent

The app currently displays static UI with mock data. Future development will likely involve:
1. State management (for dynamic financial data)
2. Navigation (to add screen transitions)
3. Data persistence (SQLite, AsyncStorage, or cloud backend)
4. Real transaction tracking and goal management

## Development Commands

```bash
# Start the dev server (interactive menu to choose platform)
npm start

# Run on specific platforms
npm run android      # Android emulator
npm run ios          # iOS simulator
npm run web          # Web browser
```

Expo Go can be used for faster iteration without building native binaries. For production builds, use `eas build` (requires Expo account setup).

## Technology Stack

- **React Native 0.81.5** — UI framework
- **Expo 54** — React Native abstraction layer handling platform setup
- **TypeScript 5.9** — strict mode enabled for type safety
- **React 19.1** — component library

## Code Style Notes

- All styling is done inline with `StyleSheet.create()` in the component file
- Color values are hardcoded (not extracted to constants yet)
- Component is a functional default export
- No external UI libraries in use; all components are from `react-native`

## Testing & Linting

No test or linting infrastructure is set up. Consider adding:
- `expo lint` or `eslint` for code quality
- Jest for unit tests (Expo includes Jest configuration)
- React Native testing libraries for component tests

## Next Steps for Development

1. Extract hardcoded financial data into state (useState or a state management solution)
2. Create separate screen components using React Navigation
3. Add forms for transaction entry and goal management
4. Connect to a backend API or local database
5. Consider extracting styles and colors to constants/theme files as the codebase grows
