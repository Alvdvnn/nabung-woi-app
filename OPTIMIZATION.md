# Nabung Woi — Optimization & Fix Audit

Scope: full app sweep for performance, correctness, and code-quality issues. PIN / encryption topics intentionally **excluded** per request. Use this as a punch list to land before adopting the app for daily use.

Each finding has: **what / where / why it matters / how to fix**. Severity:
- 🔴 **P0** — correctness bug or daily-use blocker.
- 🟠 **P1** — performance / UX wart that gets worse as data grows.
- 🟡 **P2** — code smell, not user-visible.

---

## 1. Critical correctness bugs (P0) — ✅ all fixed

> Landed as `fix(p0): ...` — see commit history.

### 1.1 Timezone drift in date filtering — ✅
- **Where:** `utils/aggregate.ts:5-20` (`filterByPeriod`), `utils/format.ts:34-39` (`isoDay`), `app/index.tsx:122,136` (`selectedDate.toISOString()`).
- **What:** Transactions are persisted as UTC ISO (`toISOString`) but every read path slices them with **local** calendar (`new Date(t.date).getMonth() / getDate()`). On the boundary hours (e.g. you log a 23:30 tx, then travel to a +TZ region, or DST flips), the same tx will jump between days/months. Streak, dashboard period totals, calendar dots, and history filtering all get inconsistent.
- **Fix:** Pick one canonical day key and store it on the transaction. Options:
  1. Store `dayKey` (`YYYY-MM-DD` from `isoDay(selectedDate)`) alongside the existing `date` field at write time; filter on `dayKey` instead of re-parsing.
  2. Or replace `date` with a local-noon ISO (`new Date(y,m,d,12)`) so UTC parse never crosses a boundary.
  - Either way, also stop reparsing `new Date(t.date)` inside the filter hot path.

### 1.2 `StoredThemeMode` is `'light' | 'dark'` only — “system” mode is documented but unimplemented — ✅
- **Where:** `utils/storage.ts:105-111`, `context/ThemeContext.tsx:5,33`, `CLAUDE.md` (says `system | light | dark`).
- **What:** Doc lies. `mode` is the resolved value; there is no Appearance listener as CLAUDE.md claims. Either ship the “system” option or remove the doc claim.
- **Fix:** Add a third option `'system'`; in `ThemeProvider`, subscribe to `Appearance.addChangeListener` and compute `resolved` from `Appearance.getColorScheme()` when `mode === 'system'`. Add a third pill in `AppearanceRow`.

### 1.3 `ToastProvider` drops back-to-back toasts — ✅
- **Where:** `context/ToastContext.tsx:17-27`.
- **What:** Only one `toast` state slot. A second `show()` while the first is still visible overwrites it — the first call’s success/error feedback can vanish before the user sees it. Realistic during rapid import/clear flows.
- **Fix:** Hold a queue (`ToastState[]`) and shift one off when `dismiss()` fires.

### 1.4 `_currentLocale` global mutable, can desync formatters — ✅
- **Where:** `i18n/index.tsx:30-33,60-63`, used by `utils/format.ts:1-5,13-14`.
- **What:** `formatIDR`/`formatDate` reach into a module-level `_currentLocale`. If `setLocale` is invoked before `LocaleProvider`’s effect (or in a server-rendered path), formatters silently use stale value. Also defeats hot-reload determinism.
- **Fix:** Thread locale through props or a tiny `useFormatters()` hook. Or accept the global but make it a `Subject` and require components to subscribe.

### 1.5 `accountTxs` empty when `account` missing → balance silently wrong — ✅
- **Where:** `app/account-detail.tsx:62-69`.
- **What:** If `accountId` no longer exists (e.g. deleted while open), `account` is `undefined` → `currentBalance` returns `0`. But the header still shows the account hero. Misleading.
- **Fix:** Render an explicit “account not found” empty state instead of the hero, or `router.back()` when `accounts.length > 0 && !account`.

---

## 2. Performance issues (P1)

