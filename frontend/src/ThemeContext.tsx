import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme definitions
export const themes = {
  // Default - Warm neutral (current)
  warm: {
    id: 'warm',
    name: 'Warm Sand',
    preview: ['#F5F4F2', '#27272A', '#8B7355'],
    colors: {
      background: '#F5F4F2',
      surface: '#FFFFFF',
      surfaceMuted: '#EDEBE8',
      brand: '#27272A',
      brandLight: '#3F3F46',
      accent: '#8B7355',
      accentLight: '#A89078',
      textPrimary: '#1C1917',
      textSecondary: '#57534E',
      textTertiary: '#78716C',
      textMuted: '#A8A29E',
      textInverse: '#FAFAF9',
      border: '#E7E5E4',
      divider: '#D6D3D1',
      success: '#16A34A',
      successLight: '#DCFCE7',
      warning: '#D97706',
      warningLight: '#FEF3C7',
      error: '#DC2626',
      errorLight: '#FEE2E2',
    },
  },
  // Cool - Blue/slate tones
  cool: {
    id: 'cool',
    name: 'Cool Slate',
    preview: ['#F8FAFC', '#0F172A', '#6366F1'],
    colors: {
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceMuted: '#F1F5F9',
      brand: '#0F172A',
      brandLight: '#1E293B',
      accent: '#6366F1',
      accentLight: '#818CF8',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textTertiary: '#64748B',
      textMuted: '#94A3B8',
      textInverse: '#F8FAFC',
      border: '#E2E8F0',
      divider: '#CBD5E1',
      success: '#10B981',
      successLight: '#D1FAE5',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      error: '#EF4444',
      errorLight: '#FEE2E2',
    },
  },
  // Dark - Dark mode
  dark: {
    id: 'dark',
    name: 'Midnight',
    preview: ['#0F0F0F', '#FAFAFA', '#A78BFA'],
    colors: {
      background: '#0F0F0F',
      surface: '#1A1A1A',
      surfaceMuted: '#262626',
      brand: '#FAFAFA',
      brandLight: '#E5E5E5',
      accent: '#A78BFA',
      accentLight: '#C4B5FD',
      textPrimary: '#FAFAFA',
      textSecondary: '#A3A3A3',
      textTertiary: '#737373',
      textMuted: '#525252',
      textInverse: '#0F0F0F',
      border: '#2E2E2E',
      divider: '#3D3D3D',
      success: '#22C55E',
      successLight: '#14532D',
      warning: '#FBBF24',
      warningLight: '#713F12',
      error: '#F87171',
      errorLight: '#7F1D1D',
    },
  },
};

export type ThemeId = keyof typeof themes;

interface ThemeContextType {
  themeId: ThemeId;
  theme: typeof themes.warm;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeId: 'warm',
  theme: themes.warm,
  setTheme: () => {},
});

const STORAGE_KEY = '@resellr_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('warm');

  useEffect(() => {
    // Load saved theme
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && themes[saved as ThemeId]) {
        setThemeId(saved as ThemeId);
      }
    });
  }, []);

  const setTheme = async (id: ThemeId) => {
    setThemeId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <ThemeContext.Provider value={{ themeId, theme: themes[themeId], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  const { theme } = useTheme();
  return theme.colors;
}
