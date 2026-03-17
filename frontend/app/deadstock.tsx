import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../src/theme';
import { api } from '../src/api';

const BUCKETS = [
  { key: '90_plus', label: '90+ days', color: colors.error, urgency: 'Critical', icon: 'alert-octagon' },
  { key: '60_90', label: '60–90 days', color: '#B86A4B', urgency: 'High', icon: 'alert-triangle' },
  { key: '45_60', label: '45–60 days', color: colors.warning, urgency: 'Medium', icon: 'alert-circle' },
  { key: '30_45', label: '30–45 days', color: colors.accent, urgency: 'Watch', icon: 'clock' },
];

const ACTION_CONFIG: Record<string, { icon: string; label: string }> = {
  'Optimize listing': { icon: 'edit-3', label: 'Optimize listing' },
  'Crosslist or lower price': { icon: 'repeat', label: 'Crosslist or reprice' },
  'Lower price significantly': { icon: 'trending-down', label: 'Lower price 15-20%' },
  'Archive or bundle': { icon: 'archive', label: 'Archive or bundle' },
};

// Dead Stock Item Card
function DeadStockItem({ item, bucket, onPress }: { item: any; bucket: typeof BUCKETS[0]; onPress: () => void }) {
  const potential = (item.target_list_price || 0) - (item.total_cost_basis || 0);
  const action = ACTION_CONFIG[item.suggested_action] || { icon: 'info', label: item.suggested_action };

  return (
    <TouchableOpacity
      testID={`deadstock-item-${item.id}`}
      style={styles.itemCard}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.itemMain}>
        {/* Photo */}
        <View style={styles.itemPhoto}>
          <Feather name="camera" size={14} color={colors.textMuted} />
        </View>

        {/* Info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.itemStats}>
            <Text style={styles.itemDays}>{item.days_listed}d listed</Text>
            <Text style={styles.itemDot}>·</Text>
            <Text style={styles.itemCost}>${item.total_cost_basis} invested</Text>
          </View>
        </View>

        {/* Potential */}
        <View style={styles.itemPotential}>
          <Text style={[styles.potentialValue, { color: potential >= 0 ? colors.success : colors.error }]}>
            {potential >= 0 ? '+' : ''}${potential.toFixed(0)}
          </Text>
          <Text style={styles.potentialLabel}>potential</Text>
        </View>
      </View>

      {/* Action Suggestion */}
      {item.suggested_action && (
        <View style={[styles.actionSuggestion, { backgroundColor: bucket.color + '0A' }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: bucket.color + '15' }]}>
            <Feather name={action.icon as any} size={12} color={bucket.color} />
          </View>
          <Text style={[styles.actionText, { color: bucket.color }]}>{action.label}</Text>
          <Feather name="chevron-right" size={14} color={bucket.color} style={styles.actionArrow} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// Summary Stats Component
function SummaryStats({ data }: { data: Record<string, any[]> }) {
  const totalItems = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);
  const totalCapital = Object.values(data).flat().reduce((sum, item) => sum + (item.total_cost_basis || 0), 0);
  const criticalCount = (data['90_plus'] || []).length;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalItems}</Text>
          <Text style={styles.summaryLabel}>Items at risk</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>${totalCapital.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Capital tied</Text>
        </View>
        {criticalCount > 0 && (
          <>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.error }]}>{criticalCount}</Text>
              <Text style={styles.summaryLabel}>Critical</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

export default function DeadStockScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setData(await api.getDeadstock());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalItems = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);

  // Loading State
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading dead stock...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      testID="deadstock-screen"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <TouchableOpacity
        testID="back-btn"
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.6}
      >
        <Feather name="arrow-left" size={20} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Dead Stock</Text>
        <Text style={styles.subtitle}>
          {totalItems > 0 ? `${totalItems} items need attention` : 'Inventory health check'}
        </Text>
      </View>

      {/* Empty State */}
      {totalItems === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="check-circle" size={32} color={colors.success} />
          </View>
          <Text style={styles.emptyTitle}>All clear</Text>
          <Text style={styles.emptyText}>
            No stale inventory detected.{'\n'}Your stock is moving well.
          </Text>
        </View>
      ) : (
        <>
          {/* Summary */}
          <SummaryStats data={data} />

          {/* Buckets */}
          {BUCKETS.map((bucket) => {
            const items = data[bucket.key] || [];
            if (items.length === 0) return null;

            return (
              <View key={bucket.key} testID={`bucket-${bucket.key}`} style={styles.bucketSection}>
                {/* Bucket Header */}
                <View style={styles.bucketHeader}>
                  <View style={styles.bucketLeft}>
                    <View style={[styles.bucketIconWrap, { backgroundColor: bucket.color + '15' }]}>
                      <Feather name={bucket.icon as any} size={14} color={bucket.color} />
                    </View>
                    <View>
                      <Text style={styles.bucketLabel}>{bucket.label}</Text>
                      <Text style={[styles.bucketUrgency, { color: bucket.color }]}>{bucket.urgency}</Text>
                    </View>
                  </View>
                  <View style={[styles.bucketCount, { backgroundColor: bucket.color + '15' }]}>
                    <Text style={[styles.bucketCountText, { color: bucket.color }]}>{items.length}</Text>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.bucketItems}>
                  {items.map((item: any) => (
                    <DeadStockItem
                      key={item.id}
                      item={item}
                      bucket={bucket}
                      onPress={() => router.push(`/item/${item.id}`)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.containerPadding,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading
  loadingText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 16,
  },

  // Header
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadows.subtle,
  },
  header: {
    marginBottom: spacing.l,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
    marginBottom: spacing.sectionGap,
    ...shadows.card,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.divider,
  },
  summaryValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  summaryLabel: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Bucket Section
  bucketSection: {
    marginBottom: spacing.l,
  },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  bucketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bucketIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketLabel: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  bucketUrgency: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 12,
    marginTop: 1,
  },
  bucketCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
  },
  bucketCountText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 14,
  },

  // Bucket Items
  bucketItems: {
    gap: 10,
  },

  // Item Card
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    overflow: 'hidden',
    ...shadows.card,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  itemPhoto: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.m,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDays: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  itemDot: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 13,
    color: colors.textTertiary,
    marginHorizontal: 6,
  },
  itemCost: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 13,
    color: colors.textTertiary,
  },
  itemPotential: {
    alignItems: 'flex-end',
  },
  potentialValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  potentialLabel: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 1,
  },

  // Action Suggestion
  actionSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  actionIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 13,
  },
  actionArrow: {
    marginLeft: 'auto',
  },
});
