import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../src/theme';
import { store } from '../src/store';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'target',
    title: 'Source Smarter',
    description: 'Know if a deal is worth it before you buy. Get instant ROI and profit calculations.',
    color: colors.accent,
  },
  {
    icon: 'layers',
    title: 'Track Everything',
    description: 'Follow each item from sourcing to sale. See your entire pipeline at a glance.',
    color: colors.success,
  },
  {
    icon: 'trending-up',
    title: 'Understand Profit',
    description: 'Real profit after all fees and costs. Know what\'s actually making you money.',
    color: colors.textPrimary,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

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
    <View testID="onboarding-screen" style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 20) }]}>
      {/* Skip Button */}
      <TouchableOpacity
        testID="skip-onboarding"
        style={styles.skipBtn}
        onPress={completeOnboarding}
        activeOpacity={0.6}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slide Content */}
      <View style={styles.slideContainer}>
        {SLIDES.map((slide, index) => (
          <View
            key={index}
            style={[
              styles.slide,
              { opacity: currentSlide === index ? 1 : 0, display: currentSlide === index ? 'flex' : 'none' }
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: slide.color + '15' }]}>
              <Feather name={slide.icon as any} size={48} color={slide.color} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </View>

      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentSlide === index && styles.dotActive
            ]}
          />
        ))}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        testID="next-slide-btn"
        style={styles.actionBtn}
        onPress={nextSlide}
        activeOpacity={0.7}
      >
        <Text style={styles.actionText}>
          {isLastSlide ? 'Get Started' : 'Next'}
        </Text>
        <Feather name={isLastSlide ? 'check' : 'arrow-right'} size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Brand */}
      <View style={styles.brand}>
        <Text style={styles.brandName}>Resellr</Text>
        <Text style={styles.brandTag}>OS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.containerPadding,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 15,
    color: colors.textTertiary,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.textPrimary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.pill,
    paddingVertical: 18,
    marginBottom: 24,
    ...shadows.medium,
  },
  actionText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
  },
  brandName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: colors.textTertiary,
  },
  brandTag: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
