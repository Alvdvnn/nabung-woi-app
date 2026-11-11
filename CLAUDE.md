# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**Nabung Woi** (v2.0) is a personal finance tracker built with Expo (React Native). It records income / expense / transfer / adjustment transactions across multiple accounts, shows cashflow for any date range, charts spending by category, tracks monthly budgets and daily logging streaks, and persists everything locally (AsyncStorage on native, `localStorage` on web). The same codebase ships as a native Android/iOS app **and** an installable PWA (static `react-native-web` export deployed on Vercel). UI is fully bilingual (English + Bahasa Indonesia), runtime-swappable, with eight color palettes in light and dark.

## Architecture

Expo Router file-based navigation rooted at `app/`. Routes stay thin: layout and composition only; aggregation lives in `utils/`, shared UI in `components/`.

- `app/_layout.tsx`: root stack. Wraps the app (outer to inner) in `ErrorBoundary`, `GestureHandlerRootView`, `SafeAreaProvider`, `LocaleProvider`, `ThemeProvider`, `PrefsProvider`, `ToastProvider`, `CalculatorProvider`, `PinProvider`, `CategoriesProvider`, `DataProvider`. Renders `PinLockScreen` ahead of the stack when the PIN gate is locked.
- `app/+html.tsx`: web-only HTML shell (PWA meta, safe-area viewport, service-worker registration, and a pre-paint script that reads `nw.theme` from `localStorage` so the first paint already matches the stored palette).
- `app/index.tsx`: transaction add/edit form (default route). Reads `?id=` (edit), `?date=YYYY-MM-DD`, `?returnTo=` (dashboard | calendar | history | report), and prefill params `?type&amount&categoryId&accountId&note` (dashboard quick add; nothing is saved until Save).
- `app/(main)/_layout.tsx`: five bottom tabs: dashboard, calendar, report, history, settings.
- `app/gacha.tsx`: buy-or-skip slot machine, opened from the TopBar dice. A root stack screen, not a hidden tab: Expo Router 58 redirects away from any tab with `href: null`, so never hide a route that way if it must stay reachable.
- `app/(main)/dashboard.tsx`: balance hero, account cards (long-press opens `AdjustBalanceSheet`), `RangeFilter`, totals with deltas, pace, budgets, quick add, top categories, donut, streak. Everything below the hero comes from one `buildReport()` call.
- `app/(main)/report.tsx`: day/week/month/year analytics from `buildReport()`; tappable trend bars, 6-period trend, CSV export.
- `app/(main)/history.tsx`: day-grouped `SectionList`, `FilterSheet`, search, `ActiveFilters`. Accepts `?granularity&start&end` to open scoped to a range.
- `app/(main)/calendar.tsx`: `MonthGrid` heatmap with per-day net, month summary, swipe between months, "Move to date".
- `app/(main)/settings.tsx`: root list only. Each row opens a stack page under `app/settings/`: `accounts`, `categories`, `budgets`, `appearance`, `security`, `data`, `preferences`, `about`.
- `app/category-detail.tsx`, `app/account-detail.tsx`: drilldowns. They take the caller's exact range as `?granularity&start&end` (see `rangeToParams` / `rangeFromParams`) and step it with `RangeNav`. Never derive their range from `new Date()`.

State and side effects live in six context providers:

- `context/DataContext.tsx`: in-memory cache of transactions and accounts plus `addTx` / `updateTx` / `deleteTx` / `saveAccounts`, and derived indexes (`txByDay`, `txDates`, `accountsById`, `balances`, `totalBalance`). Mutations are optimistic with rollback; inserts are sorted so back-dated rows land in order.
- `context/PrefsContext.tsx`: small persisted settings (`weekStart`, `haptics`, `autoLockSec`, `defaultAccountId`, backup timestamps) and per-category monthly `budgets`. Pushes week start and haptics into `utils/date.ts` / `utils/haptics.ts` through module setters.
- `context/CategoriesContext.tsx`: built-in + custom categories, resolved through a `Map`.
- `context/ThemeContext.tsx`: palette x mode. Exposes `colors`, `chart`, `palette`, `mode`, `resolved`, `setPalette`, `setMode`; on web it keeps `<meta name="theme-color">` and the body background in step.
- `context/ToastContext.tsx`: FIFO toast queue; `show(variant, message, { action })` renders an inline button (Undo).
- `context/PinContext.tsx`: PIN lock state; re-locks after `prefs.autoLockSec` in the background (0 = immediately, -1 = never).

Data layer:

