# Nabung Woi 💸

> **Nabung** _(verb, Indonesian)_ — to save money. **Woi** _(interjection)_ — hey!
>
> An offline-first personal finance tracker for the rupiah-spending crowd. One codebase ships a native **Android/iOS app** _and_ an installable **PWA** — same buttery dark/light UI, same PIN gate, zero backend. No accounts, no cloud, no ads. Your money data never leaves your device.

<p align="center">
  <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-58-000020?logo=expo&logoColor=white" alt="Expo"></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=white" alt="React Native"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.0%20strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://reactnative.dev/architecture/landing-page"><img src="https://img.shields.io/badge/New%20Architecture-on-success" alt="New Architecture"></a>
  <a href="#-web--pwa"><img src="https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white" alt="PWA"></a>
  <a href="#-license"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License"></a>
</p>

---

## ✨ Highlights (v2.0)

- 🏦 **Offline-first, local-only.** AsyncStorage (native) / `localStorage` (web) is the entire backend. No sign-up, no servers, no telemetry.
- 🎨 **Eight palettes, light and dark.** Default, Pastel pink, Monochrome, Ocean, Forest, Midnight (OLED black), Sunset, Lavender. Every text/background pair is checked against WCAG AA by a script.
- 📅 **Any date range on the dashboard.** Today, this week, this month, this year, last 30 days, or a custom range. Totals, comparison with the previous period, spending pace, budgets, and charts all follow it.
- 🎯 **Monthly budgets.** One limit per expense category, with progress on the dashboard and in the report.
- ⚡ **Fast entry.** A big amount field with `+10rb +20rb +50rb +100rb` chips, your most-used categories first, one-tap "add again" from recent entries, and a date picker that is the same on every platform.
- 🧮 **A real calculator.** Works like a phone calculator (precedence, %, repeated =), keeps a history, and drops the result into the amount.
- 📊 **A report that drills down.** Tap a bar, a category, or an account and you get exactly the transactions behind that number, for that range. Savings-rate trend over six periods and CSV export.
- 🗓️ **Calendar heatmap.** Spending intensity and daily net in every cell, swipe between months, and "Move to date" with Undo.
- 🔎 **History filters.** Type, period or custom range, account, category, amount range, and search, with removable chips for what is active.
- ⚖️ **Balance adjustments.** Correct a balance without polluting income, expense, budgets, or charts.
- ↩️ **Undo.** Deleting or moving a transaction offers a 5-second Undo.
- 🔐 **PIN lock** with a proper keypad, a recovery question, and a configurable auto-lock (immediately to never).
- 🌐 **Bilingual.** English + Bahasa Indonesia, swappable at runtime.
- 📲 **Installable PWA** that follows the theme (status bar included), with safe-area and iOS keyboard handling.
- 🛡️ **Crash-resilient.** Top-level `ErrorBoundary`; append-only schema **migrations** run before the first read; v1 backups still import.

---

## 🧭 Timezone-safe by design

Every transaction stores a `dayKey` — a **local-calendar `YYYY-MM-DD`** string computed at write time. All period filtering, streaks, report ranges, and calendar dots compare `dayKey` **strings** instead of re-parsing UTC `Date` objects. Totals stay stable across **DST shifts and timezone changes** — your "today" never silently rolls into yesterday on a flight.

---

## 📱 Screens

| Tab | Screen | What it does |
|---|---|---|
| 🏠 | **Dashboard** | Balance (with hide toggle), account cards (long-press to adjust), range filter, income/expense with deltas, net vs previous period, spending pace, budgets, add again, top categories, donut, streak |
| 📆 | **Calendar** | Month summary, heatmap grid with daily net, swipe between months, per-day list, move to date; **+** carries the selected date into the form |
| 📊 | **Report** | Day/week/month/year: summary + deltas, savings rate, tappable trend bars, 6-period trend, by category, budgets, by account, biggest expenses, habits, adjustments, CSV export |
| 🕘 | **History** | Day-grouped list with daily net, filter sheet, search, active-filter chips, delete and move with undo |
| ⚙️ | **Settings** | A grouped list; each row opens its own page: Accounts, Categories, Budgets, Appearance, Preferences, Security, Data, About |

Plus stack routes:
- `app/index.tsx`: the **transaction add/edit form** (default entry point). Four types: expense, income, transfer, adjustment. Accepts `?date=YYYY-MM-DD`, `?id=`, `?returnTo=`, and prefill params.
- `app/settings/*`: the settings pages.
- `app/account-detail.tsx`, `app/category-detail.tsx`: drilldowns that receive the caller's exact date range and can step it.
- `app/gacha.tsx`: the impulse wheel; a root stack screen reachable from the dice icon in the header.

