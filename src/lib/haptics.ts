import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/** Haptic map from the design system: every vibration has meaning, never overused (09/45). */
export const haptics = {
  /** Chip taps, option picks. */
  selection: () => {
    if (isNative) void Haptics.selectionAsync();
  },
  /** Primary actions (Plan my evening, Start evening). */
  primary: () => {
    if (isNative) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  /** Light touches (favorite, open album). */
  light: () => {
    if (isNative) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  /** Album created, evening completed. */
  success: () => {
    if (isNative) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  /** Errors — one gentle buzz, never punishing. */
  error: () => {
    if (isNative) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