- `utils/storage.ts`: typed AsyncStorage wrappers. Transaction / account / category / budget writes are serialized through per-key promise chains; `importAll` merges inside the transaction chain. `clearAll` removes data keys only (theme, language, prefs survive).
- `utils/migrations.ts`: append-only schema upgrades run in `DataProvider` before the first read. Currently **v3** (v3 only initialises `nw.budgets` and `nw.prefs`; transaction/account/category shapes are unchanged since v1, so v1 backups import as-is).
- `utils/date.ts`: pure local-calendar helpers. `startOfWeek` honors the week-start preference.
- `utils/period.ts`: `DateRange` math in `dayKey` space: `rangeFor`, `customRange`, `lastDaysRange`, `shiftRange`, `bucketsFor`, `bucketRange`, `rangeToParams`, `rangeFromParams`. Granularity is `day | week | month | year | custom`.
- `utils/aggregate.ts`: `balanceDelta`, `accountBalances`, `filterByRange`, `totalsOf`, `sumByCategory`, `adjustmentTotals`.
- `utils/report.ts`: `buildReport()`: totals, deltas, buckets, categories, accounts, budgets progress, spending pace, and trend windows in one pass (plus one short pass for the trend).
- `utils/calc.ts`: phone-style calculator engine (pure reducer, no `eval`).
- `utils/csv.ts`, `utils/haptics.ts` (the only importer of `expo-haptics`), `utils/contrast.ts`, `utils/streak.ts`, `utils/format.ts`, `utils/id.ts`, `utils/pin.ts`.

Components are grouped by domain: `components/ui/` (Screen, Card, Button, SegmentedControl, FilterChips, Chip, Sheet, ListRow, SectionGroup, Switch, SearchField, IconBadge, ProgressBar, Skeleton, SectionHeader, StatTile, TopBar, Fab, SplashIntro), plus `brand/`, `transaction/`, `account/`, `category/`, `charts/`, `report/`, `dashboard/`, `calendar/`, `calculator/`, `history/`, `settings/`, `security/`, `feedback/`.

Styling: per-component `StyleSheet.create` reading tokens from `constants/theme.ts`. Wrap StyleSheet in `useMemo([colors])` when colors are interpolated. Brand colors that belong to the logo live in `constants/brand.ts` and never change with the palette.

## Themes

`constants/theme.ts` defines `PALETTES` (default, pastel, mono, ocean, forest, midnight, sunset, lavender). Each has a full `ColorTokens` set for light and dark plus a chart palette. After touching any color run `npm run check:contrast`; it fails if a text/background pair drops below WCAG AA. Read colors through `useTheme()`; chart colors through `useTheme().chart`.

## Transaction semantics

`amount` is **always positive**; the type (and `direction` for adjustments) decides the sign.

| Type | Balance effect | Counts in totals? | Category? |
|---|---|---|---|
| `income` | `+amount` on `accountId` | yes, as income | yes |
| `expense` | `-amount` on `accountId` | yes, as expense | yes |
| `transfer` | `-amount` source, `+amount` `toAccountId` | no | no (`categoryId: 'transfer'`) |
| `adjustment` | `+`/`-amount` by `direction` | **no** | no (`categoryId: 'adjustment'`) |

Adjustments exist so a balance can be corrected without distorting budgets. If you add a new place that sums money (budgets, pace, trends, CSV all follow this), decide explicitly what it does with `transfer` and `adjustment`; the default must be to skip both.

## Platform config (SDK 58)

Expo Go only opens a project whose SDK matches its own; the store build of Expo Go is SDK 58.

`app.json` no longer carries `newArchEnabled`, `android.edgeToEdgeEnabled`, or a top-level `splash` block. The New Architecture and Android edge-to-edge are always on, and the splash image is configured through the `expo-splash-screen` plugin. `expo-status-bar` dropped `backgroundColor`. Run `npx expo-doctor@latest` after touching `app.json`.

SDK 58 rules this project depends on:

- `web.output` must stay `"static"` (SDK 58 defaults to `"server"`).
- The `expo-router` plugin sets `asyncRoutes: { web: false }` so the PWA ships one bundle and opens offline after a single visit.
- `app/+html.tsx` must render `headNodes` in `<head>` and `bodyNodes` after `children` in `<body>` (from `useServerDocumentContext()`), and spread `htmlAttributes` / `bodyAttributes`. Without `bodyNodes` the exported HTML has no JS bundle and the web app renders blank.
- Expo Router no longer feeds safe-area insets on web; this app has its own `SafeAreaProvider` in `app/_layout.tsx`, keep it.
- React Native 0.88 uses the Strict TypeScript API: no deep imports from `react-native/Libraries/*`; `InteractionManager` is gone (use `requestIdleCallback`).

