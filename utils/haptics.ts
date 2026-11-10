import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * The only place the app talks to expo-haptics.
 *
 * Web has no haptics API worth relying on, and users can switch feedback off
 * in Preferences, so every call site goes through these guards instead of
 * importing expo-haptics directly.
 */
let enabled = true;

export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}

function active(): boolean {
  return enabled && Platform.OS !== 'web';
}

export function hapticLight(): void {
  if (!active()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticMedium(): void {
  if (!active()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function hapticSelection(): void {
  if (!active()) return;
  Haptics.selectionAsync().catch(() => {});
}

export function hapticSuccess(): void {
  if (!active()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticError(): void {
  if (!active()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
