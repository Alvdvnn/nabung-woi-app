# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**Nabung Woi** is a personal finance tracker built with Expo (React Native). It records income/expense transactions across multiple accounts, displays cashflow per day/month/year, charts spending by category, tracks daily logging streaks, and persists everything locally with AsyncStorage. UI strings are mostly English with some Indonesian holdovers.

## Architecture

Expo Router file-based navigation rooted at `app/`.

- `app/_layout.tsx` — root stack. Wraps the app in `GestureHandlerRootView`, `SafeAreaProvider`, `ThemeProvider`, `BottomSheetModalProvider`, `ToastProvider`, `CalculatorProvider`, `PinProvider`. Renders `PinLockScreen` ahead of the stack when the PIN gate is locked.
- `app/index.tsx` — transaction add/edit form (default route).
- `app/(main)/_layout.tsx` — bottom tab layout.
- `app/(main)/dashboard.tsx` — total balance, per-account cards, period totals, streak, top categories, pie chart.
- `app/(main)/history.tsx` — chronological transaction list with type filter.
- `app/(main)/calendar.tsx` — monthly calendar grid with per-day drilldown.
- `app/(main)/gacha.tsx` — 50/50 "buy or skip" decision wheel.
- `app/(main)/settings.tsx` — accounts, categories, data export/clear, security (PIN), appearance.

State and side effects live in four context providers:

- `context/ThemeContext.tsx` — `system | light | dark`, persisted, with `Appearance` listener that flips `resolved` when the OS scheme changes (only while `mode === 'system'`).
- `context/ToastContext.tsx` — global FIFO toast queue rendered via `components/Toast`. Subsequent `show()` calls queue rather than overwrite.
- `context/PinContext.tsx` — PIN lock state, hydrates from AsyncStorage, re-locks after 60s in background.
- `context/DataContext.tsx` — in-memory cache of transactions and accounts plus `addTx` / `updateTx` / `deleteTx` / `saveAccounts` action wrappers. Screens read from the cache instead of refetching AsyncStorage on focus; mutations optimistically update the cache and roll back on a storage failure.

Data layer:

- `utils/storage.ts` — typed AsyncStorage wrappers for transactions, accounts, custom categories, theme mode, locale, last-used account, history prefs. Transaction / account / category writes are serialized through per-key promise chains so concurrent edits can't clobber each other.
- `utils/aggregate.ts` — `filterByPeriod`, `totalsOf`, `sumByCategory`, `accountBalance`. Period filtering uses each transaction's `dayKey` (local-calendar `YYYY-MM-DD` set at write time) so results stay stable across DST and timezone shifts.
- `utils/streak.ts` — current and longest day streak from transactions.
- `utils/format.ts` — IDR formatting, ISO day helpers.
- `utils/id.ts` — collision-resistant id generator (use instead of `Date.now().toString()`).
- `utils/pin.ts` — salted SHA-256 hashing for the PIN and recovery answer.

Styling: per-component `StyleSheet.create` with color tokens from `constants/theme.ts` (light and dark palettes). Spacing, radius, font sizes, and a shared card shadow live in the same file. Wrap StyleSheet in `useMemo([colors])` when colors are interpolated.

## Development Commands

```bash
npm start          # Expo dev menu
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # web browser
npx tsc --noEmit   # type-check the whole project
```

Expo Go works for iteration. Production builds use `eas build`.

## Technology Stack

- React Native 0.81 with the New Architecture enabled (`newArchEnabled: true`).
- Expo 54, Expo Router 6 for navigation.
- TypeScript 5.9 in strict mode.
- `@gorhom/bottom-sheet` for sheets, `lucide-react-native` for icons, `react-native-gifted-charts` for the dashboard pie, `@react-native-community/datetimepicker` for the date field.
- AsyncStorage as the only persistence layer (no remote backend).

## Code Conventions

- Reach for the context hooks (`useTheme`, `useToast`, `usePin`, `useCalculator`, `useData`) rather than passing props through. Specifically, do not call `getTransactions`/`getAccounts` from a screen — go through `useData()` (or the `useTransactions`/`useAccounts` shortcuts) so the shared cache stays the single source of truth and writes can be rolled back.
- Always persist transactions through `useData().addTx` / `updateTx` / `deleteTx`. Pass an explicit `dayKey: isoDay(selectedDate)` so the local-calendar bucketing stays correct.
- IDs come from `genId()` in `utils/id.ts`.
- Localize money via `formatIDR` / `formatIDRCompact`; never call `toLocaleString` directly.
- Compute derived view state inside `useMemo` with the right dependency array — dashboard relies on this to stay responsive when the period toggles.
- Prefer `ScrollView` over a horizontal `FlatList` nested inside another scroll view.

## Testing & Linting

There is no test runner or linter wired up. The TypeScript check above is the only static gate.

## Known Limitations

- AsyncStorage data is unencrypted. The PIN gate guards UI access but does not encrypt the data at rest.
- No concurrent-write protection on storage helpers; rapid double-writes can lose a transaction. Single-user phone usage makes this unlikely in practice.
- Biometric unlock is not implemented; PIN-only.
