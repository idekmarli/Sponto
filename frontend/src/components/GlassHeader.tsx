import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows } from '../theme';

interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  backButton?: boolean;
  onBack?: () => void;
}

export function GlassHeader({ title, subtitle, rightAction, backButton, onBack }: GlassHeaderProps) {
  const insets = useSafeAreaInsets();

  const HeaderContent = () => (
    <View style={[styles.headerContent, { paddingTop: insets.top + space[2] }]}>
      <View style={styles.headerLeft}>
        {backButton && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={rightAction.onPress} activeOpacity={0.7}>
          <Feather name={rightAction.icon as any} size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );

  // For web, use a semi-transparent background with backdrop blur CSS
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.webGlass, { paddingTop: 0 }]}>
        <HeaderContent />
      </View>
    );
  }

  // For native, use BlurView
  return (
    <BlurView intensity={80} tint="light" style={styles.container}>
      <View style={styles.blurOverlay}>
        <HeaderContent />
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  webGlass: {
    backgroundColor: 'rgba(245, 244, 242, 0.85)',
    // @ts-ignore - web only
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  blurOverlay: {
    backgroundColor: 'rgba(245, 244, 242, 0.7)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: space[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