### 2.1 Every screen re-reads the entire transactions JSON on focus — ✅
- **Where:** dashboard / history / calendar / account-detail / category-detail / index — each has its own `useFocusEffect → getTransactions().then(setTxs)`.
- **What:** `getTransactions` does `AsyncStorage.getItem` + `JSON.parse` of the **whole** array every tab switch. With years of daily entries (1000s of rows) this stalls the JS thread for tens of ms per switch and triggers GC.
- **Fix:** Introduce a `TransactionsProvider` (and an `AccountsProvider`) holding the cache in memory with a manual `refresh()` API. Wrap writes (`addTransaction`/`updateTransaction`/`deleteTransaction`) so they update both AsyncStorage **and** the in-memory cache. Replace each screen’s `useFocusEffect` with `const { txs } = useTransactions()`. Net: O(1) reads after first hydrate.

### 2.2 Streak recomputed over **all** transactions every focus — ✅
- **Where:** `hooks/useStreak.ts`, `utils/streak.ts:14-41`.
- **What:** Builds `new Set(txs.map(isoDay(new Date(t.date))))` then sorts; runs whenever the `txs` array reference changes (i.e. every focus). For 1000+ rows this is needless work — current streak only needs the recent N days.
- **Fix:** Short-circuit current streak: scan only descending from today until a day without entries (early break). Cache longest separately, or recompute incrementally on write.

### 2.3 `txDates` Set rebuilt on every calendar render
- **Where:** `app/(main)/calendar.tsx:54`.
- **What:** `new Set(txs.map(isoDay(new Date(t.date))))` — same O(N) every paint. Memoized by `[txs]` but `txs` ref changes every focus.
- **Fix:** Belongs in `TransactionsProvider` as a memoized derived selector.

### 2.4 Heavy `new Date()` parsing inside filter hot paths
- **Where:** `utils/aggregate.ts:6-19`.
- **What:** `new Date(iso)` is one of the slowest hot ops in JS. Three callsites on dashboard (filtered, byCategory, totals each recompute via filtered chain). Combine with #1’s fix and you can compare ISO substrings (`t.date.startsWith('2026-05')`) — ~10× faster and avoids TZ logic.

### 2.5 `accountBalances` recomputed for total balance even when only periods changed
- **Where:** `app/(main)/dashboard.tsx:53-68`.
- **What:** OK as-is, but only re-render trigger should be a tx mutation, not a period toggle. Currently fine because deps are `[accounts, txs]`; verify after introducing `TransactionsProvider`.

### 2.6 FlatList `renderItem` defined inline (re-created each render) — ✅
- **Where:** `app/(main)/history.tsx:218`, `app/account-detail.tsx:264`, `app/category-detail.tsx:248`.
- **What:** Forces FlatList to remount rows on parent re-render. With 100+ rows this is the most common RN scroll-jank source.
- **Fix:** Extract to `useCallback`, memoize the row component (`React.memo(TransactionItem)` — already lightweight, just needs the wrapper). Pass `extraData` only when something outside `item` matters (e.g. account name map updates).

### 2.7 Splash blocks every cold start for 1200 ms — ✅
- **Where:** `components/SplashIntro.tsx:11-13`.
- **What:** Hard delay before app is usable. For daily use that is friction.
- **Fix:** Either trim `HOLD_MS` to ~500, gate on `useEffect`-driven hydration completion (skip if hydration finishes earlier), or skip entirely on subsequent foregrounds within N minutes.

### 2.8 AsyncStorage stores the whole tx list as one JSON blob
- **Where:** `utils/storage.ts` writes.
- **What:** Every add/update/delete re-serializes the **entire** array. Grows linearly with history; at ~5k txs you’ll feel it.
- **Fix:** Medium term, move to SQLite (`expo-sqlite`) or MMKV. Short term: chunk by year (`nw.transactions.2026`, etc.) and load lazily.

### 2.9 `useFocusEffect` chain triggers two sequential `await`s
- **Where:** `index.tsx:67-89` (and elsewhere).
- **What:** Sequential awaits where parallel works. Minor but trivial fix.
- **Fix:** `Promise.all([getAccounts(), getLastAccount(), editId ? getTransaction(editId) : null])`.

### 2.10 Reanimated + `setTimeout` race in `Toast`
- **Where:** `components/Toast.tsx:48-60`.
- **What:** If a new toast preempts the running one (via key change), the timer for the previous toast still fires `runOnJS(onDismiss)` after animation finish — fine in practice because state already moved on. Watch this when introducing the queue from §1.3 (queue must ignore late dismisses).

---

## 3. Bugs & data-integrity issues (P1)

