# Nabung Woi v2.0: major release

You are working in `D:\nabung-woi`, an Expo 57 / RN 0.86 personal finance tracker that ships as both a native app and an installable PWA on Vercel. Read `CLAUDE.md` and `README.md` fully before anything else; every convention there is binding (theme tokens only, i18n in both `en` and `id`, `formatIDR*`, `genId`, ≥44pt targets + a11y props, `useData()` as the only data path, `useDeleteWithUndo`, etc.).

This is the **v2.0 release**: a large UI/UX overhaul, a new logo, new features, and fixes for every bug from v1. Aim for a product that someone who has never used a finance app can understand at first glance. Ambition is welcome, but every change must be finished, consistent across screens, and verified. A half-done screen is worse than an unchanged one.

## 0. Ground rules

- **PWA is a first-class target, not an afterthought.** Many users are on iPhone and can only install from the web. Every feature must work and feel native in iOS Safari standalone mode:
  - `env(safe-area-inset-*)` on top bars, tab bar, sheets, FABs, and the PIN screen.
  - Text inputs ≥16px font size (iOS zooms the page otherwise).
  - No reliance on `expo-haptics`, native date pickers, or native-only modules on web. Use `.web.tsx` variants or `Platform.OS` guards.
  - Gestures (swipe, drag, long-press) must not fight Safari's back-swipe or the pull-to-refresh/overscroll bounce.
  - The status-bar / `theme-color` must follow the active theme (update `<meta name="theme-color">` at runtime on web). Keep `apple-mobile-web-app-status-bar-style: default` and match `background_color` to the default theme background.
  - Bump `CACHE_VERSION` in `public/sw.js`.
  - Test layouts at 375×667 and 390×844 in the web build.
- **Git:** create branch `v2` from `main`. Commit after each phase with a conventional message. **Never** add `Co-Authored-By`, "Generated with Claude Code", or any Claude/Anthropic attribution. Do not push.
- **Verification gate, every phase:** `node --stack-size=8000 ./node_modules/typescript/lib/_tsc.js --noEmit` (plain `npx tsc` crashes on this machine) **and** `npx expo export -p web`. Both must pass before a commit. Then run the web build and check the touched screens in a browser at phone width (light + at least one dark theme). Report honestly what you verified and what you could not.
- **Copy:** no em dashes (—) anywhere in user-facing strings, in either language. Write plain, friendly, short copy. Audit `i18n/dicts.ts` and fix existing ones too.
- **Data safety:** users already have real data. Any change to the stored shape needs a new append-only migration in `utils/migrations.ts` (v3+). Never break export/import compatibility with v1 backups.
- **Workflow:** first, explore and write a plan (`docs/v2-plan.md`) covering phases, the design direction, new routes/files, migrations, and an **Open Questions** list. Stop and show me the plan plus questions once. After I answer, execute all phases without asking again unless something is destructive or truly ambiguous.

## 1. Known bugs from v1 (fix all, then look for more)

1. `app/index.tsx`: in edit mode, the category `useEffect` returns early, so switching type (expense → income) keeps the old expense `categoryId`.
2. `app/index.tsx` transfer balance check: when editing, it always adds `oldTx.amount` back. It should add back `-balanceDelta(oldTx, accountId)` so income/adjustment rows are handled correctly.
3. `utils/storage.ts` `importAll` writes `nw.transactions` outside `enqueueTxWrite`, so it can race other writes.
4. **Report drilldown is wrong (top priority):** tapping a row in *By Category* or *By Account* opens `category-detail` / `account-detail`, which use `filterByPeriod(..., new Date())`, so they always show the *current* month instead of the range selected in Report. Fix the flow end to end: pass the exact `DateRange` (granularity + startKey/endKey) as params, make both detail screens range-based (reuse `utils/period.ts` + `RangeNav`), let users move to the previous/next range from inside the detail screen, and keep the data shown identical to what Report showed for that row.
5. Audit every place that sums money for correct `transfer` / `adjustment` handling (see the semantics table in CLAUDE.md).

Do a quick audit pass of your own and add anything you find to the plan.

## 2. Release and branding

- Bump the version to `2.0.0` in `app.json` and `package.json`. Note in the plan that the icon/splash change needs a new native build (`eas build`), because OTA updates cannot change icons.
- Add a short "What's new in 2.0" sheet shown once after updating (store a seen flag), also reachable from Settings → About.
- **New logo.** Design one that clearly says "saving money / personal finance" and stays legible at 16px (favicon) up to 1024px. Deliver an SVG master in `assets/brand/`, then generate every needed size from it with a script: app icon 1024, Android adaptive foreground + background, splash, `favicon`, PWA `192` / `512` + **maskable** variants, and `apple-touch-icon` 180. Wire them into `app.json`, `public/manifest.json`, and `app/+html.tsx`. Show me 2–3 concepts (as SVG previews) in the plan stage before committing to one.

## 3. Design system and themes (do this first, everything else builds on it)

