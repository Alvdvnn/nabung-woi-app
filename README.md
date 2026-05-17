# Nabung Woi 💸

A personal finance tracker built with React Native + Expo. Track income, expenses, and savings habits — all stored locally on your device.

## Features

- **Dashboard** — Net balance, income/expense summary, spending by category (pie chart), and daily logging streak
- **Calendar** — Visual month view with dot markers on days that have transactions; tap a date to see its transactions
- **History** — Full transaction list with income/expense filter and swipe-to-delete
- **Settings** — Manage accounts & custom categories, export data, dark/light/auto theme toggle
- **Gacha** — Spin a wheel to get a random "buy it" or "skip it" verdict for impulse purchase decisions

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native 0.81.5, Expo 54 |
| Routing | expo-router (file-based) |
| Storage | AsyncStorage (on-device, no server) |
| Charts | react-native-gifted-charts |
| Animations | react-native-reanimated v4 |
| Bottom Sheets | @gorhom/bottom-sheet v5 |
| Icons | lucide-react-native |
| Language | TypeScript (strict) |

## Getting Started

**Prerequisites:** Node.js 18+, Expo Go app on your phone (or an emulator)

```bash
git clone https://github.com/your-username/nabung-woi.git
cd nabung-woi
npm install
npm start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

### Run on specific platforms

```bash
npm run android   # Android emulator
npm run ios       # iOS simulator
npm run web       # Web browser
```

## Project Structure

```
app/
  (main)/           # Tab screens (dashboard, calendar, history, settings, gacha)
  index.tsx         # Transaction input form (modal)
  _layout.tsx       # Root layout
components/         # Shared UI components
constants/
  theme.ts          # Colors, spacing, typography, shadows
  categories.ts     # Default expense/income categories
utils/
  storage.ts        # AsyncStorage CRUD for transactions, accounts, categories
  aggregate.ts      # Period filtering, category totals, net balance
  format.ts         # IDR currency formatter, date helpers
hooks/
  useTheme.ts       # Light/dark/auto theme context
  useStreak.ts      # Daily logging streak calculator
```

## Data & Privacy

All data lives on-device via AsyncStorage. Nothing is sent to any server. Export your data as JSON from the Settings screen.

## License

MIT
