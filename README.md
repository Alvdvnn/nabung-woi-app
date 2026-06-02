# Nabung Woi 💸

> **Nabung** _(verb, Indonesian)_ — to save money. **Woi** _(interjection)_ — hey!
>
> An offline-first personal finance tracker for the rupiah-spending crowd. One codebase ships a native **Android/iOS app** _and_ an installable **PWA** — same buttery dark/light UI, same PIN gate, zero backend. No accounts, no cloud, no ads. Your money data never leaves your device.

<p align="center">
  <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white" alt="Expo"></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=white" alt="React Native"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9%20strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://reactnative.dev/architecture/landing-page"><img src="https://img.shields.io/badge/New%20Architecture-on-success" alt="New Architecture"></a>
  <a href="#-web--pwa"><img src="https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white" alt="PWA"></a>
  <a href="#-license"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License"></a>
</p>

---

## ✨ Highlights

- 🏦 **Offline-first, local-only.** AsyncStorage (native) / `localStorage` (web) is the entire backend. No sign-up, no servers, no telemetry.
- ⚡ **Instant UI via a shared in-memory cache.** `DataContext` holds transactions + accounts once; every screen reads from it. Mutations are **optimistic with rollback** — taps feel instant, failures self-heal.
- 🙈 **Hide-balance mode.** One tap on the eye toggle masks your total _and_ every per-account balance (`Rp ******`) — safe to open in public. Choice persists.
- 📊 **Real dashboards, not just a list.** Per-account cards, period totals (day/month/year), top categories, and an interactive donut chart (`react-native-gifted-charts`).
- 📅 **Calendar drill-down.** Tap any day to see what you spent and earned, with dot markers on active days.
- 🔥 **Daily streaks.** Logging discipline rewarded with current + longest streak counters.
- 🎰 **Gacha mode.** A 50/50 "buy it / skip it" wheel for impulse decisions — because sometimes finance is feelings.
- 🔐 **PIN-protected.** Salted SHA-256 PIN gate with a recovery question. Auto re-locks after 60s in the background.
- 🌗 **System-aware theming.** Light, dark, or auto — honors live OS `Appearance` changes.
- 🧮 **In-app calculator.** Do the math in the amount field without leaving the form.
- 🌐 **Bilingual.** English + Bahasa Indonesia, swappable at runtime.
- 🛡️ **Crash-resilient.** Top-level `ErrorBoundary` with tap-to-retry; schema **migrations** run before first read.

---

## 🧭 Timezone-safe by design

Every transaction stores a `dayKey` — a **local-calendar `YYYY-MM-DD`** string computed at write time. All period filtering, streaks, and calendar dots match on `dayKey` strings (`dayKey.startsWith('2026-05')`) instead of re-parsing UTC `Date` objects. Result: totals stay stable across **DST shifts and timezone changes** — your "today" never silently rolls into yesterday on a flight.

---

## 📱 Screens

| Tab | Screen | What it does |
|---|---|---|
| 🏠 | **Dashboard** | Total net balance (with hide toggle), per-account cards, period totals, daily-logging streak, top categories, donut chart |
| 📆 | **Calendar** | Monthly grid with transaction-day markers; tap a date for that day's drilldown |
| 🕘 | **History** | Period-scoped transaction list, type filter (all/income/expense), persisted filter prefs |
| 🎲 | **Gacha** | Spin the impulse-decision wheel |
| ⚙️ | **Settings** | Accounts, categories, theme, language, PIN setup/recovery, JSON export/import, danger-zone wipe |

Plus stack routes:
- `app/index.tsx` — the **transaction add/edit form** (default entry point, FAB target). Keyboard-aware so the note field never hides behind the keyboard.
- `app/account-detail.tsx` — single-account drilldown, scoped to the dashboard's active period
- `app/category-detail.tsx` — category-scoped transaction list with totals

---

## 🌐 Web & PWA

The exact same React Native code runs in the browser via **react-native-web**, exported as a static site and deployed on **Vercel**.

- 📲 **Install to home screen** (iOS Safari / Android Chrome) → standalone app, no browser chrome.
- 🛜 **Offline-capable.** A custom service worker (`public/sw.js`) does network-first for HTML and stale-while-revalidate for assets, so it opens offline after the first load.
- 🎯 **Edge-to-edge polish.** `app/+html.tsx` tunes the iOS standalone viewport (`viewport-fit=cover`, opaque status bar, safe-area-aware layout) so installed PWAs sit flush with the notch and home indicator.
- 🔁 **Cache busting.** Bump `CACHE_VERSION` in `public/sw.js` on every deploy to evict stale shells.

```bash
npm run web                 # local dev in the browser
npx expo export -p web      # static build → ./dist  (Vercel build command)
```

> ⚠️ Web/PWA storage is **per-origin and separate from the native app** — there's no sync between them. Move data with Settings → Export (native) → Import (PWA).

---

## 🧱 Architecture

