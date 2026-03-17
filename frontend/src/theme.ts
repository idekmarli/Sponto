// Resellr OS Design System v2
// Professional, Cool, Premium — Sharp and Modern

import { StyleSheet, TextStyle, ViewStyle, Platform } from 'react-native';

// ============================================================================
// COLOR PALETTE — Refined, High-Contrast, Professional
// ============================================================================
export const colors = {
  // Backgrounds — light stone / soft greige
  background: '#F5F4F2',
  surface: '#FFFFFF',
  surfaceSecondary: '#FAFAFA',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F0EFED',
  surfaceWarm: '#F8F7F5',
  
  // Text — deep charcoal hierarchy
  textPrimary: '#18181B',
  textSecondary: '#52525B',
  textTertiary: '#71717A',
  textMuted: '#A1A1AA',
  textInverse: '#FAFAFA',
  
  // Brand — cooler olive-charcoal
  brand: '#6B9B7A',
  brandLight: '#8AB89A',
  accent: '#27272A',
  accentLight: '#3F3F46',
  accentMuted: '#D6D3D1',
  
  // Semantic - Success — vibrant green
  success: '#16A34A',
  successLight: '#DCFCE7',
  successMuted: '#BBF7D0',
  
  // Semantic - Warning — vibrant amber
  warning: '#D97706',
  warningLight: '#FEF3C7',
  warningMuted: '#FDE68A',
  
  // Semantic - Error — vibrant red
  error: '#DC2626',
  errorLight: '#FEE2E2',
  errorMuted: '#FECACA',
  
  // Semantic - Info — refined slate
  info: '#475569',
  infoLight: '#F1F5F9',
  
  // Pro / Premium accent — refined bronze
  pro: '#78716C',
  proLight: '#F5F5F4',
  proBorder: '#D6D3D1',
  
  // UI Elements — clearer borders
  border: '#E4E4E7',
  borderLight: '#F4F4F5',
  borderDark: '#D4D4D8',
  divider: '#E4E4E7',
  
  // Interactive
  interactive: '#18181B',
  interactiveHover: '#27272A',
  interactiveDisabled: '#D4D4D8',
  
  // Overlay
  overlay: 'rgba(24, 24, 27, 0.6)',
  overlayLight: 'rgba(24, 24, 27, 0.04)',
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
// TYPOGRAPHY — Sharp, Professional
// ============================================================================
export const fontFamily = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
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
// SHADOWS — Stronger, More Dimensional
// ============================================================================
const shadowBase = {
  xs: {
    boxShadow: '0px 1px 2px rgba(24, 24, 27, 0.05)',
    elevation: 1,
  } as ViewStyle,
  sm: {
    boxShadow: '0px 1px 3px rgba(24, 24, 27, 0.08), 0px 1px 2px rgba(24, 24, 27, 0.04)',
    elevation: 2,
  } as ViewStyle,
  md: {
    boxShadow: '0px 4px 6px rgba(24, 24, 27, 0.07), 0px 2px 4px rgba(24, 24, 27, 0.04)',
    elevation: 3,
  } as ViewStyle,
  lg: {
    boxShadow: '0px 10px 15px rgba(24, 24, 27, 0.08), 0px 4px 6px rgba(24, 24, 27, 0.04)',
    elevation: 4,
  } as ViewStyle,
  xl: {
    boxShadow: '0px 20px 25px rgba(24, 24, 27, 0.1), 0px 8px 10px rgba(24, 24, 27, 0.04)',
    elevation: 5,
  } as ViewStyle,
};

export const shadows = {
  none: {} as ViewStyle,
  ...shadowBase,
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
  sourced: { label: 'Sourced', color: colors.accent, bg: colors.surfaceMuted, icon: 'shopping-bag' },
  intake: { label: 'Intake', color: colors.accent, bg: colors.surfaceMuted, icon: 'inbox' },
  photographed: { label: 'Photographed', color: colors.accent, bg: colors.surfaceMuted, icon: 'camera' },
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
  ready_to_list: { label: 'Ready', color: colors.brand, bg: colors.surfaceMuted },
  needs_listing: { label: 'Needs Listing', color: colors.brand, bg: colors.surfaceMuted },
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
  measurements_added: { label: 'Measurements', color: colors.success, bg: colors.successLight, icon: 'maximize-2' },
  flaws_added: { label: 'Flaws Noted', color: colors.info, bg: colors.infoLight, icon: 'alert-circle' },
  draft_ready: { label: 'Draft Ready', color: colors.success, bg: colors.successLight, icon: 'file-text' },
  price_reviewed: { label: 'Price Reviewed', color: colors.success, bg: colors.successLight, icon: 'check-square' },
  needs_repricing: { label: 'Repricing', color: colors.warning, bg: colors.warningLight, icon: 'trending-down' },
  needs_better_photos: { label: 'Photos', color: colors.warning, bg: colors.warningLight, icon: 'camera-off' },
  needs_description: { label: 'Description', color: colors.warning, bg: colors.warningLight, icon: 'edit-3' },
  high_priority: { label: 'Priority', color: colors.error, bg: colors.errorLight, icon: 'star' },
  stale: { label: 'Stale', color: colors.warning, bg: colors.warningLight, icon: 'clock', isDerived: true },
  dead_stock: { label: 'Dead Stock', color: colors.error, bg: colors.errorLight, icon: 'alert-octagon', isDerived: true },
  incomplete: { label: 'Incomplete', color: colors.textTertiary, bg: colors.surfaceMuted, icon: 'alert-triangle', isDerived: true },
  margin_risk: { label: 'Margin Risk', color: colors.warning, bg: colors.warningLight, icon: 'trending-down', isDerived: true },
  sold_pending_cleanup: { label: 'Pending', color: colors.accent, bg: colors.surfaceMuted, icon: 'loader', isDerived: true },
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
  approaching_stale: { icon: 'clock', color: colors.accent, bg: colors.surfaceMuted },
  needs_listing: { icon: 'tag', color: colors.brand, bg: colors.surfaceMuted },
  sold_pending: { icon: 'dollar-sign', color: colors.success, bg: colors.successLight },
  shipped_pending: { icon: 'truck', color: colors.success, bg: colors.successLight },
  incomplete: { icon: 'alert-triangle', color: colors.textTertiary, bg: colors.surfaceMuted },
  crosslist_candidate: { icon: 'copy', color: colors.info, bg: colors.infoLight },
  high_priority: { icon: 'star', color: colors.error, bg: colors.errorLight },
  default: { icon: 'info', color: colors.textSecondary, bg: colors.surfaceMuted },
};

// ============================================================================
// PRIORITY CONFIG (for Home action feed)
// ============================================================================
export const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'Critical', color: colors.error },
  2: { label: 'High', color: colors.warning },
  3: { label: 'Medium', color: colors.brand },
  4: { label: 'Low', color: colors.textSecondary },
  5: { label: 'Low', color: colors.textSecondary },
  6: { label: 'Low', color: colors.textTertiary },
  7: { label: 'Info', color: colors.textTertiary },
};