- Define a clear v2 visual direction (type scale, spacing rhythm, card style, iconography, motion) in the plan and apply it consistently. Prioritize clarity for non-technical users: bigger primary numbers, obvious primary actions, fewer competing elements per screen, helpful empty states.
- **Theme picker:** move from `light | dark | system` to *palette × mode*. Ship several palettes as data in `constants/theme.ts`, for example: Default, Pastel Pink & Cream, Monochrome, Ocean, Forest, Midnight/OLED black, plus anything else you think is worth it. Every palette must define the full semantic token set (including income/expense/transfer/adjustment and chart colors) and pass WCAG AA contrast for text. Optionally add an accent-color override. The picker shows live preview swatches. It is persisted, applied instantly with no restart, and works on web (including `theme-color`).

## 4. Screen-by-screen requirements

### a. PIN lock screen
Redesign it to look polished and modern: branded header with the new logo, animated dot indicators, a large keypad with press feedback, a shake animation plus haptics (native only) on a wrong PIN, a greeting by time of day, and a smooth unlock transition. It must look great on iPhone standalone PWA with safe areas.

### b. Add / Edit Transaction (`app/index.tsx`)
- Cleaner layout and hierarchy. The amount is the hero.
- Category pills in a tidy, aligned grid (consistent sizes, icon + label, no ragged wrapping). Recently or frequently used categories come first. A "more" option is fine if the list is long.
- **Quick amount chips** (for example +10rb, +20rb, +50rb, +100rb). Tapping one **adds** to the current amount. Include a clear/reset action.
- **Custom date picker** (no native picker, same UI on all platforms): bottom sheet with a month grid, quick chips (Today, Yesterday), and an optional time. No em dashes in its labels or display format.
- Sticky save button that stays above the keyboard on iOS PWA.
- Keep all existing params (`id`, `date`, `returnTo`) working.

### c. Calculator
Make it behave like a phone calculator:
- The expression is shown as typed. The result appears **only after `=`** (an optional faint live preview is fine, but the main display must not jump to the answer).
- Operator precedence, `%`, `±`, backspace, AC/C, chained operations, repeated `=`.
- **History** of past calculations (persisted, capped, clearable). Tapping an entry reuses its result.
- Result can be applied into the amount field.
- Safe expression parsing (no `eval`).

### d. Dashboard
Add the features you judge most useful and justify each one in the plan. Must include:
- A **date range filter** (presets + custom range) driving the totals, chart, and top categories.

Strong candidates (pick and propose):
- Comparison vs the previous period.
- Spending pace / projected month-end.
- Quick-add from recent transactions.
- Monthly budget per category with progress bars (needs a migration).
- Upcoming/recurring reminders.

Keep the dashboard scannable, not crowded.

### e. Categories and Accounts management
- Redesign both lists (Settings → Categories / Accounts) to be easier to read: grouped sections, icons, usage counts or balances, and a clear add/edit flow in a sheet.
- Answer in the plan whether filters help here and implement your recommendation. My expectation: an expense/income segmented toggle + search for categories, and grouping by account type for accounts. Justify if you disagree.
- Allow reordering if it fits naturally.

### f. Calendar
It is decent already. Improve where it adds real value, for example: a heatmap-style intensity for daily spending, a daily net amount in each cell, a month summary, week starting day following settings, swipe between months.
I suggested drag-and-drop to move transactions between days. Evaluate it honestly for mobile and PWA (gesture conflicts, accidental moves). Either implement it safely (long-press to start, clear drop target, Undo toast) or replace it with a better pattern such as "Move to date…" and explain why.

### g. Report
- Fix the drilldown flow (bug #4) as the top priority.
- Make the screen more engaging and readable: clear range navigation, KPI cards with deltas, better charts, tappable chart buckets that drill into that day/month, and By Category / By Account rows that drill into a correctly scoped detail list.
- Add features you think fit (for example: savings rate trend, category trend over the last N periods, export the report as CSV/share).

### h. History
- Fix the spacing between the sticky INCOME / EXPENSE / CASHFLOW summary and the list while scrolling: no overlap, no cramped gap, consistent at every scroll position on native and web.
- **Redesign the filter UI:** a proper bottom sheet with sections (type, period/custom range, account, category, amount range), clear chip states, a result count, Reset and Apply buttons, and active filters summarized as removable chips above the list.
- Add search by note/category if useful. Group by day with daily subtotals.

### i. Settings
The current single page is cluttered. Restructure it into a clean root list of grouped sections, each opening its own screen (stack routes, for example `app/settings/*`):
Accounts · Categories · Appearance (theme/palette, language) · Security (PIN, auto-lock timeout) · Data (export, import, clear, backup reminder) · Preferences (default account, start of week, hide balance by default, haptics) · About (version 2.0.0, What's new).
Each subpage follows the new design system. Propose any extra settings worth adding.

## 5. Definition of done

- All phases are committed on `v2` and both gates pass.
- Every new string exists in `en` and `id`. There are no em dashes in UI copy.
- Light and dark modes of every palette look correct on every screen.
- The web export works installed as a PWA on iPhone size, with no safe-area gaps, no input zoom, and no clipped sheets.
- `CLAUDE.md` and `README.md` are updated for the new architecture, routes, themes, migrations, and the v2 feature list.
- A final summary lists what changed, what was verified (and how), what was not verified, and any follow-ups (e.g. "run `eas build` for new icons").
