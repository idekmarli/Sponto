import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, space, radius, fontFamily, fontSize, shadows } from '../src/theme';
import { store } from '../src/store';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'target',
    emoji: '🎯',
    title: 'Source Smarter',
    subtitle: 'Know before you buy',
    description: 'Get instant ROI calculations. Never second-guess a deal again.',
    gradient: ['#F59E0B', '#D97706'],
    tip: 'Tip: Set your target ROI in Settings',
  },
  {
    icon: 'layers',
    emoji: '📦',
    title: 'Track Everything',
    subtitle: 'From thrift to sale',
    description: 'Follow each item through your workflow. Photos, prices, platforms — all in one place.',
    gradient: ['#8B5CF6', '#7C3AED'],
    tip: 'Tip: Long-press items to quick-move them',
  },
  {
    icon: 'trending-up',
    emoji: '💰',
    title: 'Real Profit',
    subtitle: 'After all the fees',
    description: 'See what you actually make. Platform fees, shipping, costs — all calculated automatically.',
    gradient: ['#10B981', '#059669'],
    tip: 'Tip: Customize fee rates in Settings',
  },
  {
    icon: 'zap',
    emoji: '⚡',
    title: 'Ready to Start',
    subtitle: 'Your reselling journey',
    description: 'Add your first item or try the Source Calculator to analyze a potential buy.',
    gradient: ['#8B7355', '#6B5344'],
    tip: 'Premium sample data included',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateSlide = (toIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentSlide(toIndex);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const completeOnboarding = async () => {
    await store.setOnboarded();
    router.replace('/(tabs)');
  };

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      animateSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const goToSlide = (index: number) => {
    if (index !== currentSlide) {
      animateSlide(index);
    }
  };

  const isLastSlide = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];

  return (
    <View testID="onboarding-screen" style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={slide.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      />
      
      {/* Skip Button */}
      <View style={[styles.header, { paddingTop: insets.top + space[2] }]}>
        {!isLastSlide ? (
          <TouchableOpacity 
            testID="skip-onboarding" 
            style={styles.skipBtn} 
            onPress={completeOnboarding} 
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : <View />}
      </View>

      {/* Slide Content */}
      <Animated.View style={[styles.slideContainer, { opacity: fadeAnim }]}>
        {/* Large Emoji Icon */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>

        {/* Title & Description */}
        <View style={styles.textContainer}>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <Feather name="info" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.tipText}>{slide.tip}</Text>
        </View>
      </Animated.View>

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + space[4], space[8]) }]}>
        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => goToSlide(index)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.dot,
                currentSlide === index && styles.dotActive
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          testID="next-slide-btn" 
          style={styles.actionBtn} 
          onPress={nextSlide} 
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>
            {isLastSlide ? "Let's Go" : 'Continue'}
          </Text>
          <View style={styles.actionIconWrap}>
            <Feather 
              name={isLastSlide ? 'check' : 'arrow-right'} 
              size={20} 
              color={slide.gradient[0]} 
            />
          </View>
        </TouchableOpacity>

        {/* Brand */}
        <View style={styles.brand}>
          <Text style={styles.brandName}>Resellr</Text>
          <Text style={styles.brandTag}>OS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: space[5],
  },
  skipBtn: {
    paddingVertical: space[2],
    paddingHorizontal: space[4],
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full,
  },
  skipText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space[6],
  },
  emojiContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[8],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emoji: {
    fontSize: 64,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: space[6],
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: space[2],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    color: '#fff',
    textAlign: 'center',
    marginBottom: space[4],
    letterSpacing: -1,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: fontSize.lg * 1.5,
    maxWidth: 320,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.lg,
  },
  tipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  bottomSection: {
    paddingHorizontal: space[6],
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space[2],
    marginBottom: space[6],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[3],
    backgroundColor: '#fff',
    borderRadius: radius.full,
    paddingVertical: space[4],
    marginBottom: space[5],
    ...shadows.lg,
  },
  actionText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: space[2],
  },
  brandName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.6)',
  },
  brandTag: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
