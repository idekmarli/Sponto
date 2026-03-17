export const colors = {
  background: '#F7F6F3',
  surface: '#FFFFFF',
  surfaceHighlight: '#F0EDE8',
  surfaceElevated: '#FAFAF8',
  textPrimary: '#1A1A1C',
  textSecondary: '#78787C',
  textTertiary: '#B0B0B4',
  primary: '#2C2C2E',
  accent: '#9A8577',
  success: '#6B7F66',
  warning: '#B8725C',
  error: '#9E3B3B',
  border: '#EAEAE6',
  divider: '#F0EDE8',
  profit: '#6B7F66',
  loss: '#B8725C',
  cardBg: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  containerPadding: 22,
  cardPadding: 18,
  sectionGap: 28,
};

export const borderRadius = {
  xs: 6,
  s: 8,
  m: 14,
  l: 18,
  xl: 24,
  pill: 9999,
};

export const shadows = {
  subtle: {
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.04)',
    elevation: 1,
  },
  card: {
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  medium: {
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
    elevation: 4,
  },
  strong: {
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
    elevation: 6,
  },
};

export const typography = {
  displayLg: { fontSize: 48, lineHeight: 52, letterSpacing: -1.5 },
  display: { fontSize: 38, lineHeight: 42, letterSpacing: -1 },
  h1: { fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  h2: { fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 13, lineHeight: 18 },
  small: { fontSize: 11, lineHeight: 15 },
  micro: { fontSize: 10, lineHeight: 13 },
};

export const platformColors: Record<string, string> = {
  ebay: '#86868B',
  depop: '#86868B',
  vinted: '#86868B',
  vestiaire: '#86868B',
  poshmark: '#86868B',
  etsy: '#86868B',
  custom: '#86868B',
};

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

export const healthLabels: Record<string, { label: string; color: string }> = {
  fresh: { label: 'Fresh', color: colors.success },
  needs_listing: { label: 'Needs Listing', color: colors.accent },
  incomplete: { label: 'Incomplete', color: colors.textTertiary },
  stale: { label: 'Stale', color: colors.warning },
  dead_stock: { label: 'Dead Stock', color: colors.error },
  sold: { label: 'Sold', color: colors.success },
};