---

## 🌐 Web & PWA

The exact same React Native code runs in the browser via **react-native-web**, exported as a static site and deployed on **Vercel**.

- 📲 **Install to home screen** (iOS Safari / Android Chrome) → standalone app, no browser chrome.
- 🛜 **Offline-capable.** A custom service worker (`public/sw.js`) does network-first for HTML and stale-while-revalidate for assets, so it opens offline after the first load.
- 🎯 **Edge-to-edge polish.** `app/+html.tsx` tunes the iOS standalone viewport (`viewport-fit=cover`, opaque status bar, safe-area-aware layout).
- 🔁 **Cache busting.** Bump `CACHE_VERSION` in `public/sw.js` on every deploy to evict stale shells. Keep `manifest.json` `background_color`/`theme_color` equal to the default background (`#f4f6f9`); the running app then updates `theme-color` to the active palette.
- ⌨️ **iOS details.** Inputs are 16px or larger (no zoom on focus), sticky buttons ride above the keyboard via `visualViewport`, and safe-area insets are applied to bars, sheets, and the lock screen.

```bash
npm run web                 # local dev in the browser
npx expo export -p web      # static build → ./dist  (Vercel build command)
```

> ⚠️ Web/PWA storage is **per-origin and separate from the native app** — there's no sync. Move data with Settings → Export (native) → Import (PWA).

---

## 🧱 Architecture

```
app/                            # routes only: screens stay thin
├── _layout.tsx                 # ErrorBoundary > GestureHandler > SafeArea > Locale > Theme > Prefs >
│                               #   Toast > Calculator > Pin > Categories > Data
├── +html.tsx                   # web-only HTML shell (PWA meta, pre-paint theme, SW register)
├── index.tsx                   # transaction form (add/edit), 4 types, date/return/prefill params
├── account-detail.tsx          # per-account view for an exact range
├── category-detail.tsx         # per-category view for an exact range + 6-period trend
├── settings/                   # accounts, categories, budgets, appearance, security, data,
│                               #   preferences, about
└── (main)/                     # 5 tabs: dashboard, calendar, report, history, settings (gacha is a root stack screen)

components/                     # grouped by domain, not by file type
├── ui/                         #   Screen, Card, Button, SegmentedControl, Chip, Sheet, ListRow,
│                               #   SectionGroup, Switch, SearchField, IconBadge, ProgressBar, StatTile...
├── brand/                      #   Logo (vector, react-native-svg)
├── transaction/                #   TransactionItem, TypeToggle, AmountInput, CategoryGrid,
│                               #   DateSheet, MoveToDateSheet
├── dashboard/                  #   RangeFilter, PaceCard, BudgetsCard, QuickAddRow, BackupNudge...
├── calendar/                   #   MonthGrid (shared with DateSheet), MonthSummary
├── report/                     #   RangeNav, TrendMini, BucketDetail
├── history/                    #   FilterSheet, ActiveFilters, filters.ts
├── settings/                   #   AccountSheet, CategorySheet, BudgetSheet
├── calculator/                 #   Calculator, CalculatorProvider
├── security/                   #   PinLockScreen, Keypad, PinDots, PinManager
├── account/ charts/ feedback/  #   pickers, bar/donut charts, Toast, ConfirmModal, WhatsNewSheet...

context/                        # Data, Prefs, Categories, Theme, Toast, Pin
hooks/                          # useTheme, useToast, usePin, useStreak, useCalculator, useKeyboardInset,
                                #   useCategoryUsage, useTransactionActions (delete + move, with undo)
utils/
├── storage.ts  migrations.ts   #   typed CRUD with per-key write chains; schema v3
├── date.ts  period.ts          #   local-calendar helpers; DateRange math incl. custom ranges
├── aggregate.ts  report.ts     #   money rules; buildReport() in one pass
├── calc.ts  csv.ts             #   calculator engine; CSV export
├── haptics.ts  contrast.ts     #   guarded haptics; WCAG contrast
└── format.ts  streak.ts  id.ts  pin.ts

constants/                      # theme.ts (palettes + tokens), brand.ts, categories.ts, accountTypes.ts
scripts/                        # gen-icons.mjs, check-contrast.mjs
assets/brand/                   # logo.svg, logo-mark.svg (masters)
public/                         # manifest.json, sw.js, icons/  (the PWA payload)
```

### Design tokens and themes

`constants/theme.ts` is the single source of visual truth: eight palettes (each with a full light and
dark token set, including semantic income/expense/transfer/adjustment and chart colors), a 4pt
`spacing` scale, `radius`, a paired `fontSize`/`lineHeight`/`weight` type scale (with `input: 16` as
the floor for text fields), `elevation` levels 0-4, `motion` durations, and the 44pt `HIT_SIZE`
minimum. Components never hardcode a hex, a size, or a duration. `npm run check:contrast` verifies
WCAG AA for every palette and mode.

