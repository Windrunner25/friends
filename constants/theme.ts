/**
 * Design system colors for the Friends app.
 * The app is iOS-first and light mode only.
 */

import { Platform } from 'react-native';

export const Palette = {
  background: '#E8DFD0',    // warm tan parchment
  text: '#1A1410',          // deep warm charcoal
  accent: '#2D5F8A',        // deep steel blue — buttons, highlights, active states
  midTier: '#4A7A9B',       // Keep Warm tier indicator
  lightTier: '#7A9DB5',     // Don't Lose Touch tier indicator
  cardSurface: '#F0EAE0',   // card surface
  tabBarBorder: '#C8BFB0',  // subtle warm border / dividers
  iconInactive: '#6B5F52',  // secondary text / inactive icons
};

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.background,
    tint: Palette.accent,
    icon: Palette.iconInactive,
    tabIconDefault: Palette.iconInactive,
    tabIconSelected: Palette.accent,
  },
  dark: {
    text: Palette.text,
    background: Palette.background,
    tint: Palette.accent,
    icon: Palette.iconInactive,
    tabIconDefault: Palette.iconInactive,
    tabIconSelected: Palette.accent,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
