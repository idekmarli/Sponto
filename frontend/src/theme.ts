export const colors = {
  background: '#F9F8F6',
  surface: '#FFFFFF',
  surfaceHighlight: '#F2F0ED',
  textPrimary: '#1C1C1E',
  textSecondary: '#6E6E73',
  textTertiary: '#AEAEB2',
  primary: '#2C2C2E',
  accent: '#8C7B70',
  success: '#7A8C75',
  warning: '#BC7C68',
  error: '#A64444',
  border: '#E5E5EA',
  divider: '#F0F0F0',
  profit: '#7A8C75',
  loss: '#BC7C68',
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  containerPadding: 20,
  cardPadding: 16,
};

export const borderRadius = {
  s: 4,
  m: 12,
  l: 16,
  xl: 24,
  pill: 9999,
};

export const shadows = {
  subtle: {
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  medium: {
    boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
};

export const typography = {
  display: { fontSize: 42, lineHeight: 48, letterSpacing: -1 },
  h1: { fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  h2: { fontSize: 24, lineHeight: 30 },
  h3: { fontSize: 20, lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 22 },
  caption: { fontSize: 14, lineHeight: 20 },
  small: { fontSize: 12, lineHeight: 16 },
};

export const platformColors: Record<string, string> = {
  ebay: '#E53238',
  depop: '#FF2300',
  vinted: '#09B1BA',
  vestiaire: '#1A1A1A',
  poshmark: '#7F0353',
  etsy: '#F1641E',
  custom: '#8C7B70',
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
  needs_listing: { label: 'Needs Listing', color: colors.warning },
  incomplete: { label: 'Incomplete', color: colors.textTertiary },
  stale: { label: 'Stale', color: colors.warning },
  dead_stock: { label: 'Dead Stock', color: colors.error },
  sold: { label: 'Sold', color: colors.success },
};
