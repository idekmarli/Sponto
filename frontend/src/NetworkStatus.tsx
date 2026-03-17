import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Feather } from '@expo/vector-icons';
import { colors, space, fontFamily, fontSize } from './theme';

// Hook to track network status
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Check initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  return {
    isConnected,
    isInternetReachable,
    isOffline: isConnected === false || isInternetReachable === false,
  };
}

// Offline Banner Component
export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (isOffline) {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isOffline, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.banner,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Feather name="wifi-off" size={16} color={colors.textInverse} />
      <Text style={styles.bannerText}>You're offline. Some features may be unavailable.</Text>
    </Animated.View>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'inbox', title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Feather name={icon as any} size={32} color={colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction && (
        <View style={styles.emptyAction}>
          <Text style={styles.emptyActionText} onPress={onAction}>{actionLabel}</Text>
        </View>
      )}
    </View>
  );
}

// Predefined empty states
export const EMPTY_STATES = {
  inventory: {
    icon: 'package',
    title: 'No items yet',
    message: 'Add your first item to start tracking your inventory',
    actionLabel: 'Add Item',
  },
  pipeline: {
    icon: 'layers',
    title: 'Pipeline is empty',
    message: 'Items will appear here as you move them through your workflow',
  },
  actions: {
    icon: 'check-circle',
    title: 'All caught up!',
    message: 'No urgent actions right now. Great job staying on top of things.',
  },
  search: {
    icon: 'search',
    title: 'No results found',
    message: 'Try adjusting your search or filters',
  },
  deadstock: {
    icon: 'trending-up',
    title: 'No dead stock!',
    message: 'Your inventory is moving well. Keep up the great work!',
  },
  insights: {
    icon: 'bar-chart-2',
    title: 'No data yet',
    message: 'Start selling items to see your business insights',
  },
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    zIndex: 1000,
  },
  bannerText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textInverse,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[8],
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[4],
  },
  emptyTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: space[2],
  },
  emptyMessage: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: fontSize.sm * 1.5,
  },
  emptyAction: {
    marginTop: space[4],
  },
  emptyActionText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.brand,
  },
});

export default OfflineBanner;