The logo is `assets/brand/logo.svg`; `npm run icons` renders every app, PWA, maskable, and favicon
size from it. New icons need a native rebuild (`eas build`); OTA updates cannot change them.

### Data model (the whole thing)

```ts
interface Transaction {
  id: string;             // genId('t')
  type: 'income' | 'expense' | 'transfer' | 'adjustment';
  amount: number;         // IDR, integer, always positive
  categoryId: string;     // reserved ids: 'transfer', 'adjustment'
  accountId: string;      // source account
  toAccountId?: string;   // transfers only — destination
  direction?: 'in' | 'out'; // adjustments only — which way the balance moves
  note: string;
  date: string;           // ISO timestamp
  dayKey: string;         // local YYYY-MM-DD, set at write time — the bucketing key
}

interface Account { id: string; name: string; typeId: string; startingBalance: number }
interface CustomCategory { id: string; name: string; type: 'income' | 'expense'; iconId: string }
interface Budget { categoryId: string; monthly: number }   // v2
```

**How each type counts**

| Type | Account balance | Income / expense / net | Categories & charts |
|---|---|---|---|
| `income` | `+amount` | counts as income | yes |
| `expense` | `-amount` | counts as expense | yes |
| `transfer` | `-amount` on source, `+amount` on destination | ignored (money you already had) | no |
| `adjustment` | `±amount` by `direction` | **ignored** | no — shown in its own report section |

Persistence keys live under the `nw.*` namespace:
`nw.transactions`, `nw.accounts`, `nw.customCategories`, `nw.budgets`, `nw.lastAccount`, `nw.theme` (palette + mode; legacy `nw.themeMode` is still read), `nw.prefs`, `nw.locale`, `nw.historyPrefs`, `nw.balanceHidden`, `nw.calcHistory`, `nw.whatsNewSeen`, `nw.schemaVersion` (currently 3), plus PIN/recovery hashes (`nw.pin.*`).

### State flow & concurrency

- **Single source of truth.** Screens never call `getTransactions` / `getAccounts` directly — they read `useData()`. The cache hydrates once after `runMigrations()` and exposes derived indexes (`txByDay`, `accountsById`, `balances`, `totalBalance`, `txDates`) so screens don't rescan the list.
- **Optimistic + rollback.** `addTx` / `updateTx` / `deleteTx` / `saveAccounts` update the cache immediately, persist async, and revert on a storage failure.
- **Order is a stored invariant.** The list is kept newest-first by **sorted insert** on write, so a back-dated entry lands in its chronological place instead of jumping to the top.
- **No write races.** `utils/storage.ts` serializes every read-modify-write through **per-key Promise chains** (`tx`, `account`, `category`).

### Performance notes

- `Intl.NumberFormat` / `DateTimeFormat` instances are **built once and cached** (dropped on locale change) — `toLocaleString` per row was the hottest cost in long lists.
- Category lookup is a **Map**, not an array scan, because it runs once per rendered row.
- Lists pass `getItemLayout` (rows are a fixed 88pt) plus windowing options, so FlatList skips measurement entirely.
- `buildReport()` walks the transaction array **once** and fills every accumulator — the Report screen's cost is O(transactions + accounts) no matter how many sections it grows.

---

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, plus Expo Go (phone) or an emulator/simulator.

```bash
git clone https://github.com/your-username/nabung-woi.git
cd nabung-woi
npm install
npm start          # Expo dev menu — scan the QR with Expo Go
```

### Platform runs

```bash
npm run android    # Android emulator
npm run ios        # iOS simulator (macOS only)
npm run web        # browser (react-native-web)
npm run typecheck        # the static gate, keep it green
npm run check:contrast   # WCAG AA for every palette
npm run icons            # regenerate icons from assets/brand/*.svg
```

> No linter, formatter, or test runner is wired up. `npm run typecheck` plus `npx expo export -p web` are the gates.
> On Node 22+ the checker can blow the default V8 stack; if `npx tsc --noEmit` dies with
> `RangeError: Maximum call stack size exceeded`, run
> `node --stack-size=16000 ./node_modules/typescript/lib/_tsc.js --noEmit` instead.

### Native production builds (EAS)

```bash
eas build -p android --profile preview      # sideload-able .apk
eas build -p android --profile production   # .aab for Play Store
eas build -p ios     --profile production
```

JS-only changes can ship over-the-air without a rebuild (runtime version pinned to `appVersion`):

```bash
eas update --channel preview --message "fix: …"
```

