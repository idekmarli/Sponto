import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../src/ThemeContext';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows } from '../src/theme';
import { useCurrency } from '../src/currency';
import { api } from '../src/api';
import { EmptyState } from '../src/components/UI';

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

// Calculate repricing suggestion based on days listed
function getRepricingSuggestion(item: any, bucketKey: string): { 
  reduction: number; 
  newPrice: number; 
  stillProfitable: boolean;
  profitAtNewPrice: number;
} | null {
  const currentPrice = item.listed_price || item.target_list_price || 0;
  const costBasis = item.total_cost_basis || item.purchase_price || 0;
  
  if (!currentPrice || currentPrice <= 0) return null;
  
  // Calculate reduction percentage based on urgency
  let reductionPercent = 0;
  switch (bucketKey) {
    case '90_plus':
      reductionPercent = 25; // Critical - aggressive pricing
      break;
    case '60_90':
      reductionPercent = 18; // High urgency
      break;
    case '45_60':
      reductionPercent = 12; // Medium
      break;
    case '30_45':
      reductionPercent = 8; // Watch - gentle nudge
      break;
    default:
      reductionPercent = 10;
  }
  
  const reduction = Math.round(currentPrice * (reductionPercent / 100));
  const newPrice = currentPrice - reduction;
  const profitAtNewPrice = newPrice - costBasis;
  const stillProfitable = profitAtNewPrice > 0;
  
  return {
    reduction,
    newPrice,
    stillProfitable,
    profitAtNewPrice,
  };
}

// Dead Stock Item Card - Action-oriented with repricing
function DeadStockItem({ item, bucket, onPress, formatAmount, currencySymbol }: { 
  item: any; 
  bucket: typeof BUCKETS[0]; 
  onPress: () => void;
  formatAmount: (n: number) => string;
  currencySymbol: string;
}) {
  const potential = (item.target_list_price || 0) - (item.total_cost_basis || 0);
  const action = ACTION_CONFIG[item.suggested_action] || { icon: 'info', label: item.suggested_action };
  const repricing = getRepricingSuggestion(item, bucket.key);
  const currentPrice = item.listed_price || item.target_list_price || 0;

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
            <Text style={styles.itemCost}>{formatAmount(item.total_cost_basis)} invested</Text>
          </View>
        </View>

        {/* Potential */}
        <View style={styles.itemPotential}>
          <Text style={[styles.potentialValue, { color: potential >= 0 ? colors.success : colors.error }]}>
            {potential >= 0 ? '+' : ''}{formatAmount(potential)}
          </Text>
          <Text style={styles.potentialLabel}>potential</Text>
        </View>
      </View>

      {/* Repricing Suggestion Card */}
      {repricing && currentPrice > 0 && (
        <View style={styles.repricingCard}>
          <View style={styles.repricingHeader}>
            <Feather name="tag" size={12} color={colors.brand} />
            <Text style={styles.repricingTitle}>Suggested Price Drop</Text>
          </View>
          <View style={styles.repricingBody}>
            <View style={styles.priceChange}>
              <Text style={styles.currentPrice}>{currencySymbol}{currentPrice.toFixed(0)}</Text>
              <Feather name="arrow-right" size={14} color={colors.textTertiary} />
              <Text style={styles.newPrice}>{currencySymbol}{repricing.newPrice.toFixed(0)}</Text>
              <View style={[
                styles.savingsBadge,
                { backgroundColor: bucket.color + '15' }
              ]}>
                <Text style={[styles.savingsText, { color: bucket.color }]}>
                  -{Math.round((repricing.reduction / currentPrice) * 100)}%
                </Text>
              </View>
            </View>
            <View style={styles.profitIndicator}>
              {repricing.stillProfitable ? (
                <>
                  <Feather name="check-circle" size={12} color={colors.success} />
                  <Text style={styles.profitText}>
                    Still profitable: +{currencySymbol}{repricing.profitAtNewPrice.toFixed(0)}
                  </Text>
                </>
              ) : (
                <>
                  <Feather name="alert-circle" size={12} color={colors.warning} />
                  <Text style={[styles.profitText, { color: colors.warning }]}>
                    Break-even or loss - consider bundling
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Action Suggestion - Action-oriented */}
      {item.suggested_action && (
        <View style={[styles.actionSuggestion, { backgroundColor: bucket.color + '08' }]}>
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
function SummaryStats({ data, formatAmount }: { data: Record<string, any[]>; formatAmount: (n: number) => string }) {
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
          <Text style={styles.summaryValue}>{formatAmount(totalCapital)}</Text>
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
  const { formatAmount, currency } = useCurrency();
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.getDeadstock();
      // API returns { buckets: { ... }, total_stale_items, total_capital_locked }
      setData(response?.buckets || {});
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space[2] }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header with Back */}
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

      {/* Empty State - Celebratory */}
      {totalItems === 0 ? (
        <EmptyState
          icon="check-circle"
          title="All clear"
          description="No stale inventory detected. Your stock is moving well."
          variant="success"
        />
      ) : (
        <>
          {/* Summary */}
          <SummaryStats data={data} formatAmount={formatAmount} />

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
                      formatAmount={formatAmount}
                      currencySymbol={currency.symbol}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </>
      )}

      <View style={{ height: space[8] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: space[4],
  },

  // Header
  backButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[4],
    ...shadows.xs,
  },
  header: {
    marginBottom: space[6],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    color: colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: space[1],
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
    marginBottom: space[8],
    ...shadows.sm,
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
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: space[1],
  },
  summaryLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },

  // Bucket Section
  bucketSection: {
    marginBottom: space[6],
  },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[3] + 2,
  },
  bucketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  bucketIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  bucketUrgency: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  bucketCount: {
    paddingHorizontal: space[3],
    paddingVertical: space[1] + 2,
    borderRadius: radius.full,
  },
  bucketCountText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },

  // Bucket Items
  bucketItems: {
    gap: space[2] + 2,
  },

  // Item Card
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[3] + 2,
    gap: space[3],
  },
  itemPhoto: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: space[1],
  },
  itemStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDays: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  itemDot: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginHorizontal: space[1] + 2,
  },
  itemCost: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  itemPotential: {
    alignItems: 'flex-end',
  },
  potentialValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    letterSpacing: -0.3,
  },
  potentialLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 1,
  },

  // Action Suggestion
  actionSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    paddingHorizontal: space[3] + 2,
    gap: space[2] + 2,
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
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
  },
  actionArrow: {
    marginLeft: 'auto',
  },

  // Repricing Card
  repricingCard: {
    backgroundColor: colors.surfaceMuted,
    marginHorizontal: space[3],
    marginBottom: space[2],
    padding: space[3],
    borderRadius: radius.md,
  },
  repricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginBottom: space[2],
  },
  repricingTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  repricingBody: {
    gap: space[2],
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  currentPrice: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  savingsBadge: {
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: space[1],
  },
  savingsText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
  },
  profitIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  profitText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.success,
  },
});
