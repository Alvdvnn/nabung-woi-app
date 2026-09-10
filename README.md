# Nabung Woi 💸

> **Nabung** _(verb, Indonesian)_ — to save money. **Woi** _(interjection)_ — hey!
>
> An offline-first personal finance tracker for the rupiah-spending crowd. One codebase ships a native **Android/iOS app** _and_ an installable **PWA** — same buttery dark/light UI, same PIN gate, zero backend. No accounts, no cloud, no ads. Your money data never leaves your device.

<p align="center">
  <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-57-000020?logo=expo&logoColor=white" alt="Expo"></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=white" alt="React Native"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.0%20strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://reactnative.dev/architecture/landing-page"><img src="https://img.shields.io/badge/New%20Architecture-on-success" alt="New Architecture"></a>
  <a href="#-web--pwa"><img src="https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white" alt="PWA"></a>
  <a href="#-license"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License"></a>
</p>

---

## ✨ Highlights

- 🏦 **Offline-first, local-only.** AsyncStorage (native) / `localStorage` (web) is the entire backend. No sign-up, no servers, no telemetry.
- ⚡ **Instant UI via a shared in-memory cache.** `DataContext` holds transactions + accounts once, plus prebuilt indexes (by day, by account, live balances). Mutations are **optimistic with rollback**.
- 📊 **A real report tab.** Day / week / month / year, period stepping, vs-previous deltas, savings rate, income-vs-expense trend bars, category and account breakdowns, biggest expenses, and logging habits — all computed in one pass over the data.
- ⚖️ **Balance adjustments.** Correct a balance without polluting your numbers: adjustments move the account balance only and are excluded from income, expense, net, and every chart. Long-press an account card for a two-tap correction.
- 🗓️ **Date carries over.** Pick a day in the calendar, hit **+**, and the form opens on that date — no re-picking.
- ↩️ **Undo delete.** Deleting a transaction offers a 5-second **Undo** that restores it exactly, in its original position.
- 🙈 **Hide-balance mode.** One tap masks the total _and_ every per-account balance (`Rp ******`). Choice persists.
- 📅 **Calendar drill-down.** Dot markers on active days, per-day totals and entry count.
- 🔥 **Daily streaks.** Current + longest streak, with a 7-day pip row.
- 🎰 **Gacha mode.** A 50/50 "buy it / skip it" wheel for impulse decisions (dice icon in the header).
- 🔐 **PIN-protected.** Salted SHA-256 PIN gate with a recovery question. Auto re-locks after 60s in the background.
- 🌗 **System-aware theming.** Light, dark, or auto — honors live OS `Appearance` changes; chart palettes follow the theme.
- ♿ **Accessible by construction.** Every interactive target is ≥44pt, every control carries a role/label/state, and text meets WCAG AA on both palettes.
- 🌐 **Bilingual.** English + Bahasa Indonesia, swappable at runtime.
- 🛡️ **Crash-resilient.** Top-level `ErrorBoundary` with tap-to-retry; schema **migrations** run before the first read.

---

## 🧭 Timezone-safe by design

Every transaction stores a `dayKey` — a **local-calendar `YYYY-MM-DD`** string computed at write time. All period filtering, streaks, report ranges, and calendar dots compare `dayKey` **strings** instead of re-parsing UTC `Date` objects. Totals stay stable across **DST shifts and timezone changes** — your "today" never silently rolls into yesterday on a flight.

---

## 📱 Screens

| Tab | Screen | What it does |
|---|---|---|
| 🏠 | **Dashboard** | Total net balance (with hide toggle), per-account cards (long-press → adjust balance), period totals, streak, top categories, donut chart |
| 📆 | **Calendar** | Monthly grid with transaction-day markers; per-day totals and list; **+** carries the selected date into the form |
| 📊 | **Report** | Day/week/month/year analytics: summary + deltas, savings rate, trend bars, by category, by account, biggest expenses, habits, adjustments |
| 🕘 | **History** | Range-scoped list (day/week/month/year), type filter incl. adjustments, persisted prefs, delete with undo |
| ⚙️ | **Settings** | Accounts, categories, theme, language, PIN setup/recovery, JSON export/import, danger-zone wipe |

