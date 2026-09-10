# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**Nabung Woi** is a personal finance tracker built with Expo (React Native). It records income / expense / transfer / adjustment transactions across multiple accounts, displays cashflow per day/week/month/year, charts spending by category, tracks daily logging streaks, and persists everything locally (AsyncStorage on native, `localStorage` on web). The same codebase ships as a native Android/iOS app **and** an installable PWA (static `react-native-web` export deployed on Vercel). UI is fully bilingual (English + Bahasa Indonesia), runtime-swappable.

## Architecture

Expo Router file-based navigation rooted at `app/`. Routes stay thin — layout and composition only; aggregation lives in `utils/`, shared UI in `components/`.

- `app/_layout.tsx` — root stack. Wraps the app (outer→inner) in `ErrorBoundary`, `GestureHandlerRootView`, `SafeAreaProvider`, `LocaleProvider`, `ThemeProvider`, `BottomSheetModalProvider`, `ToastProvider`, `CalculatorProvider`, `PinProvider`, `CategoriesProvider`, `DataProvider`. Renders `PinLockScreen` ahead of the stack when the PIN gate is locked.
- `app/+html.tsx` — web-only HTML shell (PWA meta tags, safe-area viewport, service-worker registration).
- `app/index.tsx` — transaction add/edit form (default route). Four types via `TypeToggle`: expense, income, transfer, adjustment. Reads `?id=` (edit), `?date=YYYY-MM-DD` (pre-selected day), `?returnTo=` (dashboard | calendar | history | report). Keyboard-aware on both platforms.
- `app/(main)/_layout.tsx` — five bottom tabs: dashboard · calendar · report · history · settings. The `gacha` route stays registered but hidden (`href: null`) and is reached from the dice icon in `TopBar`; a sixth tab would push targets below 44pt.
- `app/(main)/dashboard.tsx` — total balance with hide-balance eye toggle, per-account cards (**long-press → `AdjustBalanceSheet`**), period totals, streak, top categories, pie chart.
- `app/(main)/report.tsx` — day/week/month/year analytics driven entirely by `buildReport()`.
- `app/(main)/history.tsx` — range-scoped list with type filter (incl. adjustment) and delete-with-undo; prefs persisted.
- `app/(main)/calendar.tsx` — monthly grid, per-day drilldown; the **+** button carries the selected day into the form.
- `app/(main)/settings.tsx` — accounts, categories, data export/import/clear, security (PIN), appearance, language.

State and side effects live in five context providers:

- `context/DataContext.tsx` — in-memory cache of transactions and accounts plus `addTx` / `updateTx` / `deleteTx` / `saveAccounts`. Also exposes derived indexes built once per change: `txByDay`, `txDates`, `accountsById`, `balances`, `totalBalance`. Mutations optimistically update the cache and roll back on a storage failure; inserts are **sorted** so back-dated rows land in chronological order.
- `context/CategoriesContext.tsx` — built-in + custom categories, resolved through a `Map` (`find` runs once per rendered row).
- `context/ThemeContext.tsx` — `system | light | dark`, persisted, with an `Appearance` listener.
- `context/ToastContext.tsx` — FIFO toast queue; `show(variant, message, { action })` renders an inline button (used for Undo).
- `context/PinContext.tsx` — PIN lock state, re-locks after 60s in background.

Data layer:

- `utils/storage.ts` — typed AsyncStorage wrappers. Transaction / account / category writes are serialized through per-key promise chains. Keys live under the `nw.*` namespace.
- `utils/migrations.ts` — one-shot schema upgrades; `runMigrations()` runs in `DataProvider` before the first read. Currently at **v2** (sorts legacy rows by date, normalizes adjustment direction).
- `utils/date.ts` — pure local-calendar helpers (`isoDay`, `parseIsoDay`, `startOfWeek`, …). No i18n/storage imports, so anything may depend on it.
- `utils/period.ts` — `DateRange` math in `dayKey` space: `rangeFor`, `shiftRange`, `previousRange`, `bucketsFor`, `isCurrentRange`.
- `utils/aggregate.ts` — `balanceDelta`, `accountBalances`, `filterByPeriod`, `filterByRange`, `totalsOf`, `sumByCategory`, `adjustmentTotals`.
- `utils/report.ts` — `buildReport()`: every Report section in a single pass over the transaction list.
- `utils/streak.ts`, `utils/format.ts` (cached `Intl` formatters), `utils/id.ts` (`genId`), `utils/pin.ts` (salted SHA-256).

Components are grouped by domain, not by file type: `components/ui/` (Screen, Card, Button, SegmentedControl, FilterChips, Sheet, Skeleton, SectionHeader, StatTile, TopBar, Fab, SplashIntro), plus `transaction/`, `account/`, `category/`, `charts/`, `report/`, `dashboard/`, `calendar/`, `calculator/`, `security/`, `feedback/`.

Styling: per-component `StyleSheet.create` reading tokens from `constants/theme.ts` — colors (light + dark, semantic and chart palettes), 4pt `spacing`, `radius`, paired `fontSize`/`lineHeight`/`weight`, `elevation` 0–4, `motion` durations, `HIT_SIZE`. Wrap StyleSheet in `useMemo([colors])` when colors are interpolated.

