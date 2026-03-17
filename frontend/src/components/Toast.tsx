import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, radius, fontFamily, fontSize, shadows, iconSize } from '../theme';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
  duration?: number;
}

export function Toast({ visible, message, type = 'success', onHide, duration = 2500 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

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
    success: { icon: 'check-circle', bg: colors.success },
    error: { icon: 'alert-circle', bg: colors.error },
    info: { icon: 'info', bg: colors.brand },
  }[type];

  return (
    <Animated.View style={[styles.container, { top: insets.top + space[2], backgroundColor: config.bg }, { opacity, transform: [{ translateY }] }]}>
      <Feather name={config.icon as any} size={iconSize.md} color={colors.textInverse} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: space[5], right: space[5], flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[4], paddingHorizontal: space[4], borderRadius: radius.lg, ...shadows.lg, zIndex: 9999 },
  message: { flex: 1, fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.textInverse },
});