// ============================================================================
// TYPOGRAPHY STYLES
// ============================================================================
export const typography = StyleSheet.create({
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
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    color: colors.textTertiary,
  } as TextStyle,
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
// CARD STYLES — Stronger Elevation
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
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.strong,
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
// BUTTON STYLES — Clear, High-Contrast
// ============================================================================
export const buttonStyles = StyleSheet.create({
  // Primary = Dark, high-contrast, obvious
  primary: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
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
    letterSpacing: 0.2,
  } as TextStyle,
  
  // Secondary = Outlined, still clear
  secondary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
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
    color: colors.textPrimary,
  } as TextStyle,
  
  // Tertiary = Subtle filled
  tertiary: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    height: spacing.buttonHeightSmall,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: space[5],
  } as ViewStyle,
  tertiaryText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  } as TextStyle,
  
  // Ghost = Text only
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: radius.md,
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
    color: colors.brand,
  } as TextStyle,
  
  // Success action
  success: {
    backgroundColor: colors.success,
    borderRadius: radius.lg,
    height: spacing.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: space[6],
    ...shadows.sm,
  } as ViewStyle,
  successText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
    letterSpacing: 0.2,
  } as TextStyle,
});

// ============================================================================
// INPUT STYLES
// ============================================================================
export const inputStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: spacing.inputHeight,
    paddingHorizontal: space[4],
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  } as ViewStyle & TextStyle,
  focused: {
    borderColor: colors.brand,
  } as ViewStyle,
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
  primary: colors.brand,
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
