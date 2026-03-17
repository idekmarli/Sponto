import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, borderRadius, shadows } from '../theme';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
  duration?: number;
}

export function Toast({ visible, message, type = 'success', onHide, duration = 2500 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const config = {
    success: { icon: 'check-circle', bg: colors.success, iconColor: '#FFFFFF' },
    error: { icon: 'alert-circle', bg: colors.error, iconColor: '#FFFFFF' },
    info: { icon: 'info', bg: colors.textPrimary, iconColor: '#FFFFFF' },
  }[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, backgroundColor: config.bg },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Feather name={config.icon as any} size={18} color={config.iconColor} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: borderRadius.l,
    ...shadows.strong,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