## Transaction semantics

`amount` is **always positive**; the type (and `direction` for adjustments) decides the sign.

| Type | Balance effect | Counts in totals? | Category? |
|---|---|---|---|
| `income` | `+amount` on `accountId` | yes, as income | yes |
| `expense` | `-amount` on `accountId` | yes, as expense | yes |
| `transfer` | `-amount` source, `+amount` `toAccountId` | no | no (`categoryId: 'transfer'`) |
| `adjustment` | `+`/`-amount` by `direction` | **no** | no (`categoryId: 'adjustment'`) |

Adjustments exist so a balance can be corrected without distorting budgets. If you add a new place that sums money, decide explicitly what it does with `transfer` and `adjustment` — the default must be to skip both.

## Platform config (SDK 57)

`app.json` no longer carries `newArchEnabled`, `android.edgeToEdgeEnabled`, or a top-level
`splash` block — SDK 57 removed all three. The New Architecture and Android edge-to-edge are
always on, and the splash image is configured through the `expo-splash-screen` config plugin.
`expo-status-bar` also dropped `backgroundColor`: the bar is transparent and the view behind it
paints the color. Run `npx expo-doctor@latest` after touching `app.json`.

## Web & PWA

- Built with `react-native-web` via `npx expo export -p web` (static `output: 'static'`), deployed on Vercel (`vercel.json`).
- `public/sw.js` is hand-written: network-first for HTML navigations, stale-while-revalidate for assets. **Bump `CACHE_VERSION` on every deploy** or installed PWAs keep serving the stale shell.
- `public/manifest.json` + `app/+html.tsx` meta drive the install experience. `apple-mobile-web-app-status-bar-style` must be `default`, and `background_color` / `theme_color` must match the app background (`#f4f6f9`) or iOS paints a colored band.
- Web/PWA storage is per-origin and **separate from the native app** — no sync. Move data via Settings → Export/Import.

## Development Commands

```bash
npm start          # Expo dev menu
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # web browser
npx tsc --noEmit   # type-check the whole project (only static gate)
npx expo export -p web   # static web/PWA build → ./dist
```

`npx tsc --noEmit` dies on this machine with `RangeError: Maximum call stack size exceeded` — the default V8 stack is too small for the checker on this project (a Node limit, not a TS bug). Run `node --stack-size=8000 ./node_modules/typescript/lib/_tsc.js --noEmit` instead.

Expo Go works for iteration. Native builds use `eas build`; JS-only changes can ship OTA with `eas update`.

## Technology Stack

- React Native 0.86. The New Architecture is unconditional in SDK 57, so there is no `newArchEnabled` flag any more.
- Expo 57, Expo Router 57.
- TypeScript 6.0 strict.
- `@gorhom/bottom-sheet` (provider-level), `lucide-react-native`, `react-native-gifted-charts` (donut only — bar and ranked charts are hand-rolled views), `@react-native-community/datetimepicker`.
- `react-native-web` for the browser/PWA target; `expo-updates` for OTA.
- AsyncStorage (native) / `localStorage` (web) as the only persistence layer — no remote backend.

## Code Conventions

- Reach for the context hooks (`useTheme`, `useToast`, `usePin`, `useCalculator`, `useData`, `useCategories`) rather than passing props through. Do not call `getTransactions`/`getAccounts` from a screen — go through `useData()` so the cache stays the single source of truth.
- Prefer the derived indexes (`txByDay`, `accountsById`, `balances`) over re-filtering `txs` in a screen.
- Always persist transactions through `useData().addTx` / `updateTx` / `deleteTx`, passing an explicit `dayKey: isoDay(selectedDate)`.
- Deleting a transaction from a list goes through `useDeleteWithUndo()` so the user gets the Undo toast.
- Build screens from `components/ui/` primitives instead of restyling raw views.
- Every interactive element: ≥44pt target, `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` when selectable.
- No literal colors, font sizes, radii, or durations — import them from `constants/theme.ts`.
- IDs come from `genId()` in `utils/id.ts`.
- Localize money via `formatIDR` / `formatIDRCompact` / `formatIDRSigned`; never call `toLocaleString` directly.
- New i18n strings must be added to **both** `en` and `id` in `i18n/dicts.ts` (`id` is typed as `typeof en`, so a missing key fails the type check).
- Compute derived view state inside `useMemo` with the right dependency array.
- Prefer `ScrollView` over a horizontal `FlatList` nested inside another scroll view; give vertical `FlatList`s `getItemLayout` when rows are fixed-height (`TRANSACTION_ITEM_HEIGHT`).

## Testing & Linting

There is no test runner or linter wired up. The TypeScript check above is the only static gate. `npx expo export -p web` is a useful second gate — it catches bundling and import errors that `tsc` does not.

## Known Limitations

- AsyncStorage / `localStorage` data is unencrypted. The PIN gate guards UI access but does not encrypt data at rest.
- Biometric unlock is not implemented; PIN-only.
- Native app storage and web/PWA storage are separate per platform/origin; no cross-device sync. iOS may evict PWA `localStorage` after ~7 days of non-use.
