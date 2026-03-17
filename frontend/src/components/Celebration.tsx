import React, { useEffect, useRef } from 'react';
import { useTheme } from '../ThemeContext';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, space, radius, fontFamily, fontSize, shadows } from '../theme';

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#22C55E', // success green
  '#6366F1', // indigo
  '#EC4899', // pink
  '#F59E0B', // amber
  '#14B8A6', // teal
  '#8B5CF6', // purple
];

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
}

interface CelebrationProps {
  visible: boolean;
  message: string;
  subMessage?: string;
  onComplete: () => void;
}

export function Celebration({ visible, message, subMessage, onComplete }: CelebrationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const confettiPieces = useRef<ConfettiPiece[]>([]);

  // Create confetti pieces
  if (confettiPieces.current.length === 0) {
    for (let i = 0; i < 30; i++) {
      confettiPieces.current.push({
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(-50),
        rotation: new Animated.Value(0),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 8 + Math.random() * 8,
      });
    }
  }

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate confetti
      confettiPieces.current.forEach((piece, index) => {
        piece.y.setValue(-50);
        piece.x.setValue(Math.random() * width);
        piece.rotation.setValue(0);

        Animated.parallel([
          Animated.timing(piece.y, {
            toValue: height + 50,
            duration: 2000 + Math.random() * 1000,
            delay: index * 50,
            useNativeDriver: true,
          }),
          Animated.timing(piece.x, {
            toValue: piece.x._value + (Math.random() - 0.5) * 100,
            duration: 2000 + Math.random() * 1000,
            delay: index * 50,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotation, {
            toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
            duration: 2000,
            delay: index * 50,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Auto-dismiss after 2.5 seconds
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onComplete();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {/* Confetti */}
      {confettiPieces.current.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {/* Message Card */}
      <Animated.View
        style={[
          styles.messageCard,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.message}>{message}</Text>
        {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
  },
  messageCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[8],
    alignItems: 'center',
    minWidth: 250,
    ...shadows.large,
  },
  emoji: {
    fontSize: 48,
    marginBottom: space[4],
  },
  message: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: space[2],
  },
  subMessage: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.success,
    textAlign: 'center',
  },
});