> Adding a **native module** (e.g. biometrics) needs a full rebuild — OTA won't carry it.

---

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| Runtime | **React Native 0.88** (New Architecture only — Fabric + TurboModules) |
| Meta-framework | **Expo 58** + **Expo Router 58** (file-based) |
| Language | **TypeScript 6.0** (strict) |
| Persistence | **AsyncStorage** (native) / `localStorage` (web) — no remote backend |
| State | React Context + an in-memory `DataContext` cache with derived indexes |
| Web | **react-native-web** static export → Vercel + custom service worker |
| OTA / updates | **expo-updates** (`appVersion` runtime policy) |
| Charts | `react-native-gifted-charts` (donut) + hand-rolled bar/ranked charts |
| Animations | `react-native-reanimated` v4 + `react-native-worklets` |
| Bottom sheets | Modal-based `ui/Sheet` (same on native and web) |
| Gestures / Icons | `react-native-gesture-handler` · `lucide-react-native` |
| Date input | Custom `DateSheet` (month grid, same on every platform) |
| Crypto | pure-JS salted SHA-256 in `utils/pin.ts` |

---

## 🔒 Security Model

- **PIN gate.** 4–8 digit PIN, salted + stretched SHA-256, stored as a hash. Settings → Security.
- **Recovery.** Optional recovery question + answer (also salted-hashed). If forgotten, the only escape is wiping data.
- **Auto re-lock.** Configurable in Settings, Security: immediately, 30 s, 1 min (default), 5 min, or never.
- **Lock-ahead.** `PinLockScreen` renders _before_ the navigation stack while locked — no peeking via deep-links.
- **Hide-balance.** A glance-protection toggle for shoulder-surfing; orthogonal to the PIN.

### Known limitations (be honest)

- AsyncStorage / `localStorage` is **not encrypted at rest**. The PIN protects the UI, not the bytes.
- No biometric unlock yet — PIN only (see roadmap).
- No remote backup or cross-device sync. Use Export/Import.

---

## 🗂️ Data Export, Import & Wipe

- **Export.** Settings → Data → Export dumps every transaction, account, and custom category as one JSON blob (share/save on native, download/clipboard on web).
- **Import.** Paste or pick exported JSON to restore; it **merges** by id and never deletes existing rows. Orphan transactions (pointing at deleted accounts) are dropped and reported.
- **Wipe.** Settings, Data, Clear all data removes transactions, accounts, categories, and budgets (theme and language stay). Irreversible, so back up first.
- **CSV.** Report, Export this range as CSV, for spreadsheets.
- **Backup reminder.** The dashboard nudges after 30 days without an export.

---

## 📐 Code Conventions

- **Hooks over prop drilling.** `useTheme()`, `useToast()`, `usePin()`, `useCalculator()`, `useData()`.
- **Never read storage from a screen.** Go through `useData()` so the cache stays the single source of truth and rollbacks work.
- **Always pass `dayKey: isoDay(date)`** when persisting a transaction.
- **Compose from `components/ui/`** — new screens use `Screen`, `Card`, `Button`, `SegmentedControl`, `Sheet`, `StatTile` rather than re-styling raw views.
- **Tokens only.** Pull color/spacing/type/elevation/motion from `constants/theme.ts`; no literal hexes or magic sizes.
- **Touch targets ≥44pt**, and every `Pressable` gets `accessibilityRole` + `accessibilityLabel` (plus `accessibilityState` when it can be selected).
- **IDs:** `genId()` from `utils/id.ts` — never `Date.now().toString()`.
- **Money:** `formatIDR()` / `formatIDRCompact()` / `formatIDRSigned()` — never `toLocaleString`.
- **Memoize derived state** with the right deps; keep heavy aggregation in `utils/`, not in JSX.
- **Stylesheets:** per-component `StyleSheet.create`, wrapped in `useMemo([colors])` when palette-dependent.

---

## 🗺️ Roadmap

- [ ] Biometric unlock (Face ID / fingerprint via `expo-local-authentication`, native builds only)
- [ ] Encrypted storage layer (`expo-secure-store` for keys / SQLCipher)
- [x] Per-category budgets (2.0)
- [x] CSV export alongside JSON (2.0)
- [ ] Recurring transactions and reminders
- [ ] Accent color override per palette
- [ ] Opt-in cloud backup (iCloud / Google Drive)
- [ ] Multi-currency

---

## 🤝 Contributing

PRs welcome. Keep diffs scoped, run the type check before pushing, and match the convention notes above. Open an issue first for anything touching the data model or storage shape.

---

## 📜 License

MIT — see [LICENSE](./LICENSE) if present, otherwise: do what you want, no warranty.

---
