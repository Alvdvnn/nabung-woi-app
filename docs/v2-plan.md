# Nabung Woi v2.0 plan

Source brief: `docs/v2-prompt.md`. This document is the execution plan. Phases are committed one by one on branch `v2`; every phase passes both gates (`node --stack-size=8000 ./node_modules/typescript/lib/_tsc.js --noEmit` and `npx expo export -p web`) before its commit.

Environment note: `node_modules` was missing on this machine; `npm install` has been run. `sharp` is added as a devDependency for the icon generator only (never imported by app code).

---

## 0. Audit findings (beyond the five listed bugs)

Confirmed the five bugs in the brief. Additional issues found while reading the code, all fixed in this release:

| # | Where | Problem | Fix |
|---|---|---|---|
| A1 | `components/calendar/CalendarGrid.tsx` | Grid starts the week on Sunday (`getDay()`), but `utils/date.ts#startOfWeek` and every week range start on Monday. Report "Week" and the calendar disagree. | Week start becomes a preference (Mon default); grid, `startOfWeek`, and `dow` labels all read it. |
| A2 | `components/security/PinLockScreen.tsx` | "Forgot PIN" wipe calls `clearAll()` but never resets the `DataContext` cache, so the old transactions stay on screen until a restart. | Call `resetCache()` + category refresh after the wipe. |
| A3 | `app/(main)/dashboard.tsx` | Account cards push `/account-detail` with the dashboard period, so the same "always current period" drilldown bug (#4) exists here too. | Dashboard passes its full range once it has a range filter. |
| A4 | Web / iOS PWA | Every `TextInput` uses `fontSize.sm` (13) or `md` (15). iOS Safari zooms the page when a focused input is under 16px. | New `fontSize.input = 16` token; every `TextInput` uses it. Body `md` bumps 15 -> 16. |
| A5 | `app/+html.tsx` | `theme-color` and `body` background are hard-coded light. Dark users see a white flash and a light status bar on iOS. | Runtime `theme-color` + body background sync on theme change, plus an inline pre-paint script that reads the stored theme from `localStorage` before React mounts. |
| A6 | `components/feedback/Toast.tsx`, `dashboard.tsx` | `expo-haptics` is imported and called unguarded on web. | `utils/haptics.ts` wraps every call with a `Platform.OS !== 'web'` guard and the new "Haptics" preference. |
| A7 | `app/(main)/report.tsx`, `TrendChart.tsx`, `gacha.tsx`, `i18n/dicts.ts` | Em dashes in user-facing strings (6 in dicts, 4 in JSX). | Replaced with plain copy or a middle dot / hyphen. |
| A8 | `app/index.tsx` | `useFocusEffect` depends on `accounts`, so any account change while the form is open resets the form. | Hydrate once per `editId`/`dateParam`; read `accounts` through a ref. |
| A9 | `app/index.tsx` | The transfer balance check only runs for transfers; editing an income into an expense is fine, but a transfer edited to a bigger amount than the source can cover is only caught via the buggy old-amount logic (#2). | Covered by the `-balanceDelta(oldTx, accountId)` fix. |
| A10 | `components/account/AccountPickerSheet.tsx` | "Add account" navigates to the whole Settings tab. | Navigates to the new `/settings/accounts` screen. |
| A11 | `utils/storage.ts#clearAll` | Clears UI prefs (theme, locale) together with data. A "clear all data" should not reset the language. | `clearAll` removes data keys only; a separate `clearPrefs` is not exposed in UI. |
| A12 | Money audit | `accountBalances`, `balanceDelta`, `totalsOf`, `sumByCategory`, `buildReport`, calendar day totals, history summary, account-detail totals all already skip `transfer` and `adjustment` in income/expense, and apply both to balances only. No change needed; the new budget, pace, comparison, savings-trend, and CSV code follow the same rule (documented in the code). |

---

## 1. Design direction

Goal: a person who has never used a finance app understands each screen at a glance.

- **Hierarchy.** One hero number per screen (balance, amount, cashflow). It uses `display`/`hero` sizes with tight letter spacing; everything else steps down. Section eyebrows stay small uppercase.
- **Type scale** (`constants/theme.ts`): `xs 12 / sm 13 / md 16 / lg 18 / xl 20 / xxl 24 / display 34 / hero 44`, plus `input 16` (minimum for any text field). Line heights paired as before.
- **Spacing.** 4pt scale unchanged. Screen gutter `lg` (16). Card padding `lg`. Vertical rhythm between cards `md` (12).
- **Surfaces.** Cards keep `radius.lg` (20), 1px border, elevation 1 on light, flat on dark. A new `ListRow` primitive (icon badge, title, meta, trailing value/chevron/switch) is the building block for Settings, Accounts, Categories, Budgets, filters.
- **Color.** Palette x mode (section 3). Semantic colors always carry meaning: income green, expense red, transfer = primary, adjustment purple, warning amber. Type-colored accents on the add form follow the selected type.
- **Iconography.** Lucide, 2px stroke, inside tinted circles (`primarySoft`, `incomeLight`, ...). No emoji in UI.
- **Motion.** Reanimated springs for sheets, chips, keypad presses, PIN dots; durations `fast/base/slow`. Nothing animates longer than 400ms. Reduce-motion respected on native via `AccessibilityInfo`.
- **Empty states.** Every list has an `EmptyState` with one clear next action.
- **Copy.** Short, friendly, no em dashes, both languages.

New/updated primitives in `components/ui/`: `ListRow`, `Switch` (custom, same on web), `SearchField`, `Chip` (selectable, removable), `IconBadge`, `SheetHeader` + `Sheet` safe-area polish, `KeypadButton`, `ProgressBar`, `SectionGroup`. Shared hooks: `useKeyboardInset` (native keyboard height / web `visualViewport`), `useReduceMotion`.

---

## 2. Branding

Three concepts are in `assets/brand/concepts/` with a side-by-side preview at `docs/v2-logo-concepts.html` (open in a browser; shows 256 / 64 / 32 / 16px on light and dark plus the maskable safe circle).

- **A. Coin Jar** (recommended). Jar + lid + coin + up-arrow label. Clearest "saving" at 16px.
- **B. Piggy.** Friendly, universal, but becomes a blob at 16px.
- **C. Coin Stacks.** Says "growth"; reads as a bar chart when small.

Delivery once a concept is chosen:
- `assets/brand/logo.svg` (master, 1024 viewBox) and `assets/brand/logo-mark.svg` (artwork without background, for in-app use on any surface).
- `components/brand/Logo.tsx` renders the mark with `react-native-svg` (works on native and web) so the PIN screen, splash intro, and TopBar never load a PNG.
- `scripts/gen-icons.mjs` (node + sharp) renders from the master: `assets/icon.png` 1024, `assets/adaptive-icon.png` 1024 foreground (mark at 66% on transparent) + background color in `app.json`, `assets/splash-icon.png` 1024, `assets/favicon.png` 48, `public/icons/icon-192.png`, `icon-512.png`, `icon-192-maskable.png`, `icon-512-maskable.png` (mark at 80% safe zone), `apple-touch-icon-180.png`, `favicon-32.png`. `npm run icons` regenerates everything.
- Wired into `app.json` (`icon`, `android.adaptiveIcon`, `expo-splash-screen` plugin, `web.favicon`), `public/manifest.json` (any + maskable entries), `app/+html.tsx` (favicon + apple-touch-icon links).
- **Native build required:** icons and splash are baked into the binary. After this release ships, run `eas build` for Android and iOS; `eas update` cannot change them. The `runtimeVersion` policy is `appVersion`, so the 2.0.0 JS bundle only reaches 2.0.0 binaries anyway.

Version bump: `2.0.0` in `app.json` and `package.json`. `public/sw.js` `CACHE_VERSION` -> `v5`.

"What's new in 2.0": `components/feedback/WhatsNewSheet.tsx`, shown once on the dashboard after hydration when `nw.whatsNewSeen !== '2.0.0'`, and always reachable from Settings -> About.

---

## 3. Theme system: palette x mode

`constants/theme.ts` becomes data-driven:

```ts
export type PaletteId = 'default' | 'pastel' | 'mono' | 'ocean' | 'forest' | 'midnight' | 'sunset' | 'lavender';
export interface Palette { id: PaletteId; nameKey: string; light: ColorTokens; dark: ColorTokens; chart: { light: string[]; dark: string[] } }
export const PALETTES: Record<PaletteId, Palette>;
export function resolveColors(palette: PaletteId, resolved: 'light' | 'dark'): ColorTokens;
```

- Every palette defines the full `ColorTokens` set (surfaces, brand, text, lines, income/expense/transfer/adjustment + light variants, warning/info, overlay, skeleton) for both modes, and its own chart palette.
- `scripts/check-contrast.mjs` computes WCAG contrast for every palette/mode: `textPrimary/Secondary/Muted` >= 4.5 on `bg`, `surface`, `surfaceAlt`, `surfaceSunken`; `income/expense/transfer/adjustment/warning/info/primary` >= 4.5 on `bg` and `surface` (they are used as text); `onPrimary` >= 4.5 on `primary`. The script fails the build step if any pair is below AA. Run as `npm run check:contrast` and in the verification step of every phase that touches colors.
- Midnight: dark side is true black `#000000` surfaces for OLED; light side is a cool slate so the palette still has a valid light mode.
- Mode stays `system | light | dark`. Stored as `nw.theme = { palette, mode }`. Legacy `nw.themeMode` is read as a fallback (no migration needed; it is a preference, not data).
- `ThemeContext` exposes `{ colors, palette, mode, resolved, chart, setPalette, setMode }`. Changes apply instantly: everything already reads `useTheme()`.
- Web: `ThemeContext` updates `<meta name="theme-color">` and `document.body.style.backgroundColor` to `colors.bg` on every change. `+html.tsx` keeps `apple-mobile-web-app-status-bar-style: default` and a static `theme-color`/`background_color` of `#f4f6f9` in the manifest (the default light background), plus the pre-paint script.
- Appearance screen: live preview swatches (bg / surface / primary / income / expense) per palette, mode segmented control, instant apply. Accent override is **not** shipped in 2.0 (see Open Questions).

---

## 4. Data layer changes

New storage keys (all under `nw.*`):

| Key | Shape | Purpose |
|---|---|---|
| `nw.theme` | `{ palette, mode }` | Theme (section 3) |
| `nw.prefs` | `{ defaultAccountId?, weekStart: 'mon'\|'sun', haptics: boolean, autoLockSec: 0\|30\|60\|300\|-1, lastExportAt?: string }` | Preferences screen |
| `nw.budgets` | `Budget[] = { categoryId, monthly: number }[]` | Monthly budgets per expense category |
| `nw.calcHistory` | `{ expr, result, at }[]` capped at 50 | Calculator history |
| `nw.whatsNewSeen` | `'2.0.0'` | What's new flag |
| `nw.historyPrefs` | existing shape + optional `accountId`, `categoryId`, `min`, `max`, `query` | History filters (parsed defensively; old values still load) |

`nw.balanceHidden` is kept and surfaced in Preferences as "Hide balances by default".

**Migration v3** (`utils/migrations.ts`, append-only): initialises `nw.budgets` to `[]` when absent and `nw.prefs` to its defaults when absent. Transaction/account/category shapes are unchanged, so v1 exports import without any transformation. Export gains an optional `budgets` array and a `schemaVersion` field; `importAll` accepts files with or without them and goes through `enqueueTxWrite` (bug #3).

`utils/period.ts`: `Granularity` gains `'custom'`. `rangeFor('custom', start, end)`, `shiftRange` for custom moves by the range length, `bucketsFor` for custom buckets by day up to 62 days and by month beyond. `isCurrentRange` and `containsKey` are unchanged.

`utils/report.ts`: `buildReport` additionally returns `budgets` (per expense category: budget, spent, pct, for month-ish ranges), `pace` (spent so far, days elapsed, projected total; only when the range is the current period), and `trend` (income/expense/net for the previous 6 ranges of the same granularity) in the same single pass plus one short pass per trend window. Transfer/adjustment rules unchanged.

`utils/csv.ts`: builds a CSV of the transactions in a range (date, type, category, account, to account, amount, note). Shared via `Share` on native, downloaded on web.

---

## 5. Routes and files

```
app/
  _layout.tsx                 providers + PrefsProvider (new) + theme-color sync
  +html.tsx                   new icons, pre-paint theme script, viewport tweaks
  index.tsx                   add/edit form (rebuilt)
  category-detail.tsx         range-based (fix #4)
  account-detail.tsx          range-based (fix #4)
  (main)/_layout.tsx          tabs unchanged
  (main)/dashboard.tsx        range filter + new cards
  (main)/calendar.tsx         heatmap, cell net, month summary, swipe, move-to-date
  (main)/report.tsx           drilldown fix, bucket tap, trend, CSV
  (main)/history.tsx          grouped list, filter sheet, search
  (main)/settings.tsx         root list only
  (main)/gacha.tsx            em dash fix only
  settings/_layout.tsx        stack with slide animation
  settings/accounts.tsx       grouped by type, add/edit sheet, reorder
  settings/categories.tsx     expense/income toggle, search, usage counts, edit sheet
  settings/budgets.tsx        monthly budget per expense category
  settings/appearance.tsx     palette swatches, mode, language
  settings/security.tsx       PIN manager + auto-lock timeout
  settings/data.tsx           export, import, CSV, clear, backup reminder
  settings/preferences.tsx    default account, week start, hide balance, haptics
  settings/about.tsx          version, what's new, licenses line

components/
  brand/Logo.tsx
  ui/ListRow.tsx ui/Switch.tsx ui/SearchField.tsx ui/Chip.tsx ui/IconBadge.tsx ui/ProgressBar.tsx ui/SectionGroup.tsx
  transaction/AmountInput.tsx (hero + quick chips) transaction/CategoryGrid.tsx transaction/DateSheet.tsx transaction/MoveToDateSheet.tsx
  calendar/MonthGrid.tsx (shared by Calendar and DateSheet) calendar/MonthSummary.tsx
  calculator/Calculator.tsx (rewritten UI) calculator/CalculatorProvider.tsx (open({ onApply }))
  dashboard/RangeFilter.tsx dashboard/ComparisonCard.tsx dashboard/PaceCard.tsx dashboard/QuickAddRow.tsx dashboard/BudgetsCard.tsx
  report/TrendMini.tsx report/BucketDetail.tsx
  history/FilterSheet.tsx history/ActiveFilters.tsx history/DayHeader.tsx
  security/PinLockScreen.tsx (rebuilt) security/Keypad.tsx security/PinDots.tsx
  feedback/WhatsNewSheet.tsx
  settings/SettingsRow.tsx settings/AccountSheet.tsx settings/CategorySheet.tsx settings/BudgetSheet.tsx

context/PrefsContext.tsx     prefs + budgets (small, persisted)
hooks/useKeyboardInset.ts (+ .web.ts)  hooks/useReduceMotion.ts  hooks/useCategoryUsage.ts
utils/calc.ts  utils/csv.ts  utils/haptics.ts  utils/contrast.ts (shared by the script)
scripts/gen-icons.mjs  scripts/check-contrast.mjs
assets/brand/logo.svg  assets/brand/logo-mark.svg
```

Removed: `@react-native-community/datetimepicker` dependency, `components/transaction/DatePickerField.tsx` and `.web.tsx` (replaced by `DateSheet`), `components/account/AccountManager.tsx` and `components/category/CategoryManager.tsx` (replaced by the settings screens).

---

## 6. Screen plans

### a. PIN lock
Custom numeric keypad (no `TextInput`, so no iOS zoom), 4 to 8 animated dots, greeting by local hour (morning / afternoon / evening / night in both languages), logo mark in a branded header, press feedback on keys (spring scale), wrong PIN shakes the dots + haptic (native only) + error copy, success fades the screen out. Safe-area insets from `useSafeAreaInsets` (works on web via the provider). Recovery flow keeps the current question/answer/wipe path with the cache reset fix (A2). Auto-lock timeout read from prefs (`PinContext`).

### b. Add / Edit transaction
- Amount is the hero: type-colored, `hero` size, auto-shrinks, thousand separators as you type. Quick chips `+10rb +20rb +50rb +100rb` add to the amount; a clear button resets it; a calculator button opens the calculator with `onApply`.
- Category grid: 4 columns, fixed 76pt tiles, icon over label, truncation safe. Order = usage frequency in the last 90 days, then recency, then default order (`useCategoryUsage`). Shows 8, "More" expands to all.
- Account / to-account pills unchanged in behavior, restyled as `ListRow`s with balance.
- Date: `DateSheet` with month grid (`MonthGrid`), Today / Yesterday chips, optional time (hour and minute steppers behind a "Set time" switch). Display format `Mon, 10 Nov 2025` and `Sen, 10 Nov 2025`.
- Sticky bottom bar with Save (and Cancel when editing) that sits above the keyboard: `KeyboardAvoidingView` on native, `useKeyboardInset.web` (visualViewport) on web.
- Params `id`, `date`, `returnTo` keep working. Fixes #1 (category reset on type change, without clobbering a deleted custom category when the type is unchanged), #2, A8.

### c. Calculator
`utils/calc.ts`: tokenizer + shunting-yard with precedence, `%` (phone semantics: `a + b%` = a + a*b/100, `a × b%` = a*b/100), `±`, backspace, AC/C, chained operators (replace the trailing operator), repeated `=` (re-applies the last operation), no `eval`. UI shows the expression as typed, a faint live preview, and the result only after `=`. History (persisted, capped at 50, clearable) in a collapsible list; tapping an entry loads its result. "Use amount" applies the result into the amount field when opened from the form; otherwise the button is hidden.

### d. Dashboard
Justification per feature:
- **Range filter** (required): presets Today / This week / This month / This year / Last 30 days + Custom (two `DateSheet` picks). Drives totals, comparison, top categories, donut, budgets. Default: this month.
- **Comparison vs previous period**: free from `buildReport`; answers "am I doing better than last month" without opening Report.
- **Spending pace**: shown only when the range is the current period; "Rp X so far, about Rp Y by the end at this pace". The single most useful number for a non-technical user mid-month.
- **Quick add from recent**: up to 6 chips of distinct (category, amount, account) from the last 30 days; tap opens the form prefilled (safe, no accidental entries). See Open Questions for one-tap.
- **Budgets**: top 3 expense categories with a budget, progress bars, "See all" to Settings -> Budgets. Only renders when at least one budget exists, so new users are not nagged.
- Not shipped: recurring reminders (needs scheduling/notifications; proposed as a follow-up).
Layout stays scannable: hero balance, account cards, range filter, three stat tiles, then optional cards (pace, budgets, quick add, top categories, donut, streak).

### e. Categories and accounts
Recommendation: agree with the brief.
- Categories: expense/income segmented toggle + search (search appears once there are more than 8 items in the current list). Grouped sections "Built in" and "Yours" with icon, usage count (all time), and a monthly budget hint if set. Tap a custom row to edit (rename, icon) in a sheet; built-ins are read-only but show usage. Reordering is **not** added: the add form already orders by usage, so manual order would fight it.
- Accounts: grouped by type (Bank, Cash, E-Wallet, Card) with live balances and a type subtotal. Add/edit sheet (name, type, starting balance, adjust balance shortcut). Reorder via up/down in the edit sheet (position = array order, no new field), because card order on the dashboard is something people do care about and drag on PWA is unreliable.
- Budgets get their own screen (expense categories with an amount field each).

### f. Calendar
- Heatmap: 4 intensity steps of `expenseLight`-to-`expense` based on the day's expense relative to the month's max; income-only days get a soft green tint.
- Each cell shows the day number and a compact net (`-25rb`), hidden under 360pt width.
- Month summary row above the grid (income / expense / net for the visible month).
- Week start follows Preferences.
- Swipe left/right between months: `PanGestureHandler` on the grid card only, `activeOffsetX: [-24, 24]`, `failOffsetY: [-12, 12]`, so vertical scroll and Safari's edge back-swipe are not affected.
- Drag-and-drop to move a transaction: **rejected**. Inside a vertical `ScrollView` on mobile, a drag has to win against scroll and (on iOS PWA) against text-selection/callout on long press; drop targets are 38pt cells, so mis-drops are likely and the user cannot see where a row is going. Instead: "Move to date" in the row actions (and from the edit form) opens `MoveToDateSheet` (same month grid), updates `dayKey` + time-preserving `date`, and shows an Undo toast.

### g. Report
- Drilldown fix (#4): Report passes `{ granularity, startKey, endKey }` to `category-detail` and `account-detail`; both rebuild the `DateRange`, render `RangeNav` (prev/next inside the detail), and compute from `filterByRange` so the list and totals equal the Report row. Dashboard and calendar use the same params.
- KPI tiles with deltas (kept), cashflow card, trend chart with tappable buckets that open a small `BucketDetail` (income / expense / net / count) with "View transactions" which opens History scoped to that day or month via `?start=&end=&granularity=`.
- Savings-rate trend over the last 6 periods (mini bars), category trend inside `category-detail` for the same 6 periods, CSV export/share of the current range.

### h. History
- Header (RangeNav + summary card) is a fixed block above the list with a `sm` gap; the list is a `SectionList` grouped by day with sticky day headers showing the day's subtotal. No overlap at any scroll offset because the summary is outside the scroll container and the sticky headers are the list's own.
- Filter sheet: Type (All / Income / Expense / Transfer / Adjustment), Period (Day / Week / Month / Year / Custom with two date picks), Account, Category, Amount min/max, live result count, Reset and Apply. Active filters appear as removable chips above the list.
- Search field (note or category name) above the list, debounced.
- Delete with undo unchanged. `?start=&end=&granularity=` params set the range when arriving from Report.

### i. Settings
Root list of grouped rows (`ListRow` with chevrons): Accounts, Categories, Budgets, Appearance, Security, Data, Preferences, About. Each is a stack screen under `app/settings/` with a back TopBar, so the tab bar is hidden and the page can own the full height. Extra settings shipped: auto-lock timeout, week start, haptics, default account, backup reminder (Data shows "Last backup: 12 days ago" and the dashboard shows a one-line nudge after 30 days without an export, dismissable).

---

## 7. Phases and commits

| Phase | Scope | Commit |
|---|---|---|
| 0 | Branch `v2`, plan + concepts, `npm install`, sharp devDep | `docs: v2 plan and logo concepts` |
| 1 | Theme palettes + ThemeContext + contrast script + web theme-color; type scale + `input` token; `utils/haptics.ts`; PrefsContext + storage keys; migration v3; export/import with budgets + `enqueueTxWrite`; em dash sweep; version 2.0.0; sw v5 | `feat(theme): palettes x mode, prefs, migration v3` |
| 2 | Bugs #1, #2, A2, A8; `period.ts` custom; range-based detail screens (#4) with RangeNav; History range params; dashboard/calendar pass ranges | `fix: report drilldown ranges, form edit bugs, pin wipe cache` |
| 3 | Logo master + `Logo` component + icon script + wiring + splash/TopBar/PIN usage | `feat(brand): new logo, generated icons, pwa manifest` |
| 4 | UI primitives (`ListRow`, `Switch`, `SearchField`, `Chip`, `IconBadge`, `ProgressBar`, `SectionGroup`), `MonthGrid`, `DateSheet`, `useKeyboardInset`, Sheet safe-area polish | `feat(ui): v2 primitives, custom date sheet, keyboard inset` |
| 5 | PIN lock screen rebuild + auto-lock pref | `feat(pin): keypad lock screen` |
| 6 | Add/Edit form rebuild + Calculator rewrite + history | `feat(form): hero amount, category grid, calculator` |
| 7 | Settings restructure (routes), Accounts, Categories, Budgets, Appearance, Security, Data, Preferences, About + What's new | `feat(settings): grouped settings screens` |
| 8 | Dashboard range filter, comparison, pace, quick add, budgets card, backup nudge | `feat(dashboard): range filter and insight cards` |
| 9 | Calendar heatmap, cell net, month summary, swipe, move-to-date | `feat(calendar): heatmap, swipe, move to date` |
| 10 | Report bucket drill, trend, category trend, CSV | `feat(report): drill, trends, csv export` |
| 11 | History grouped list, filter sheet, search, chips | `feat(history): filters and grouped list` |
| 12 | CLAUDE.md + README, final sweep (both gates, contrast, em dash grep, all palettes light/dark at 375x667 and 390x844), summary | `docs: v2 architecture and release notes` |

Verification per phase: both gates, then `npx expo export -p web` served locally (`npx serve dist`) and checked in Chrome at 375x667 and 390x844 in light + one dark palette for the touched screens. What cannot be verified here: real iOS Safari standalone behavior (keyboard inset, safe areas on a notched device, haptics), native builds. These are listed in the final summary.

---

## 8. Open questions

Answer these once; after that I execute all phases without asking again unless something is destructive or truly ambiguous.

1. **Logo.** A (Coin Jar, recommended), B (Piggy), or C (Coin Stacks)? Keep the teal brand (`#0d9488` family, current primary) as the icon background, or switch brand color? The Android adaptive background will match.
2. **Budgets.** Include monthly budgets per expense category in 2.0 (adds Settings -> Budgets, a dashboard card, a report section, migration v3 and an export field), or defer to 2.1? Recommended: include.
3. **Palettes.** Ship these eight: Default (teal), Pastel Pink & Cream, Monochrome, Ocean, Forest, Midnight (OLED), Sunset, Lavender. Drop or add any? Accent-color override: skip in 2.0 (recommended) or include?
4. **Quick add from recent.** Tap opens the form prefilled (recommended, safe) or adds immediately with an Undo toast (faster)?
5. **Calendar move.** Confirm "Move to date" instead of drag-and-drop (reasoning in 6f).
6. **Date picker dependency.** Remove `@react-native-community/datetimepicker` entirely now that the custom sheet covers all platforms? Recommended: remove.
7. **History list.** Switching to a `SectionList` grouped by day drops the fixed-height `getItemLayout` optimization (headers vary). Lists under a few thousand rows stay smooth with windowing. OK?
8. **Report bucket tap.** Opens an inline bucket panel with a "View transactions" button that jumps to History scoped to that day/month. OK, or should it push a dedicated screen?
9. **Week start default.** Monday (matches current ranges; calendar currently shows Sunday first, which is the inconsistency A1). OK?
10. **Auto-lock options.** Immediately / 30 s / 1 min (default, current behavior) / 5 min / Never. OK?
11. **Gacha.** Out of scope except the em dash fix and token compliance. OK?
12. **Backup reminder.** One-line dashboard nudge after 30 days without an export (dismissable for 30 more days). OK, or Data screen only?

---

## 9. Decisions (answered 2026-11-10)

All recommendations accepted: logo **A (Coin Jar)** on the teal brand; budgets included; eight palettes, no accent override; quick add prefills the form; "Move to date" replaces drag-and-drop; `@react-native-community/datetimepicker` removed; History uses a day-grouped `SectionList`; Report bucket tap opens an inline panel that can jump to History; week starts Monday; auto-lock options as listed with 1 min default; Gacha untouched beyond copy/tokens; backup nudge on the dashboard after 30 days.
