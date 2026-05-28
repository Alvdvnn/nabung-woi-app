# Nabung Woi 💸

> **Nabung** _(verb, Indonesian)_ — to save money. **Woi** _(interjection)_ — hey!
>
> A no-nonsense, offline-first personal finance tracker for the rupiah-spending crowd. Built with React Native + Expo, wrapped in a buttery dark/light theme, and locked down with a PIN gate. No accounts, no cloud, no ads — your money data never leaves your phone.

[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![New Architecture](https://img.shields.io/badge/New%20Architecture-enabled-success)](https://reactnative.dev/architecture/landing-page)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#license)

---

## ✨ Highlights

- 🔐 **Local-only & PIN-protected.** AsyncStorage is the entire backend. Salted SHA-256 PIN gate with a recovery question. Re-locks after 60 seconds in the background.
- 📊 **Real dashboards, not just a list.** Per-account cards, period totals (day/month/year), top categories, and an interactive pie chart powered by `react-native-gifted-charts`.
- 📅 **Calendar drill-down.** Tap any day to see what you spent and earned, with dot markers on active days.
- 🔥 **Daily streaks.** Logging discipline rewarded with a current and longest streak counter.
- 🎰 **Gacha mode.** A 50/50 "buy it / skip it" wheel for impulse decisions — because sometimes finance is feelings.
- 🌗 **System-aware theming.** Light, dark, or auto. Honors OS-level `Appearance` changes live.
- 🧮 **In-app calculator.** Tap the amount field, do the math, paste the result — without leaving the form.
- 🌐 **Bilingual.** English + Bahasa Indonesia via `i18n/dicts.ts`.
- ⚡ **New Architecture on.** Fabric + TurboModules + Reanimated v4 worklets.

---

## 📱 Screens

| Tab | Screen | What it does |
|---|---|---|
| 🏠 | **Dashboard** | Total net balance, per-account balance cards, period totals, daily-logging streak, top-3 categories row, full pie chart |
| 📆 | **Calendar** | Monthly grid with transaction-day markers; tap a date for the day's drilldown |
| 🕘 | **History** | Chronological transaction list, filter by type (all/income/expense), swipe-to-delete |
| 🎲 | **Gacha** | Spin the impulse-decision wheel |
| ⚙️ | **Settings** | Accounts, categories, theme, PIN setup/recovery, data export, danger-zone wipe |

Plus modal/stack routes:
- `app/index.tsx` — the **transaction add/edit form** (default entry point when the FAB is hit)
- `app/account-detail.tsx` — single-account drilldown with that account's transactions
- `app/category-detail.tsx` — category-scoped transaction list with totals

---

## 🧱 Architecture

```
app/
├── _layout.tsx              # Root stack — wraps GestureHandler, SafeArea, Theme,
│                            #   BottomSheet, Toast, Calculator, Pin, Categories
├── index.tsx                # Transaction form (add/edit)
├── account-detail.tsx       # Per-account view
├── category-detail.tsx      # Per-category view
└── (main)/
    ├── _layout.tsx          # Bottom tabs (lucide icons, themed)
    ├── dashboard.tsx
    ├── calendar.tsx
    ├── history.tsx
    ├── gacha.tsx
    └── settings.tsx

components/                  # 23 shared UI pieces (Fab, CalendarGrid, PieChartCard,
                             #   PinLockScreen, SplashIntro, Calculator, Toast, …)

context/                     # Global providers — hook-first, no prop drilling
├── ThemeContext.tsx         #   system | light | dark, Appearance listener
├── ToastContext.tsx         #   queue + <Toast/> renderer
├── PinContext.tsx           #   PIN gate, 60s background re-lock
└── CategoriesContext.tsx    #   built-in + user-added categories

hooks/
├── useTheme.ts              #   colors, spacing, radius, fonts, shadows
├── useToast.ts
├── useStreak.ts             #   current + longest day streak
└── useCalculator.ts         #   in-form calc sheet

utils/
├── storage.ts               #   AsyncStorage CRUD, serialized write chain (no race)
├── aggregate.ts             #   filterByPeriod, totalsOf, sumByCategory, accountBalance
├── streak.ts                #   day-streak math
├── format.ts                #   formatIDR, formatIDRCompact, ISO day helpers
├── id.ts                    #   genId() — collision-resistant (no Date.now() strings)
└── pin.ts                   #   salted SHA-256 PIN + recovery answer

constants/
├── theme.ts                 #   light/dark palettes, spacing, radius, shadow tokens
├── categories.ts            #   default income/expense categories
├── accountTypes.ts          #   account type catalog
└── layout.ts                #   shared layout constants (FAB clearance, etc.)

i18n/
├── index.tsx                #   <I18nProvider/> + useT()
├── dicts.ts                 #   en + id dictionaries
└── labels.ts                #   typed key catalog
```

### Data model (the whole thing)

```ts
interface Transaction {
  id: string;           // genId()
  type: 'income' | 'expense';
  amount: number;       // IDR, integer
  categoryId: string;
  accountId: string;
  note: string;
  date: string;         // ISO day
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

Persistence keys all live under the `nw.*` namespace inside AsyncStorage:
`nw.transactions`, `nw.accounts`, `nw.customCategories`, `nw.lastAccount`, `nw.themeMode`, `nw.locale`, plus PIN/recovery hashes.

### Concurrency

`utils/storage.ts` serializes every read-modify-write through a Promise chain, so rapid double taps on the FAB or back-to-back delete swipes can't clobber each other. The chain is fire-and-forget at the call site (`addTransaction`, `updateTransaction`, `deleteTransaction`).

---

## 🚀 Quick Start

**Prerequisites**
- Node.js 18+
- Expo Go on your phone (Android: Play Store / iOS: App Store) — _or_ an Android emulator / iOS simulator

```bash
git clone https://github.com/your-username/nabung-woi.git
cd nabung-woi
npm install
npm start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

### Platform-specific runs

```bash
npm run android   # Android emulator
npm run ios       # iOS simulator (macOS only)
npm run web       # browser (react-native-web)
```

### Type check

```bash
npx tsc --noEmit
```

There is no linter, formatter, or test runner wired up — `tsc --noEmit` is the only static gate. Keep it green.

### Production builds

Use EAS:

```bash
npx eas build --platform android
npx eas build --platform ios
```

---

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| Runtime | **React Native 0.81.5** (New Architecture: Fabric + TurboModules) |
| Meta-framework | **Expo 54** + **Expo Router 6** (file-based) |
| Language | **TypeScript 5.9** (strict) |
| Persistence | **AsyncStorage 2.2** (single source of truth, no remote backend) |
| State | React Context (`Theme`, `Toast`, `Pin`, `Calculator`, `Categories`) |
| Charts | `react-native-gifted-charts` (pie) |
| Animations | `react-native-reanimated` v4 + `react-native-worklets` |
| Bottom sheets | `@gorhom/bottom-sheet` v5 |
| Gestures | `react-native-gesture-handler` |
| Icons | `lucide-react-native` |
| Date input | `@react-native-community/datetimepicker` |
| Haptics | `expo-haptics` |
| Gradients | `expo-linear-gradient` |
| Crypto | `expo-crypto` via `utils/pin.ts` (SHA-256) |

---

## 🎨 Theming

`constants/theme.ts` exposes:
- Light + dark color palettes (`bg`, `card`, `text`, `textMuted`, `primary`, `success`, `danger`, `border`, …)
- `spacing` scale, `radius` scale, `fontSize` scale
- A shared `cardShadow` token

Components consume colors via `useTheme()` and wrap interpolated `StyleSheet.create` in `useMemo([colors])`.

`ThemeContext` listens to `Appearance.addChangeListener` so flipping system theme updates the app in real time without a reload.

---

## 🔒 Security Model

- **PIN gate.** 4-digit PIN, salted SHA-256, stored as hash. Configured in Settings → Security.
- **Recovery.** Optional recovery question + answer (also salted-hashed). If forgotten, the only escape is wiping data.
- **Auto re-lock.** App moves to background → 60 second timer → next foreground re-prompts.
- **Splash gate.** `PinLockScreen` is rendered _ahead_ of the navigation stack while locked — UI cannot be peeked through deep-links.

### Known limitations (be honest with yourself)

- AsyncStorage is **not encrypted at rest**. The PIN protects the UI, not the bytes on disk. Rooted / jailbroken devices can read the JSON directly.
- No biometric (Face ID / fingerprint) unlock yet — PIN only.
- No remote backup. Use Settings → Export to dump JSON yourself.

---

## 🗂️ Data Export & Wipe

- **Export.** Settings → Data → Export dumps every transaction, account, and custom category as a single JSON blob you can save off-device.
- **Import.** Paste a previously exported JSON to restore (replaces current data).
- **Wipe.** Settings → Danger Zone clears every `nw.*` AsyncStorage key. Cannot be undone — back up first.

---

## 📐 Code Conventions

- **Hooks over prop drilling.** Reach for `useTheme()`, `useToast()`, `usePin()`, `useCalculator()`.
- **IDs.** Always `genId()` from `utils/id.ts`. Never `Date.now().toString()`.
- **Money.** Always `formatIDR()` / `formatIDRCompact()`. Never `Number.prototype.toLocaleString`.
- **Memoize derived state.** Especially on the dashboard — period toggling must not re-compute everything synchronously.
- **Scroll containers.** Prefer `ScrollView` over a horizontal `FlatList` nested inside another scroll view.
- **Stylesheets.** Per-component `StyleSheet.create`; wrap in `useMemo([colors])` when palette-dependent.

---

## 🗺️ Roadmap

- [ ] Biometric unlock (Face ID / fingerprint via `expo-local-authentication`)
- [ ] Optional encrypted storage layer (SQLCipher / `expo-secure-store` for keys)
- [ ] Recurring transactions
- [ ] Budgets per category with progress rings
- [ ] CSV export alongside JSON
- [ ] iCloud / Google Drive backup hook (opt-in)
- [ ] Multi-currency

---

## 🤝 Contributing

PRs welcome. Keep diffs scoped, run `npx tsc --noEmit` before pushing, and match the existing convention notes above. Open an issue first for anything that touches the data model or storage shape.

---

## 📜 License

MIT — see [LICENSE](./LICENSE) if present, otherwise: do what you want, no warranty.

---

<sub>Built with 🍜 and discipline. Nabung dulu, baru nabung lagi.</sub>
