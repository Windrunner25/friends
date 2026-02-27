/**
 * Design system colors for the Friends app.
 * The app is iOS-first and light mode only.
 */

import { Platform } from 'react-native';

export const Palette = {
  background: '#F5F0E8',    // warm parchment
  text: '#2C2825',          // deep warm charcoal
  accent: '#6B8CAE',        // dusty steel blue — buttons, highlights, active states
  midTier: '#9AB3C8',       // Keep Warm tier indicator
  lightTier: '#C8D8E4',     // Don't Lose Touch tier indicator
  cardSurface: '#EDE8DF',   // slightly darker warm off-white for cards
  tabBarBorder: '#DDD8CE',  // subtle warm border
  iconInactive: '#A8A39A',  // muted warm grey for inactive tab icons
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