Plus stack routes:
- `app/index.tsx` — the **transaction add/edit form** (default entry point). Four types: expense · income · transfer · adjustment. Accepts `?date=YYYY-MM-DD`, `?id=`, `?returnTo=`.
- `app/(main)/gacha.tsx` — the impulse wheel; reachable from the dice icon in the header (kept out of the tab bar so five tabs stay above the 44pt touch minimum).
- `app/account-detail.tsx` — single-account drilldown with an **Adjust balance** action.
- `app/category-detail.tsx` — category-scoped transaction list with totals.

---

## 🌐 Web & PWA

The exact same React Native code runs in the browser via **react-native-web**, exported as a static site and deployed on **Vercel**.

- 📲 **Install to home screen** (iOS Safari / Android Chrome) → standalone app, no browser chrome.
- 🛜 **Offline-capable.** A custom service worker (`public/sw.js`) does network-first for HTML and stale-while-revalidate for assets, so it opens offline after the first load.
- 🎯 **Edge-to-edge polish.** `app/+html.tsx` tunes the iOS standalone viewport (`viewport-fit=cover`, opaque status bar, safe-area-aware layout).
- 🔁 **Cache busting.** Bump `CACHE_VERSION` in `public/sw.js` on every deploy to evict stale shells. Keep `manifest.json` `background_color`/`theme_color` equal to the app background (`#f4f6f9`) or iOS paints a colored band.

```bash
npm run web                 # local dev in the browser
npx expo export -p web      # static build → ./dist  (Vercel build command)
```

> ⚠️ Web/PWA storage is **per-origin and separate from the native app** — there's no sync. Move data with Settings → Export (native) → Import (PWA).

---

## 🧱 Architecture

```
app/                            # routes only — screens stay thin
├── _layout.tsx                 # ErrorBoundary → GestureHandler → SafeArea → Locale → Theme →
│                               #   BottomSheet → Toast → Calculator → Pin → Categories → Data
├── +html.tsx                   # web-only HTML shell (PWA meta, safe-area viewport, SW register)
├── index.tsx                   # transaction form (add/edit), 4 types, date/return params
├── account-detail.tsx          # per-account view + adjust action
├── category-detail.tsx         # per-category view
└── (main)/
    ├── _layout.tsx             # 5 tabs; gacha route hidden from the bar (href: null)
    ├── dashboard.tsx  calendar.tsx  report.tsx  history.tsx  settings.tsx  gacha.tsx

components/                     # grouped by domain, not by file type
├── ui/                         #   Screen, Card, Button, SegmentedControl, FilterChips, Sheet,
│                               #   Skeleton, SectionHeader, StatTile, TopBar, Fab, SplashIntro
├── transaction/                #   TransactionItem (memo, fixed height), TypeToggle,
│                               #   AmountInput (quick-amount chips), CategoryChip, DatePickerField
├── account/                    #   AccountManager, AccountPickerSheet, AdjustBalanceSheet
├── category/                   #   CategoryManager
├── charts/                     #   TrendChart (grouped bars), CategoryBars, PieChartCard
├── report/                     #   RangeNav (+ useRangeLabel)
├── dashboard/                  #   StreakCard, TopCategoriesRow
├── calendar/                   #   CalendarGrid
├── calculator/                 #   Calculator, CalculatorProvider
├── security/                   #   PinLockScreen, PinManager
└── feedback/                   #   Toast (with action button), ConfirmModal, EmptyState, ErrorBoundary

context/                        # global providers — hook-first, no prop drilling
├── DataContext.tsx             #   tx + account cache, indexes, balances, optimistic mutations
├── ThemeContext.tsx            #   system | light | dark, live Appearance listener
├── ToastContext.tsx            #   FIFO queue, optional inline action (Undo)
├── PinContext.tsx              #   PIN gate, 60s background re-lock
└── CategoriesContext.tsx       #   built-in + custom categories, Map-indexed lookup

hooks/                          # useTheme, useToast, usePin, useStreak, useCalculator,
                                #   useTransactionActions (delete + undo)
utils/
├── storage.ts                  #   typed CRUD, per-key serialized write chains, sorted insert
├── migrations.ts               #   one-shot schema upgrades run before the first read (v2)
├── date.ts                     #   pure local-calendar helpers (isoDay, parseIsoDay, startOf*)
├── period.ts                   #   DateRange math: rangeFor/shiftRange/bucketsFor (day…year)
├── aggregate.ts                #   balanceDelta, accountBalances, filterByPeriod/Range,
│                               #   totalsOf, sumByCategory, adjustmentTotals
├── report.ts                   #   buildReport() — the whole Report screen in one pass
├── streak.ts                   #   O(N) day-streak math
├── format.ts                   #   cached Intl formatters: formatIDR, …Compact, …Signed
├── id.ts                       #   genId() — collision-resistant
└── pin.ts                      #   salted SHA-256 PIN + recovery answer

constants/                      # theme.ts (tokens), categories.ts, accountTypes.ts, layout.ts
i18n/                           # index.tsx (<LocaleProvider/> + useT), dicts.ts (en + id), labels.ts
public/                         # manifest.json, sw.js, icons/  — the PWA payload
```

