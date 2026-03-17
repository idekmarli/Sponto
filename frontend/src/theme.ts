// Resellr OS Design System
// A unified, premium, calm design language

import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

// ============================================================================
// COLOR PALETTE
// ============================================================================
export const colors = {
  // Backgrounds
  background: '#F9F8F6',
  surface: '#FFFFFF',
  surfaceSecondary: '#FAFAF8',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F4F3F0',
  
  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#5C5C5C',
  textTertiary: '#8C8C8C',
  textMuted: '#BABABA',
  textInverse: '#FFFFFF',
  
  // Brand
  brand: '#2D2D2D',
  accent: '#7A6B54',
  accentLight: '#A69B87',
  
  // Semantic - Success
  success: '#4A7C59',
  successLight: '#EDF4EF',
  successMuted: '#C5D9CB',
  
  // Semantic - Warning
  warning: '#B5783A',
  warningLight: '#FBF4ED',
  warningMuted: '#E5CDB4',
  
  // Semantic - Error
  error: '#A94442',
  errorLight: '#FAEEEE',
  errorMuted: '#DDB8B7',
  
  // Semantic - Info
  info: '#4A6B8A',
  infoLight: '#EDF1F5',
  
  // UI Elements
  border: '#E5E3DE',
  borderLight: '#EEECE8',
  divider: '#F0EEEA',
  
  // Interactive
  interactive: '#2D2D2D',
  interactiveHover: '#404040',
  interactiveDisabled: '#CCCCCC',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.08)',
} as const;

// ============================================================================
// SPACING SCALE (8pt grid)
// ============================================================================
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

// Semantic spacing
export const spacing = {
  screenPadding: space[5],
  cardPadding: space[4],
  cardPaddingLarge: space[5],
  sectionGap: space[8],
  itemGap: space[3],
  inlineGap: space[2],
  inputHeight: 52,
  buttonHeight: 52,
  buttonHeightSmall: 44,
  touchTarget: 44,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// ============================================================================
// SHADOWS
// ============================================================================
export const shadows = {
  none: {},
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const fontFamily = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.5,
  loose: 1.75,
} as const;

export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.2,
} as const;

// Typography presets
export const typography = StyleSheet.create({
  // Display
  displayLarge: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['5xl'],
    lineHeight: fontSize['5xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
    color: colors.textPrimary,
  },
  display: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['4xl'],
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
    color: colors.textPrimary,
  },
  
  // Headings
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
    color: colors.textPrimary,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
    color: colors.textPrimary,
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
    color: colors.textPrimary,
  },
  h4: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.snug,
    color: colors.textPrimary,
  },
  
  // Body
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.relaxed,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.relaxed,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.relaxed,
    color: colors.textSecondary,
  },
  
  // Labels & Captions
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    color: colors.textSecondary,
  },
  labelSmall: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase' as const,
    color: colors.textTertiary,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    color: colors.textTertiary,
  },
  
  // Mono (for numbers)
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  monoLarge: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.xl,
    letterSpacing: letterSpacing.tight,
    color: colors.textPrimary,
  },
});

// ============================================================================
// COMPONENT STYLES
// ============================================================================

// Card styles
export const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  padded: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
    ...shadows.sm,
  },
  elevated: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
    ...shadows.md,
  },
  flat: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

// Button styles
export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.brand,
    borderRadius: radius.full,
    height: spacing.buttonHeight,
    paddingHorizontal: space[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    ...shadows.md,
  },
  primaryText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    height: spacing.buttonHeight,
    paddingHorizontal: space[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    ...shadows.xs,
  },
  secondaryText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: radius.full,
    height: spacing.buttonHeight,
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  ghostText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  success: {
    backgroundColor: colors.success,
    borderRadius: radius.full,
    height: spacing.buttonHeight,
    paddingHorizontal: space[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    ...shadows.md,
  },
  danger: {
    backgroundColor: colors.error,
    borderRadius: radius.full,
    height: spacing.buttonHeight,
    paddingHorizontal: space[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    ...shadows.md,
  },
  small: {
    height: spacing.buttonHeightSmall,
    paddingHorizontal: space[4],
  },
  disabled: {
    opacity: 0.4,
  },
});