### 3.1 Optimistic delete in `history.tsx` doesn’t roll back on failure — ✅
- **Where:** `app/(main)/history.tsx:104-110`, `app/(main)/calendar.tsx:71-77`.
- **What:** `await deleteTransaction(...)` then local `setTxs` filter. If the AsyncStorage write throws, UI shows the row gone but disk still has it. Next focus restores it — confusing.
- **Fix:** Wrap in try/catch, restore prior state + toast on error.

### 3.2 `importAll` accepts orphan references — ✅
- **Where:** `utils/storage.ts:187-231`.
- **What:** Imported transactions can reference `accountId`/`categoryId` that don’t exist. UI degrades gracefully (`'Unknown account'`) but the data is dirty forever.
- **Fix:** Either drop orphans during merge, or warn the user with a count in the import summary toast.

### 3.3 `AccountManager`/`CategoryManager` read-modify-write without the tx-write chain — ✅
- **Where:** `components/AccountManager.tsx:78-93,95-102`, `components/CategoryManager.tsx:81-99`.
- **What:** Rapid double-tap on Create or Delete can race two `saveAccounts` calls (each builds its own next array from a stale prop) and lose one mutation. Same risk for categories.
- **Fix:** Either disable the button while saving, or extend `enqueueTxWrite` into a generic `enqueueWrite` and use it for all three storage helpers.

### 3.4 `dashboard.tsx:319` and `history.tsx:204` — typed cast hack
- **What:** `` t(`period.${period}` as 'period.day') `` lies to the type checker. Currently safe because all three keys exist, but a future rename would silently break.
- **Fix:** Make `TFn` accept a `Period`-typed branch, or define `PERIOD_LABELS` once and look up.

### 3.5 `index.tsx` — duplicate routing target ladder — ✅
- **Where:** `app/index.tsx:126-127, 151-152`.
- **What:** Same `returnTo === 'calendar' ? ... : 'history' ? ... : '/dashboard'` ladder repeated. Bug-prone if a new return target is added.
- **Fix:** Extract `resolveReturnTarget(returnTo)` helper.

### 3.6 Custom category icon is always `'other'` — ✅
- **Where:** `components/CategoryManager.tsx:83`, `constants/categories.ts` (`CUSTOM_ICON`).
- **What:** UI offers no icon picker, so all custom categories look identical. For daily use this defeats the purpose of having custom categories.
- **Fix:** Either expose a small icon picker grid, or pull the icon name out of the user’s typed name with a simple keyword map (e.g. “grocery” → `ShoppingCart`).

### 3.7 `history` filter state resets to `all` on every mount — ✅
- **Where:** `app/(main)/history.tsx:35-41`.
- **What:** User who always filters by `expense` re-toggles every session. Mild but cumulative.
- **Fix:** Persist filter + period + cursor reset rules to AsyncStorage (`nw.historyPrefs`).

### 3.8 Period `cursor` defaults to first-mount time — ✅
- **Where:** `app/(main)/history.tsx:39`.
- **What:** `useState(new Date())` runs once; tab stays mounted across days. If the app stays open past midnight, history still cursors yesterday.
- **Fix:** On focus, if `period === 'day'` and cursor isn’t today, prompt or auto-reset (or just keep `cursor = new Date()` in a `useFocusEffect`).

### 3.9 `PieChartCard` legend caps at 6, donut shows all — ✅
- **Where:** `components/PieChartCard.tsx:73`.
- **What:** Categories 7+ get a slice with no legend entry. Looks like a bug at a glance.
- **Fix:** Either limit pie data to the same top 6 + “Other” aggregate, or scroll/extend the legend.

### 3.10 `useState(byType('expense')[0].id)` initial assumes defaults exist — ✅
- **Where:** `app/index.tsx:55`.
- **What:** Today `EXPENSE_CATEGORIES` is non-empty so safe, but the assumption is implicit. If someone refactors defaults to optional, this crashes on first render.
- **Fix:** Guard `byType('expense')[0]?.id ?? ''` and gate the form on “you have at least one expense category”.

---

## 4. Bad approaches (P2)

### 4.1 Multiple provider wrapping creates hydration cascade
- **Where:** `app/_layout.tsx:46-67`.
- **What:** `LocaleProvider`, `ThemeProvider`, `PinProvider` each gate render with `if (!hydrated) return null`. Three sequential null-renders cause a brief blank flash before the splash logo appears.
- **Fix:** Hydrate in parallel inside a single root effect, or render the splash *unconditionally* and reveal app once all providers report ready.