### Design tokens

`constants/theme.ts` is the single source of visual truth — colors (light + dark, incl. semantic
income/expense/transfer/adjustment and theme-aware chart palettes), a 4pt `spacing` scale, `radius`,
a paired `fontSize`/`lineHeight`/`weight` type scale, `elevation` levels 0–4, `motion` durations,
and the 44pt `HIT_SIZE` minimum. Components never hardcode a hex, a size, or a duration.

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
```

**How each type counts**

| Type | Account balance | Income / expense / net | Categories & charts |
|---|---|---|---|
| `income` | `+amount` | counts as income | yes |
| `expense` | `-amount` | counts as expense | yes |
| `transfer` | `-amount` on source, `+amount` on destination | ignored (money you already had) | no |
| `adjustment` | `±amount` by `direction` | **ignored** | no — shown in its own report section |

Persistence keys live under the `nw.*` namespace:
`nw.transactions`, `nw.accounts`, `nw.customCategories`, `nw.lastAccount`, `nw.themeMode`, `nw.locale`, `nw.historyPrefs`, `nw.balanceHidden`, `nw.schemaVersion`, plus PIN/recovery hashes (`nw.pin.*`).

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
npx tsc --noEmit   # the only static gate — keep it green
```

> No linter, formatter, or test runner is wired up. `tsc --noEmit` is it.
> On Node 22+ the checker can blow the default V8 stack; if `npx tsc --noEmit` dies with
> `RangeError: Maximum call stack size exceeded`, run
> `node --stack-size=8000 ./node_modules/typescript/lib/_tsc.js --noEmit` instead.

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
| Runtime | **React Native 0.86** (New Architecture only — Fabric + TurboModules) |
| Meta-framework | **Expo 57** + **Expo Router 57** (file-based) |
| Language | **TypeScript 6.0** (strict) |
| Persistence | **AsyncStorage** (native) / `localStorage` (web) — no remote backend |
| State | React Context + an in-memory `DataContext` cache with derived indexes |
| Web | **react-native-web** static export → Vercel + custom service worker |
| OTA / updates | **expo-updates** (`appVersion` runtime policy) |
| Charts | `react-native-gifted-charts` (donut) + hand-rolled bar/ranked charts |
| Animations | `react-native-reanimated` v4 + `react-native-worklets` |
| Bottom sheets | `@gorhom/bottom-sheet` v5 · plus a Modal-based `ui/Sheet` |
| Gestures / Icons | `react-native-gesture-handler` · `lucide-react-native` |
| Date input | `@react-native-community/datetimepicker` |
| Crypto | pure-JS salted SHA-256 in `utils/pin.ts` |

---

## 🔒 Security Model

- **PIN gate.** 4–8 digit PIN, salted + stretched SHA-256, stored as a hash. Settings → Security.
- **Recovery.** Optional recovery question + answer (also salted-hashed). If forgotten, the only escape is wiping data.
- **Auto re-lock.** Background → 60s timer → next foreground re-prompts.
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
- **Wipe.** Settings → Danger Zone clears every `nw.*` key. Irreversible — back up first.

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
- [ ] Recurring transactions
- [ ] Per-category budgets with progress rings
- [ ] CSV export alongside JSON
- [ ] Opt-in cloud backup (iCloud / Google Drive)
- [ ] Multi-currency

---

## 🤝 Contributing

PRs welcome. Keep diffs scoped, run the type check before pushing, and match the convention notes above. Open an issue first for anything touching the data model or storage shape.

---

## 📜 License

MIT — see [LICENSE](./LICENSE) if present, otherwise: do what you want, no warranty.

---
