import { Alert, Platform } from 'react-native';

/** Cross-platform confirm — native Alert dialog, window.confirm on web. Destructive style per 46. */
export function confirmDialog(title: string, message: string, confirmLabel: string, cancelLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/** Three-option dialog. Returns 'primary' | 'secondary' | 'cancel'. */
export function choiceDialog(
  title: string,
  message: string,
  primaryLabel: string,
  secondaryLabel: string,
  cancelLabel: string,
): Promise<'primary' | 'secondary' | 'cancel'> {
  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}\n\n[OK] ${primaryLabel}\n[Cancel] ${secondaryLabel}`);
    return Promise.resolve(ok ? 'primary' : 'secondary');
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve('cancel') },
      { text: secondaryLabel, onPress: () => resolve('secondary') },
      { text: primaryLabel, style: 'destructive', onPress: () => resolve('primary') },
    ]);
  });
}