### 4.2 Shadowed `t` identifiers — ✅
- **Where:** `history.tsx:216`, `category-detail.tsx:205`, plus `dayTxs.filter((t) => …)` in `calendar.tsx:56`, `totalsOf` in `aggregate.ts`.
- **What:** `keyExtractor={(t) => t.id}` and arrow params named `t` shadow the imported `useT()` translate fn — readability hazard and a real bug waiting to happen the moment someone moves a `t('…')` inside one of those closures.
- **Fix:** Rename callback args to `tx` / `item`.

### 4.3 `Symbol` interface shadows the global — ✅
- **Where:** `app/(main)/gacha.tsx:27`.
- **What:** Local `interface Symbol { … }` shadows the JS built-in. Harmless today, deeply confusing for any future maintainer using `Symbol.for(...)`.
- **Fix:** Rename to `ReelSymbol`.

### 4.4 `flex1` style duplicate of `flex` — ✅
- **Where:** `app/index.tsx:157-158`.
- **What:** Two style entries with identical value (`{ flex: 1 }`). Dead code.

### 4.5 `style={{ flex: 1 }}` inline objects
- **Where:** scattered (`Toast.tsx:72` parent, `account-detail.tsx:216,254`, `dashboard.tsx:269`, etc.).
- **What:** Inline style object => new identity each render, defeats StyleSheet caching. Negligible per use but a habit worth breaking.
- **Fix:** Promote to a static `StyleSheet` entry.

### 4.6 `genId` is `Date.now()` + 6 chars of `Math.random()` — ✅ (documented)
- **Where:** `utils/id.ts:1-5`.
- **What:** Acceptable for single-device, but two rapid-fire imports of the same file would re-merge correctly (id-keyed). Collision risk on import of foreign exports though — a friend’s export with overlapping `t<base36>` could clobber yours.
- **Fix:** Bump randomness to 10 chars or namespace by device (`a${deviceId}_…`). Or accept it — single-user phone.

### 4.7 `useCallback` on `t` with eslint-disabled deps
- **Where:** `i18n/index.tsx:62-68`.
- **What:** No eslint configured so nothing yelled, but `t` is `useCallback`d with `[locale]` and the body references `locale` and `DICTS` only. Fine. Worth noting if you add eslint.

### 4.8 No error boundary anywhere — ✅
- **Where:** root layout.
- **What:** Any runtime throw in a screen drops the whole app to red-screen in dev / blank in prod. For daily use, even a “something went wrong, tap to reload” fallback would save you.
- **Fix:** Add one `<ErrorBoundary>` wrapping `<ThemedStack/>`.

### 4.9 Inline routing strings — no type-safe routes
- **Where:** `router.push('/dashboard')`, `'/account-detail'`, etc., scattered everywhere.
- **What:** Expo Router supports typed routes (`experiments.typedRoutes: true` in `app.json`). Without it, a route rename silently produces 404s in nav.

### 4.10 `KeyboardAvoidingView` with `behavior='height'` on Android — ✅
- **Where:** `app/index.tsx:228`.
- **What:** `'height'` is buggy on Android — Compose keyboard insets are handled by the new arch already. Often safer to use `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` and rely on `softwareKeyboardLayoutMode: 'pan'`.

### 4.11 `setTimeout(scrollToEnd, 100)` for keyboard focus — ✅
- **Where:** `app/index.tsx:282`.
- **What:** Fragile — depends on the keyboard animation racing the scroll. Sometimes scrolls before the keyboard opens, sometimes lands wrong.
- **Fix:** Listen to `Keyboard.addListener('keyboardDidShow', ...)` and scroll then.

---

## 5. Code-quality nits (P2)

