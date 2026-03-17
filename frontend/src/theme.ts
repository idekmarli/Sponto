// Resellr OS Design System
// Premium, editorial, luxury operational — calm and expensive

import { StyleSheet, TextStyle, ViewStyle, Platform } from 'react-native';

// ============================================================================
// COLOR PALETTE — Warm Neutral, Editorial, Fashion-Adjacent
// ============================================================================
export const colors = {
  // Backgrounds — warm cream / parchment / soft stone
  background: '#FAF9F7',
  surface: '#FFFFFF',
  surfaceSecondary: '#F7F6F3',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F2F0EC',
  surfaceWarm: '#F5F3EF',
  
  // Text — deep espresso / charcoal
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textTertiary: '#78716C',
  textMuted: '#A8A29E',
  textInverse: '#FAFAF9',
  
  // Brand — muted olive / bronze
  brand: '#44403C',
  brandLight: '#57534E',
  accent: '#8B7355',
  accentLight: '#A69076',
  accentMuted: '#D4C4B0',
  
  // Semantic - Success — restrained sage
  success: '#5F7A5E',
  successLight: '#EFF4EF',
  successMuted: '#C8D4C7',
  
  // Semantic - Warning — muted clay / soft rust
  warning: '#9A6B4C',
  warningLight: '#F9F3EE',
  warningMuted: '#DBC9BA',
  
  // Semantic - Error — soft terra cotta
  error: '#8B5C5C',
  errorLight: '#F7F0F0',
  errorMuted: '#D4C0C0',
  
  // Semantic - Info — muted slate
  info: '#6B7B8A',
  infoLight: '#F0F3F5',
  
  // Pro / Premium accent
  pro: '#8B7355',
  proLight: '#F5F2EE',
  proBorder: '#D4C4B0',
  
  // UI Elements
  border: '#E7E5E0',
  borderLight: '#F0EDE8',
  divider: '#ECEAE5',
  
  // Interactive
  interactive: '#44403C',
  interactiveHover: '#57534E',
  interactiveDisabled: '#D6D3D1',
  
  // Overlay
  overlay: 'rgba(28, 25, 23, 0.5)',
  overlayLight: 'rgba(28, 25, 23, 0.06)',
} as const;

// ============================================================================
// SPACING SCALE (8pt grid)
// ============================================================================
export const space = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

// Semantic spacing
export const spacing = {
  screenPadding: 20,
  cardPadding: 16,
  cardPaddingLarge: 20,
  sectionGap: 32,
  itemGap: 12,
  inlineGap: 8,
  inputHeight: 52,
  buttonHeight: 52,
  buttonHeightSmall: 44,
  touchTarget: 44,
  containerPadding: 20,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
} as const;

// ============================================================================
// TYPOGRAPHY — Editorial, Luxury, Fashion-Adjacent
// ============================================================================
export const fontFamily = {
  // Primary — DM Sans for clean, modern feel
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  
  // Mono — for numbers, data
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

export const fontSize = {
  '2xs': 10,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.3,
  wider: 0.6,
  widest: 1.0,
} as const;

// ============================================================================
// SHADOWS (using boxShadow for modern RN/Expo)
// ============================================================================
const shadowBase = {
  xs: {
    boxShadow: '0px 1px 2px rgba(28, 25, 23, 0.03)',
    elevation: 1,
  } as ViewStyle,
  sm: {
    boxShadow: '0px 2px 4px rgba(28, 25, 23, 0.04)',
    elevation: 2,
  } as ViewStyle,
  md: {
    boxShadow: '0px 4px 8px rgba(28, 25, 23, 0.06)',
    elevation: 3,
  } as ViewStyle,
  lg: {
    boxShadow: '0px 6px 12px rgba(28, 25, 23, 0.08)',
    elevation: 4,
  } as ViewStyle,
  xl: {
    boxShadow: '0px 8px 16px rgba(28, 25, 23, 0.1)',
    elevation: 5,
  } as ViewStyle,
};

export const shadows = {
  none: {} as ViewStyle,
  ...shadowBase,
  // Semantic aliases
  subtle: shadowBase.xs,
  card: shadowBase.sm,
  medium: shadowBase.md,
  strong: shadowBase.lg,
  elevated: shadowBase.xl,
} as const;

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================
export const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  sourced: { label: 'Sourced', color: colors.accent, bg: colors.surfaceWarm, icon: 'shopping-bag' },
  intake: { label: 'Intake', color: colors.accent, bg: colors.surfaceWarm, icon: 'inbox' },
  photographed: { label: 'Photographed', color: colors.accent, bg: colors.surfaceWarm, icon: 'camera' },
  listed: { label: 'Listed', color: colors.success, bg: colors.successLight, icon: 'tag' },
  crosslisted: { label: 'Crosslisted', color: colors.success, bg: colors.successLight, icon: 'copy' },
  sold: { label: 'Sold', color: colors.success, bg: colors.successLight, icon: 'dollar-sign' },
  shipped: { label: 'Shipped', color: colors.success, bg: colors.successLight, icon: 'truck' },
  completed: { label: 'Completed', color: colors.textTertiary, bg: colors.surfaceMuted, icon: 'check-circle' },
  returned: { label: 'Returned', color: colors.warning, bg: colors.warningLight, icon: 'rotate-ccw' },
  archived: { label: 'Archived', color: colors.textMuted, bg: colors.surfaceMuted, icon: 'archive' },
};