```
app/
├── _layout.tsx              # Root: ErrorBoundary → GestureHandler → SafeArea → Theme →
│                            #   I18n → BottomSheet → Toast → Calculator → Categories →
│                            #   Data → Pin. PinLockScreen renders ahead of the stack when locked.
├── +html.tsx                # Web-only HTML shell (PWA meta, safe-area viewport, SW register)
├── index.tsx                # Transaction form (add/edit), keyboard-safe
├── account-detail.tsx       # Per-account view (period-linked)
├── category-detail.tsx      # Per-category view
└── (main)/
    ├── _layout.tsx          # Bottom tabs (lucide icons, themed, PWA-safe inset)
    ├── dashboard.tsx        # hide-balance toggle lives here
    ├── calendar.tsx
    ├── history.tsx
    ├── gacha.tsx
    └── settings.tsx

components/                  # Shared UI — Fab, TopBar, CalendarGrid, PieChartCard,
                             #   TransactionItem (memoized), ConfirmModal, PinLockScreen,
                             #   PinManager, SplashIntro, Calculator, Toast, ErrorBoundary, …

context/                     # Global providers — hook-first, no prop drilling
├── DataContext.tsx          #   in-memory tx + account cache, optimistic mutations + rollback
├── ThemeContext.tsx         #   system | light | dark, live Appearance listener
├── ToastContext.tsx         #   FIFO queue + <Toast/> renderer
├── PinContext.tsx           #   PIN gate, 60s background re-lock
└── CategoriesContext.tsx    #   built-in + user-added categories

hooks/                       # useTheme, useToast, usePin, useStreak, useCalculator
utils/
├── storage.ts               #   typed AsyncStorage CRUD, per-key serialized write chains
├── migrations.ts            #   one-shot schema upgrades run before first read
├── aggregate.ts             #   filterByPeriod (dayKey prefix), totalsOf, sumByCategory, accountBalance
├── streak.ts                #   O(N) day-streak math
├── format.ts                #   formatIDR, formatIDRCompact, isoDay helpers
├── id.ts                    #   genId() — collision-resistant (no Date.now() strings)
└── pin.ts                   #   salted SHA-256 PIN + recovery answer

constants/                   # theme.ts (palettes + scales), categories.ts, accountTypes.ts, layout.ts
i18n/                        # index.tsx (<I18nProvider/> + useT), dicts.ts (en + id), labels.ts (typed)
public/                      # manifest.json, sw.js, icons/  — the PWA payload
```

### Data model (the whole thing)

```ts
interface Transaction {
  id: string;           // genId('t')
  type: 'income' | 'expense';
  amount: number;       // IDR, integer
  categoryId: string;
  accountId: string;
  note: string;
  date: string;         // ISO timestamp
  dayKey: string;       // local YYYY-MM-DD, set at write time — the bucketing key
}

interface Account {
  id: string;
  name: string;
  typeId: string;       // cash | bank | e-wallet | …
  startingBalance: number;
}

interface CustomCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  iconId: string;
}
```

Persistence keys live under the `nw.*` namespace:
`nw.transactions`, `nw.accounts`, `nw.customCategories`, `nw.lastAccount`, `nw.themeMode`, `nw.locale`, `nw.historyPrefs`, `nw.balanceHidden`, plus PIN/recovery hashes (`nw.pin.*`).

### State flow & concurrency

- **Single source of truth.** Screens never call `getTransactions` / `getAccounts` directly — they read `useData()` / `useTransactions()` / `useAccounts()`. The cache hydrates once after `runMigrations()`.
- **Optimistic + rollback.** `addTx` / `updateTx` / `deleteTx` / `saveAccounts` update the cache immediately, persist async, and revert the cache on a storage failure.
- **No write races.** `utils/storage.ts` serializes every read-modify-write through **per-key Promise chains** (`tx`, `account`, `category`), so rapid double-taps can't clobber each other.

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
| Runtime | **React Native 0.81** (New Architecture: Fabric + TurboModules) |
| Meta-framework | **Expo 54** + **Expo Router 6** (file-based) |
| Language | **TypeScript 5.9** (strict) |
| Persistence | **AsyncStorage** (native) / `localStorage` (web) — no remote backend |
| State | React Context + an in-memory `DataContext` cache |
| Web | **react-native-web** static export → Vercel + custom service worker |
| OTA / updates | **expo-updates** (`appVersion` runtime policy) |
| Charts | `react-native-gifted-charts` (donut) |
| Animations | `react-native-reanimated` v4 + `react-native-worklets` |
| Bottom sheets | `@gorhom/bottom-sheet` v5 |
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

- AsyncStorage / `localStorage` is **not encrypted at rest**. The PIN protects the UI, not the bytes. Rooted/jailbroken devices can read the JSON directly.
- No biometric unlock yet — PIN only (see roadmap).
- No remote backup or cross-device sync. Use Export/Import.

---

## 🗂️ Data Export, Import & Wipe

- **Export.** Settings → Data → Export dumps every transaction, account, and custom category as one JSON blob (share/save on native, download/clipboard on web).
- **Import.** Paste exported JSON to restore. Orphan transactions (pointing at deleted accounts) are dropped and reported.
- **Wipe.** Settings → Danger Zone clears every `nw.*` key. Irreversible — back up first.

---

## 📐 Code Conventions

- **Hooks over prop drilling.** `useTheme()`, `useToast()`, `usePin()`, `useCalculator()`, `useData()`.
- **Never read storage from a screen.** Go through `useData()` so the cache stays the single source of truth and rollbacks work.
- **Always pass `dayKey: isoDay(date)`** when persisting a transaction.
- **IDs:** `genId()` from `utils/id.ts` — never `Date.now().toString()`.
- **Money:** `formatIDR()` / `formatIDRCompact()` — never `toLocaleString`.
- **Memoize derived state** with the right deps — the dashboard depends on it for snappy period toggles.
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

PRs welcome. Keep diffs scoped, run `npx tsc --noEmit` before pushing, and match the convention notes above. Open an issue first for anything touching the data model or storage shape.

---

## 📜 License

MIT — see [LICENSE](./LICENSE) if present, otherwise: do what you want, no warranty.

---

<sub>Built with 🍜 and discipline. Nabung dulu, baru nabung lagi.</sub>