// Chip/Badge styles
export const chipStyles = StyleSheet.create({
  base: {
    paddingHorizontal: space[3],
    paddingVertical: space[1] + 2,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  default: {
    backgroundColor: colors.surfaceMuted,
  },
  active: {
    backgroundColor: colors.brand,
  },
  success: {
    backgroundColor: colors.successLight,
  },
  warning: {
    backgroundColor: colors.warningLight,
  },
  error: {
    backgroundColor: colors.errorLight,
  },
  text: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.textInverse,
  },
});

// Input styles
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
  },
  focused: {
    borderWidth: 2,
    borderColor: colors.brand,
  },
  error: {
    borderWidth: 1,
    borderColor: colors.error,
  },
});

// ============================================================================
// STATUS & HEALTH CONFIGURATIONS
// ============================================================================

export const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  sourced: { label: 'Sourced', color: colors.accent, bg: '#F5F3EF' },
  intake: { label: 'Intake', color: colors.accent, bg: '#F5F3EF' },
  photographed: { label: 'Photographed', color: colors.accent, bg: '#F5F3EF' },
  listed: { label: 'Listed', color: colors.success, bg: colors.successLight },
  crosslisted: { label: 'Crosslisted', color: colors.success, bg: colors.successLight },
  sold: { label: 'Sold', color: colors.success, bg: colors.successLight },
  shipped: { label: 'Shipped', color: colors.success, bg: colors.successLight },
  completed: { label: 'Completed', color: colors.textTertiary, bg: colors.surfaceMuted },
};

export const healthConfig: Record<string, { label: string; color: string; bg: string; priority: number }> = {
  fresh: { label: 'Fresh', color: colors.success, bg: colors.successLight, priority: 1 },
  needs_listing: { label: 'Needs Listing', color: colors.accent, bg: '#F5F3EF', priority: 2 },
  incomplete: { label: 'Incomplete', color: colors.textTertiary, bg: colors.surfaceMuted, priority: 3 },
  stale: { label: 'Stale', color: colors.warning, bg: colors.warningLight, priority: 4 },
  dead_stock: { label: 'Dead Stock', color: colors.error, bg: colors.errorLight, priority: 5 },
  sold: { label: 'Sold', color: colors.success, bg: colors.successLight, priority: 0 },
};

export const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'URGENT', color: colors.error },
  2: { label: 'HIGH', color: colors.warning },
  3: { label: 'MEDIUM', color: colors.accent },
  4: { label: 'ACTION', color: colors.textSecondary },
  5: { label: 'LIST', color: colors.textSecondary },
  6: { label: 'CLEANUP', color: colors.textTertiary },
  7: { label: 'FIX', color: colors.textTertiary },
};

export const actionTypeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  dead_stock: { icon: 'alert-triangle', color: colors.error, bg: colors.errorLight },
  critical_stale: { icon: 'alert-circle', color: colors.warning, bg: colors.warningLight },
  stale_crosslist: { icon: 'copy', color: colors.warning, bg: colors.warningLight },
  stale_reprice: { icon: 'trending-down', color: colors.warning, bg: colors.warningLight },
  crosslist: { icon: 'copy', color: colors.accent, bg: '#F5F3EF' },
  approaching_stale: { icon: 'clock', color: colors.accent, bg: '#F5F3EF' },
  needs_listing: { icon: 'tag', color: colors.success, bg: colors.successLight },
  sold_pending: { icon: 'dollar-sign', color: colors.success, bg: colors.successLight },
  shipped_pending: { icon: 'truck', color: colors.success, bg: colors.successLight },
  incomplete: { icon: 'edit-3', color: colors.textTertiary, bg: colors.surfaceMuted },
};

// ============================================================================
// ICON SIZES
// ============================================================================
export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

// ============================================================================
// CHART COLORS
// ============================================================================
export const chartColors = {
  primary: colors.brand,
  secondary: colors.accent,
  positive: colors.success,
  negative: colors.warning,
  muted: colors.surfaceMuted,
  grid: colors.borderLight,
};