// ============================================================================
// HEALTH CONFIGURATION
// ============================================================================
export const healthConfig: Record<string, { label: string; color: string; bg: string }> = {
  fresh: { label: 'Fresh', color: colors.success, bg: colors.successLight },
  ready_to_list: { label: 'Ready', color: colors.accent, bg: colors.surfaceWarm },
  needs_listing: { label: 'Needs Listing', color: colors.accent, bg: colors.surfaceWarm },
  approaching_stale: { label: 'Aging', color: colors.warning, bg: colors.warningLight },
  crosslist_candidate: { label: 'Crosslist', color: colors.info, bg: colors.infoLight },
  stale: { label: 'Stale', color: colors.warning, bg: colors.warningLight },
  critical_stale: { label: 'Critical', color: colors.error, bg: colors.errorLight },
  dead_stock: { label: 'Dead Stock', color: colors.error, bg: colors.errorLight },
  incomplete: { label: 'Incomplete', color: colors.textTertiary, bg: colors.surfaceMuted },
  sold: { label: 'Sold', color: colors.success, bg: colors.successLight },
  sold_pending: { label: 'Sold', color: colors.success, bg: colors.successLight },
  shipped_pending: { label: 'Shipped', color: colors.success, bg: colors.successLight },
};

// ============================================================================
// WORKFLOW TAGS CONFIGURATION
// ============================================================================

// Manual workflow tags — user-controlled
export const MANUAL_TAGS = [
  { key: 'measurements_added', label: 'Measurements', icon: 'maximize-2' },
  { key: 'flaws_added', label: 'Flaws Noted', icon: 'alert-circle' },
  { key: 'draft_ready', label: 'Draft Ready', icon: 'file-text' },
  { key: 'price_reviewed', label: 'Price Reviewed', icon: 'check-square' },
  { key: 'needs_repricing', label: 'Needs Repricing', icon: 'trending-down' },
  { key: 'needs_better_photos', label: 'Better Photos', icon: 'camera-off' },
  { key: 'needs_description', label: 'Needs Description', icon: 'edit-3' },
  { key: 'high_priority', label: 'High Priority', icon: 'star' },
] as const;

// Derived/system tags — auto-generated, read-only
export const DERIVED_TAGS = [
  { key: 'stale', label: 'Stale', icon: 'clock' },
  { key: 'dead_stock', label: 'Dead Stock', icon: 'alert-octagon' },
  { key: 'incomplete', label: 'Incomplete', icon: 'alert-triangle' },
  { key: 'margin_risk', label: 'Margin Risk', icon: 'trending-down' },
  { key: 'sold_pending_cleanup', label: 'Pending Cleanup', icon: 'loader' },
  { key: 'needs_cleanup', label: 'Needs Cleanup', icon: 'refresh-cw' },
] as const;

export type ManualTagKey = typeof MANUAL_TAGS[number]['key'];
export type DerivedTagKey = typeof DERIVED_TAGS[number]['key'];

export const tagConfig: Record<string, { label: string; color: string; bg: string; icon: string; isDerived?: boolean }> = {
  // Manual tags
  measurements_added: { label: 'Measurements', color: colors.success, bg: colors.successLight, icon: 'maximize-2' },
  flaws_added: { label: 'Flaws Noted', color: colors.info, bg: colors.infoLight, icon: 'alert-circle' },
  draft_ready: { label: 'Draft Ready', color: colors.success, bg: colors.successLight, icon: 'file-text' },
  price_reviewed: { label: 'Price Reviewed', color: colors.success, bg: colors.successLight, icon: 'check-square' },
  needs_repricing: { label: 'Repricing', color: colors.warning, bg: colors.warningLight, icon: 'trending-down' },
  needs_better_photos: { label: 'Photos', color: colors.warning, bg: colors.warningLight, icon: 'camera-off' },
  needs_description: { label: 'Description', color: colors.warning, bg: colors.warningLight, icon: 'edit-3' },
  high_priority: { label: 'Priority', color: colors.error, bg: colors.errorLight, icon: 'star' },
  // Derived tags
  stale: { label: 'Stale', color: colors.warning, bg: colors.warningLight, icon: 'clock', isDerived: true },
  dead_stock: { label: 'Dead Stock', color: colors.error, bg: colors.errorLight, icon: 'alert-octagon', isDerived: true },
  incomplete: { label: 'Incomplete', color: colors.textTertiary, bg: colors.surfaceMuted, icon: 'alert-triangle', isDerived: true },
  margin_risk: { label: 'Margin Risk', color: colors.warning, bg: colors.warningLight, icon: 'trending-down', isDerived: true },
  sold_pending_cleanup: { label: 'Pending', color: colors.accent, bg: colors.surfaceWarm, icon: 'loader', isDerived: true },
  needs_cleanup: { label: 'Cleanup', color: colors.warning, bg: colors.warningLight, icon: 'refresh-cw', isDerived: true },
};

