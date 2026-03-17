import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, shadows, iconSize } from '../src/theme';
import { store } from '../src/store';

const SLIDES = [
  { icon: 'target', title: 'Source Smarter', description: 'Know if a deal is worth it before you buy. Get instant ROI and profit calculations.', color: colors.accent },
  { icon: 'layers', title: 'Track Everything', description: 'Follow each item from sourcing to sale. See your entire pipeline at a glance.', color: colors.success },
  { icon: 'trending-up', title: 'Understand Profit', description: "Real profit after all fees and costs. Know what's actually making you money.", color: colors.brand },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const completeOnboarding = async () => {
    await store.setOnboarded();
    router.replace('/(tabs)');
  };

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const isLastSlide = currentSlide === SLIDES.length - 1;

  return (
    <View testID="onboarding-screen" style={[styles.container, { paddingTop: insets.top + space[5], paddingBottom: Math.max(insets.bottom, space[5]) }]}>
      <TouchableOpacity testID="skip-onboarding" style={styles.skipBtn} onPress={completeOnboarding} activeOpacity={0.6}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.slideContainer}>
        {SLIDES.map((slide, index) => (
          <View key={index} style={[styles.slide, { opacity: currentSlide === index ? 1 : 0, display: currentSlide === index ? 'flex' : 'none' }]}>
            <View style={[styles.iconContainer, { backgroundColor: slide.color + '15' }]}>
              <Feather name={slide.icon as any} size={iconSize.xl + 16} color={slide.color} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dotsContainer}>
        {SLIDES.map((_, index) => (
          <View key={index} style={[styles.dot, currentSlide === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity testID="next-slide-btn" style={styles.actionBtn} onPress={nextSlide} activeOpacity={0.7}>
        <Text style={styles.actionText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
        <Feather name={isLastSlide ? 'check' : 'arrow-right'} size={iconSize.md} color={colors.textInverse} />
      </TouchableOpacity>

      <View style={styles.brand}>
        <Text style={styles.brandName}>Resellr</Text>
        <Text style={styles.brandTag}>OS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: space[5] },
  skipBtn: { alignSelf: 'flex-end', paddingVertical: space[2], paddingHorizontal: space[4] },
  skipText: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.textTertiary },
  slideContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  slide: { alignItems: 'center', paddingHorizontal: space[5] },
  iconContainer: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: space[10] },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize['3xl'], color: colors.textPrimary, textAlign: 'center', marginBottom: space[4], letterSpacing: -0.5 },
  description: { fontFamily: fontFamily.regular, fontSize: fontSize.lg, color: colors.textSecondary, textAlign: 'center', lineHeight: fontSize.lg * 1.5, maxWidth: 300 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: space[2], marginBottom: space[8] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.brand },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], backgroundColor: colors.brand, borderRadius: radius.full, paddingVertical: space[4] + 2, marginBottom: space[6], ...shadows.md },
  actionText: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textInverse },
  brand: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: space[2] },
  brandName: { fontFamily: fontFamily.bold, fontSize: fontSize.xl, color: colors.textTertiary },
  brandTag: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
});