- `formatDate` builds a `new Date(iso)` every call. For long lists, cache by iso → formatted in a `Map` (or do it inside the row memo).
- `byType(type)` in `CategoriesContext.tsx:35-55` rebuilds default+custom arrays on every render even though `customCats`/locale haven’t changed for that frame — already memoized via `useMemo`, but every consumer also calls `byType(type)` inside its own `useMemo([byType, type])`. Replace with `byType` returning a cached object keyed by `type`.
- `useT` returns a non-memoized function reference per render via `useCallback([locale])` — fine, but consumers commonly put `t` in dep arrays (e.g. `[colors, t]`) which causes their `useMemo` to re-run only on locale change (correct). Just be aware.
- `FILTERS` array recreated in `history.tsx:43` every render. Move out or memoize.
- `expoConfig?.version` shown in splash but app version is also useful in Settings → About; consider exposing.
- `gacha.tsx:33` `SYMBOLS` const is module-scope (good), but the strip arrays in state are deep-equal regenerated on every spin → fine, but they could be created on `useRef` and mutated.
- `accountTxs` sort is recomputed on every render of account-detail (memoized by `[txs, accountId]`). With the cache from §2.1, this stops being a hot path.
- `Toast.tsx` imports both `Animated from react-native-reanimated` and uses `Pressable` from `react-native` directly — fine. Note that haptics fire **inside** the animation effect; if a parent re-mounts the Toast (key change), haptics double-fire.
- `index.tsx` has a `flex` style on `KeyboardAvoidingView` but the parent `SafeAreaView` already sets `flex:1`. Redundant.
- `genId('t')` / `genId('a')` / `genId('c')` prefix scheme — undocumented. Stick a comment in `utils/id.ts`.
- `useStreak` returns a memoized object — but `accounts` and `txs` arrays from `getTransactions().then(setTxs)` get new refs every focus, so memo doesn’t actually help cross-focus.

---

## 6. CLAUDE.md mismatches (worth fixing while here)

> Code-side claims are now true after the P0/P1 fixes — only the doc itself still lags. CLAUDE.md edits are pending user approval (auto-mode declined to commit changes to the agent's project instructions file without explicit authorization).

- Claims `system | light | dark` theme support → **now implemented** in `context/ThemeContext.tsx` (CLAUDE.md no longer wrong, just incomplete).
- Claims "Appearance listener" → **now implemented**.
- Claims `accountBalance` helper in `utils/aggregate.ts` → **now exists** and is used by both `dashboard.tsx` and `account-detail.tsx`.
- Claims 60s background-relock → lives in `PinContext` (out of scope here, but verify when you revisit security).
- Still to add to CLAUDE.md: `DataContext` shared cache as the canonical source for transactions/accounts; `dayKey` field on `Transaction`; per-key write queues; new `useData()` convention.

---

## 7. Suggested execution order

A pragmatic order that maximizes daily-use impact per unit of refactor pain:

1. **Cache layer first** (§2.1). Once `TransactionsProvider`/`AccountsProvider` exist, all subsequent perf and bug fixes get cheaper.
2. **Day key on transactions** (§1.1). Single migration: on first launch after upgrade, walk existing txs and write `dayKey`. Removes the entire TZ hazard.
3. **Toast queue** (§1.3) + **rollback on delete failure** (§3.1). Small, high-trust-impact.
4. **Splash trim + parallel hydration** (§2.7, §4.1). Daily-use friction.
5. **FlatList `renderItem` memoization** (§2.6). Cheap win.
6. **Storage write queue extended to accounts/categories** (§3.3). Prevents a class of silent data loss.
7. **Filter persistence + history cursor refresh** (§3.7, §3.8).
8. **Theme “system” mode + CLAUDE.md cleanup** (§1.2, §6).
9. **Custom category icon picker** (§3.6) — quality-of-life.
10. **Move storage to SQLite/MMKV** (§2.8) — defer until you actually feel the lag.

---

## 8. Quick-win checklist (≤30 min each)

- [ ] Rename `(t) => t.id` callbacks to `(tx) => tx.id`.
- [ ] Delete duplicated `flex1` style in `app/index.tsx`.
- [ ] Rename gacha `interface Symbol` → `ReelSymbol`.
- [ ] Extract `resolveReturnTarget(returnTo)` from `index.tsx`.
- [ ] Move `FILTERS` out of the `HistoryScreen` body.
- [ ] Add `try/catch` to `confirmDelete` in history + calendar.
- [ ] Lower `HOLD_MS` in `SplashIntro` to 600.
- [ ] Wrap `TransactionItem` in `React.memo`.
- [ ] Replace `setTimeout(scrollToEnd, 100)` with a `Keyboard.addListener` handler.
- [ ] Add `accountBalance` to `utils/aggregate.ts` (close the doc/code gap) and import from `dashboard.tsx`.

---

## 9. Out of scope (intentionally)

PIN, recovery, encryption at rest, and biometric unlock were excluded per the request. Re-audit those before public release — AsyncStorage is unencrypted and your transaction notes likely contain PII.
