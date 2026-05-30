import AsyncStorage from '@react-native-async-storage/async-storage';
import { isoDay } from './date';

// Bump this whenever the on-disk shape changes. Add a matching entry in `migrations`.
export const CURRENT_SCHEMA_VERSION = 1;

const VERSION_KEY = 'nw.schemaVersion';

interface Migration {
  version: number; // The version this migration takes the data TO.
  name: string;
  up: () => Promise<void>;
}

// Append-only. Never edit a shipped migration — write a new one instead.
const migrations: Migration[] = [
  {
    version: 1,
    name: 'baseline: backfill Transaction.dayKey for legacy rows',
    up: async () => {
      const raw = await AsyncStorage.getItem('nw.transactions');
      if (!raw) return;
      try {
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return;
        let changed = false;
        const next = list.map((tx: any) => {
          if (tx && typeof tx === 'object' && !tx.dayKey && typeof tx.date === 'string') {
            changed = true;
            return { ...tx, dayKey: isoDay(new Date(tx.date)) };
          }
          return tx;
        });
        if (changed) await AsyncStorage.setItem('nw.transactions', JSON.stringify(next));
      } catch {
        // Corrupt JSON — leave it; storage layer will treat as empty on next read.
      }
    },
  },
  // Future example:
  // {
  //   version: 2,
  //   name: 'add Transaction.tags = []',
  //   up: async () => { /* read, default tags, write */ },
  // },
];

async function readVersion(): Promise<number> {
  const raw = await AsyncStorage.getItem(VERSION_KEY);
  if (raw == null) {
    // No version stored. Could be a fresh install, or a pre-versioning install.
    // Detect prior install by sniffing any known key.
    const probe = await AsyncStorage.multiGet([
      'nw.transactions',
      'nw.accounts',
      'nw.customCategories',
    ]);
    const hasLegacyData = probe.some(([, v]) => v != null);
    return hasLegacyData ? 0 : CURRENT_SCHEMA_VERSION;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

async function writeVersion(v: number): Promise<void> {
  await AsyncStorage.setItem(VERSION_KEY, String(v));
}

// Runs every startup. Cheap when already at latest version.
// Safe to call multiple times — migrations are gated by stored version.
export async function runMigrations(): Promise<void> {
  let current = await readVersion();
  if (current >= CURRENT_SCHEMA_VERSION) {
    if (current !== CURRENT_SCHEMA_VERSION) {
      // Downgrade case — user installed an older build over a newer one.
      // Don't run migrations backward; just clamp the stored version so the
      // next upgrade resumes correctly.
      await writeVersion(CURRENT_SCHEMA_VERSION);
    }
    return;
  }

  const pending = migrations
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version);

  for (const m of pending) {
    try {
      await m.up();
      await writeVersion(m.version);
      current = m.version;
    } catch (err) {
      // Bail without bumping version so the user can retry next launch.
      // Don't corrupt data by partially advancing past a failure.
      console.warn(`[migrations] ${m.name} (v${m.version}) failed:`, err);
      return;
    }
  }
}