Icons are generated: edit `assets/brand/logo.svg` / `logo-mark.svg`, then `npm run icons` (needs the `sharp` devDependency). Icon and splash changes need a new native build (`eas build`); OTA cannot carry them.

## Web & PWA

- Built with `react-native-web` via `npx expo export -p web` (static), deployed on Vercel (`vercel.json`).
- `public/sw.js` is hand-written: network-first for HTML navigations, stale-while-revalidate for assets. **Bump `CACHE_VERSION` on every deploy** (currently `v6`).
- `apple-mobile-web-app-status-bar-style` must stay `default`, and the manifest `background_color` / `theme_color` must match the default light background (`#f4f6f9`). The runtime theme then rewrites `theme-color`.
- iOS rules that are easy to break: every `TextInput` uses `fontSize.input` (16) or larger, or Safari zooms the page; sticky footers add `useKeyboardInset()` on web (visualViewport); a Modal opened from inside a `Sheet` goes in the sheet's `overlay` prop, never as a sibling; no native-only module without a `Platform.OS` guard.
- Web/PWA storage is per-origin and **separate from the native app**. Move data via Settings, Data, Export/Import.

## Development Commands

```bash
npm start                # Expo dev menu
npm run android | ios | web
npm run typecheck        # node --stack-size=16000 ./node_modules/typescript/lib/_tsc.js --noEmit
npm run check:contrast   # WCAG AA check for every palette
npm run icons            # regenerate icons from assets/brand/*.svg
npx expo export -p web   # static web/PWA build into ./dist
```

Plain `npx tsc --noEmit` dies on this machine with `RangeError: Maximum call stack size exceeded` (a Node stack limit, not a TS bug); use `npm run typecheck`.

## Technology Stack

- React Native 0.88 (New Architecture), Expo 58, Expo Router 58, React 19.3, TypeScript 6.0 strict.
- `react-native-gesture-handler` 3, `react-native-reanimated` 4.7 + `react-native-worklets` 0.13.
- `lucide-react-native`, `react-native-gifted-charts` (donut only; bars are hand-rolled views), `react-native-svg` (logo), `react-native-reanimated` + `react-native-gesture-handler`, `expo-linear-gradient`.
- `react-native-web` for the browser/PWA target; `expo-updates` for OTA.
- No native date picker and no bottom-sheet library: `DateSheet` and `Sheet` are plain RN and identical on every platform.
- AsyncStorage (native) / `localStorage` (web) as the only persistence layer.

## Code Conventions

- Reach for the context hooks (`useTheme`, `useToast`, `usePin`, `useCalculator`, `useData`, `useCategories`, `usePrefs`). Do not call `getTransactions`/`getAccounts` from a screen.
- Prefer the derived indexes (`txByDay`, `accountsById`, `balances`) over re-filtering `txs` in a screen.
- Always persist transactions through `useData().addTx` / `updateTx` / `deleteTx`, passing an explicit `dayKey: isoDay(selectedDate)`.
- Deleting from a list goes through `useDeleteWithUndo()`; moving a row to another day goes through `useMoveToDate()`.
- Build screens from `components/ui/` primitives. Settings-like lists are `SectionGroup` + `ListRow`.
- Every interactive element: 44pt target or larger, `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` when selectable. Labels are localized, never literals.
- No literal colors, font sizes, radii, or durations: import them from `constants/theme.ts`.
- Text or icons on a filled accent (selected pill, danger button, heat cell): `onPrimary` when the fill is `primary`, otherwise `inkOn(colors, fill)` from `utils/contrast.ts`. Never `colors.white`: accents are light in dark mode, so white disappears on them.
- Haptics only through `utils/haptics.ts`.
- IDs come from `genId()`.
- Money via `formatIDR` / `formatIDRCompact` / `formatIDRSigned` / `formatIDRFit` (narrow columns); never `toLocaleString`.
- New i18n strings go in **both** `en` and `id` in `i18n/dicts.ts`. No em dashes in user-facing copy, in either language.
- Any change to a stored shape needs a new append-only migration and must keep v1 backups importable.
- No side effects inside `setState` updaters.

## Testing & Linting

There is no test runner or linter wired up. `npm run typecheck` and `npx expo export -p web` are the two gates; `npm run check:contrast` is the third when colors change. After UI work, serve `dist` and look at the touched screens at 375x667 and 390x844 in light and one dark palette.

## Known Limitations

- AsyncStorage / `localStorage` data is unencrypted. The PIN gate guards UI access but does not encrypt data at rest.
- Biometric unlock is not implemented; PIN-only.
- No cross-device sync. iOS may evict PWA `localStorage` after about 7 days of non-use; the backup nudge exists partly for this.
- Budgets are monthly only; recurring transactions and reminders are not implemented.