// ============================================================================
// ACTION TYPE CONFIG (for Home action feed)
// ============================================================================
export const actionTypeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  critical_stale: { icon: 'alert-octagon', color: colors.error, bg: colors.errorLight },
  dead_stock: { icon: 'alert-octagon', color: colors.error, bg: colors.errorLight },
  stale_reprice: { icon: 'trending-down', color: colors.warning, bg: colors.warningLight },
  stale: { icon: 'clock', color: colors.warning, bg: colors.warningLight },
  approaching_stale: { icon: 'clock', color: colors.accent, bg: colors.surfaceWarm },
  needs_listing: { icon: 'tag', color: colors.accent, bg: colors.surfaceWarm },
  sold_pending: { icon: 'dollar-sign', color: colors.success, bg: colors.successLight },
  shipped_pending: { icon: 'truck', color: colors.success, bg: colors.successLight },
  incomplete: { icon: 'alert-triangle', color: colors.textTertiary, bg: colors.surfaceMuted },
  crosslist_candidate: { icon: 'copy', color: colors.info, bg: colors.infoLight },
  high_priority: { icon: 'star', color: colors.error, bg: colors.errorLight },
  // Fallback for any missing types
  default: { icon: 'info', color: colors.textSecondary, bg: colors.surfaceMuted },
};

// ============================================================================
// PRIORITY CONFIG (for Home action feed)
// ============================================================================
export const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'Critical', color: colors.error },
  2: { label: 'High', color: colors.warning },
  3: { label: 'Medium', color: colors.accent },
  4: { label: 'Low', color: colors.textSecondary },
  5: { label: 'Low', color: colors.textSecondary },
  6: { label: 'Low', color: colors.textTertiary },
  7: { label: 'Info', color: colors.textTertiary },
};

// ============================================================================
// TYPOGRAPHY STYLES
// ============================================================================
export const typography = StyleSheet.create({
  // Display — for hero metrics
  displayLarge: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['5xl'],
    lineHeight: fontSize['5xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
    color: colors.textPrimary,
  } as TextStyle,
  displayMedium: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['4xl'],
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
    color: colors.textPrimary,
  } as TextStyle,
  
  // Headings
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
    color: colors.textPrimary,
  } as TextStyle,
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
    color: colors.textPrimary,
  } as TextStyle,
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
    color: colors.textPrimary,
  } as TextStyle,
  h4: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
    color: colors.textPrimary,
  } as TextStyle,
  
  // Body
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.relaxed,
    color: colors.textSecondary,
  } as TextStyle,
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
    color: colors.textSecondary,
  } as TextStyle,
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    color: colors.textSecondary,
  } as TextStyle,
  
  // Labels
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    color: colors.textSecondary,
  } as TextStyle,
  labelSmall: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  } as TextStyle,
  
  // Caption
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    color: colors.textTertiary,
  } as TextStyle,
  
  // Mono (for numbers/data)
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  } as TextStyle,
  monoLarge: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.lg,
    letterSpacing: letterSpacing.tight,
    color: colors.textPrimary,
  } as TextStyle,
});

// ============================================================================
// CARD STYLES
// ============================================================================
export const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  } as ViewStyle,
  elevated: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.medium,
  } as ViewStyle,
  muted: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
  } as ViewStyle,
  outlined: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  } as ViewStyle,
  pro: {
    backgroundColor: colors.proLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.proBorder,
  } as ViewStyle,
});

// ============================================================================
// BUTTON STYLES
// ============================================================================
export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.brand,
    borderRadius: radius.full,
    height: spacing.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: space[6],
    ...shadows.sm,
  } as ViewStyle,
  primaryText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  } as TextStyle,
  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    height: spacing.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: space[6],
  } as ViewStyle,
  secondaryText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  } as TextStyle,
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: radius.full,
    height: spacing.buttonHeightSmall,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: space[4],
  } as ViewStyle,
  ghostText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.accent,
  } as TextStyle,
});

// ============================================================================
// INPUT STYLES
// ============================================================================
export const inputStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: spacing.inputHeight,
    paddingHorizontal: space[4],
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    ...shadows.xs,
  } as ViewStyle & TextStyle,
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    marginBottom: space[2],
  } as TextStyle,
});

// ============================================================================
// ICON SIZES
// ============================================================================
export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
} as const;

// ============================================================================
// CHART COLORS
// ============================================================================
export const chartColors = {
  primary: colors.accent,
  secondary: colors.surfaceMuted,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  muted: colors.surfaceMuted,
  grid: colors.borderLight,
};

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================
export const borderRadius = {
  ...radius,
  s: radius.sm,
  m: radius.md,
  l: radius.lg,
  pill: radius.full,
} as const;

export const statusLabels: Record<string, string> = Object.fromEntries(
  Object.entries(statusConfig).map(([k, v]) => [k, v.label])
);

export const healthLabels: Record<string, { label: string; color: string; bg: string }> = healthConfig;

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================
export const formatCurrency = (amount: number, symbol: string = '$'): string => {
  return `${symbol} ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
