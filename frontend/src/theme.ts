// Resellr OS Design System
// A premium, calm, operational design language

export const colors = {
  // Backgrounds
  background: '#F8F7F4',
  surface: '#FFFFFF',
  surfaceSecondary: '#FAF9F7',
  surfaceHighlight: '#F2F0EC',
  surfaceElevated: '#FFFFFF',
  
  // Text hierarchy
  textPrimary: '#1C1C1E',
  textSecondary: '#6E6E73',
  textTertiary: '#AEAEB2',
  textMuted: '#C7C7CC',
  
  // Brand
  primary: '#1C1C1E',
  accent: '#8B7355',
  accentLight: '#A8957A',
  
  // Semantic
  success: '#5D7052',
  successLight: '#EEF2EC',
  warning: '#B86A4B',
  warningLight: '#F9F0EC',
  error: '#9E4848',
  errorLight: '#F9ECEC',
  info: '#5A6B7C',
  infoLight: '#EDF0F3',
  
  // UI
  border: '#E8E6E1',
  borderLight: '#F0EEE9',
  divider: '#F2F0EB',
  
  // Profit/Loss
  profit: '#5D7052',
  loss: '#B86A4B',
  
  // Cards
  cardBg: '#FFFFFF',
  cardBgSecondary: '#FAFAF8',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  s: 8,
  sm: 10,
  m: 16,
  ml: 20,
  l: 24,
  xl: 32,
  xxl: 40,
  xxxl: 56,
  
  // Semantic spacing
  containerPadding: 20,
  cardPadding: 16,
  cardPaddingLarge: 20,
  sectionGap: 32,
  itemGap: 12,
  inputHeight: 52,
  buttonHeight: 54,
};

export const borderRadius = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
};

export const typography = {
  // Display
  displayLarge: { fontSize: 52, lineHeight: 56, letterSpacing: -1.5 },
  display: { fontSize: 44, lineHeight: 48, letterSpacing: -1.2 },
  
  // Headings
  h1: { fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  h2: { fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  h3: { fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  h4: { fontSize: 17, lineHeight: 23, letterSpacing: -0.1 },
  
  // Body
  bodyLarge: { fontSize: 16, lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  
  // Caption / Labels
  caption: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
  small: { fontSize: 11, lineHeight: 15, letterSpacing: 0.2 },
  micro: { fontSize: 10, lineHeight: 13, letterSpacing: 0.4 },
};

// Platform colors (muted, editorial)
export const platformColors: Record<string, string> = {
  ebay: '#6E6E73',
  depop: '#6E6E73',
  vinted: '#6E6E73',
  vestiaire: '#6E6E73',
  poshmark: '#6E6E73',
  etsy: '#6E6E73',
  custom: '#6E6E73',
};

// Status labels
export const statusLabels: Record<string, string> = {
  sourced: 'Sourced',
  intake: 'Intake',
  photographed: 'Photographed',
  listed: 'Listed',
  crosslisted: 'Crosslisted',
  sold: 'Sold',
  shipped: 'Shipped',
  completed: 'Completed',
};

// Health states with refined colors
export const healthLabels: Record<string, { label: string; color: string; bg: string }> = {
  fresh: { label: 'Fresh', color: colors.success, bg: colors.successLight },
  needs_listing: { label: 'Needs Listing', color: colors.accent, bg: '#F5F1ED' },
  incomplete: { label: 'Incomplete', color: colors.textTertiary, bg: colors.surfaceHighlight },
  stale: { label: 'Stale', color: colors.warning, bg: colors.warningLight },
  dead_stock: { label: 'Dead Stock', color: colors.error, bg: colors.errorLight },
  sold: { label: 'Sold', color: colors.success, bg: colors.successLight },
};

// Action type configurations
export const actionConfig: Record<string, { icon: string; color: string; bg: string }> = {
  dead_stock: { icon: 'alert-triangle', color: colors.error, bg: colors.errorLight },
  critical_stale: { icon: 'alert-circle', color: colors.warning, bg: colors.warningLight },
  stale_crosslist: { icon: 'copy', color: colors.warning, bg: colors.warningLight },
  stale_reprice: { icon: 'trending-down', color: colors.warning, bg: colors.warningLight },
  crosslist: { icon: 'copy', color: colors.accent, bg: '#F5F1ED' },
  approaching_stale: { icon: 'clock', color: colors.accent, bg: '#F5F1ED' },
  needs_listing: { icon: 'tag', color: colors.success, bg: colors.successLight },
  sold_pending: { icon: 'dollar-sign', color: colors.success, bg: colors.successLight },
  shipped_pending: { icon: 'truck', color: colors.success, bg: colors.successLight },
  incomplete: { icon: 'edit-3', color: colors.textTertiary, bg: colors.surfaceHighlight },
};

// Priority badge colors
export const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'URGENT', color: colors.error },
  2: { label: 'HIGH', color: colors.warning },
  3: { label: 'MEDIUM', color: colors.accent },
  4: { label: 'ACTION', color: colors.textSecondary },
  5: { label: 'LIST', color: colors.textSecondary },
  6: { label: 'CLEANUP', color: colors.textTertiary },
  7: { label: 'FIX', color: colors.textTertiary },
};
