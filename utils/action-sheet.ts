import { ActionSheetIOS, Alert, Platform } from 'react-native';

/**
 * Cross-platform wrapper for ActionSheetIOS.
 * Uses native ActionSheetIOS on iOS when available, falls back to Alert buttons.
 */
export function showActionSheet(
  options: string[],
  callback: (index: number) => void,
  cancelIndex = 0,
): void {
  if (Platform.OS === 'ios' && ActionSheetIOS?.showActionSheetWithOptions) {
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: cancelIndex },
      callback,
    );
    return;
  }

  // Fallback: Alert with buttons
  const buttons = options
    .map((label, idx) => {
      if (idx === cancelIndex) return null;
      return { text: label, onPress: () => callback(idx) };
    })
    .filter(Boolean) as { text: string; onPress: () => void }[];

  buttons.push({
    text: options[cancelIndex] ?? 'Cancel',
    onPress: () => callback(cancelIndex),
  });

  Alert.alert('Select an option', undefined, buttons);
}
