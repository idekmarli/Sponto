import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts } from '@expo-google-fonts/dm-sans';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { CurrencyProvider } from '../src/currency';
import { ThemeProvider, useTheme } from '../src/ThemeContext';
import { ErrorBoundary } from '../src/ErrorBoundary';
import { OfflineBanner } from '../src/NetworkStatus';
import { analytics } from '../src/analytics';

function AppContent() {
  const { colors, themeId } = useTheme();

  // Initialize analytics on app start
  useEffect(() => {
    analytics.init();
  }, []);
  
  return (
    <ErrorBoundary>
      <StatusBar style={themeId === 'midnight' ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="add-item" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="quick-add" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="add-from-screenshot" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="deadstock" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="listing-builder" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8B7355" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CurrencyProvider>
          <AppContent />
        </CurrencyProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F4F2',
  },
});
