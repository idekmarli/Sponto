import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';
import { api } from '../../src/api';

interface InsightsData {
  platform_revenue: Record<string, number>;
  platform_profit: Record<string, number>;
  category_performance: Record<string, { revenue: number; profit: number; count: number }>;
  avg_roi: number;
  avg_days_to_sell: number;
  dead_stock_percentage: number;
  capital_in_stale: number;
  monthly_trends: Array<{ month: string; revenue: number; profit: number }>;
  total_sold: number;
  total_active: number;
}

// Bar Chart Component
function BarChart({ data, valueKey, colorFn }: { 
  data: Array<{ month: string; [key: string]: any }>; 
  valueKey: string;
  colorFn?: (value: number, isLast: boolean) => string;
}) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => Math.abs(d[valueKey])), 1);

  return (
    <View style={chartStyles.container}>
      {data.map((d, i) => {
        const value = d[valueKey];
        const h = Math.max((Math.abs(value) / maxVal) * 64, 4);
        const isLast = i === data.length - 1;
        const barColor = colorFn ? colorFn(value, isLast) : (isLast ? colors.accent : colors.surfaceHighlight);
        
        return (
          <View key={i} style={chartStyles.col}>
            <Text style={[chartStyles.value, isLast && { color: colors.textPrimary }]}>
              ${Math.abs(value)}
            </Text>
            <View style={chartStyles.barArea}>
              <View style={[chartStyles.bar, { height: h, backgroundColor: barColor }]} />
            </View>
            <Text style={[chartStyles.label, isLast && chartStyles.labelActive]}>{d.month}</Text>
          </View>
        );
      })}
    </View>
  );
}

// Horizontal Progress Bar
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = Math.max((value / max) * 100, 4);
  return (
    <View style={progressStyles.container}>
      <View style={[progressStyles.fill, { width: `${width}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async () => {
    try {
      setData(await api.getInsights());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Loading State
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  // Empty State
  if (!data) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <View style={styles.emptyIcon}>
          <Feather name="bar-chart-2" size={28} color={colors.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>No data yet</Text>
        <Text style={styles.emptyText}>Start selling to see your business insights</Text>
      </View>
    );
  }

  const platformEntries = Object.entries(data.platform_revenue).sort((a, b) => b[1] - a[1]);
  const categoryEntries = Object.entries(data.category_performance).sort((a, b) => b[1].profit - a[1].profit);
  const maxPlatformRev = Math.max(...platformEntries.map(x => x[1]), 1);
  const maxCategoryProfit = Math.max(...categoryEntries.map(x => x[1].profit), 1);

  return (
    <ScrollView
      testID="insights-screen"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchInsights(); }}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Business performance</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View testID="stat-roi" style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.avg_roi}%</Text>
          <Text style={styles.metricLabel}>Avg ROI</Text>
        </View>
        <View testID="stat-days" style={styles.metricCard}>
          <Text style={styles.metricValue}>{data.avg_days_to_sell}</Text>
          <Text style={styles.metricLabel}>Avg Days to Sell</Text>
        </View>
        <View testID="stat-deadstock" style={[styles.metricCard, data.dead_stock_percentage > 20 && styles.metricCardWarning]}>
          <Text style={[styles.metricValue, data.dead_stock_percentage > 20 && { color: colors.warning }]}>
            {data.dead_stock_percentage}%
          </Text>
          <Text style={styles.metricLabel}>Dead Stock</Text>
        </View>
        <View testID="stat-stale-capital" style={styles.metricCard}>
          <Text style={styles.metricValue}>${data.capital_in_stale}</Text>
          <Text style={styles.metricLabel}>Stale Capital</Text>
        </View>
      </View>

      {/* Monthly Revenue */}
      {data.monthly_trends.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Revenue</Text>
          <View style={styles.chartCard}>
            <BarChart 
              data={data.monthly_trends} 
              valueKey="revenue"
              colorFn={(_, isLast) => isLast ? colors.accent : colors.surfaceHighlight}
            />
          </View>
        </View>
      )}

      {/* Monthly Profit */}
      {data.monthly_trends.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Profit</Text>
          <View style={styles.chartCard}>
            <BarChart 
              data={data.monthly_trends} 
              valueKey="profit"
              colorFn={(value, isLast) => {
                if (isLast) return value >= 0 ? colors.success : colors.warning;
                return colors.surfaceHighlight;
              }}
            />
          </View>
        </View>
      )}

      {/* Platform Performance */}
      {platformEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Platform</Text>
          <View style={styles.listCard}>
            {platformEntries.map(([platform, revenue], i) => {
              const profit = data.platform_profit[platform] || 0;
              return (
                <View key={platform}>
                  {i > 0 && <View style={styles.listDivider} />}
                  <View style={styles.listItem}>
                    <View style={styles.listItemHeader}>
                      <Text style={styles.listItemTitle}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Text>
                      <Text style={styles.listItemValue}>${revenue}</Text>
                    </View>
                    <View style={styles.listItemMeta}>
                      <Text style={styles.listItemSubtext}>${profit} profit</Text>
                    </View>
                    <ProgressBar value={revenue} max={maxPlatformRev} color={colors.accent} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Category Performance */}
      {categoryEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Category</Text>
          <View style={styles.listCard}>
            {categoryEntries.map(([category, perf], i) => (
              <View key={category}>
                {i > 0 && <View style={styles.listDivider} />}
                <View style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <View>
                      <Text style={styles.listItemTitle}>{category}</Text>
                      <Text style={styles.listItemSubtext}>{perf.count} sold</Text>
                    </View>
                    <Text style={[styles.listItemProfit, { color: colors.success }]}>${perf.profit}</Text>
                  </View>
                  <ProgressBar value={perf.profit} max={maxCategoryProfit} color={colors.success} />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textTertiary,
  },
  barArea: {
    justifyContent: 'flex-end',
    height: 68,
  },
  bar: {
    width: 28,
    borderRadius: 6,
  },
  label: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: colors.textPrimary,
    fontFamily: 'SpaceMono_700Bold',
  },
});

const progressStyles = StyleSheet.create({
  container: {
    height: 4,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 2,
    marginTop: 10,
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.containerPadding,
  },
  centered: {
    flex: 1,
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

  // Empty State
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Header
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

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sectionGap,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...shadows.subtle,
  },
  metricCardWarning: {
    backgroundColor: colors.warningLight,
  },
  metricValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  metricLabel: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Sections
  section: {
    marginBottom: spacing.sectionGap,
  },
  sectionTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 17,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 14,
  },

  // Chart Card
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
    ...shadows.subtle,
  },

  // List Card
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    paddingHorizontal: spacing.cardPadding,
    ...shadows.subtle,
  },
  listDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  listItem: {
    paddingVertical: 16,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listItemTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  listItemValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  listItemMeta: {
    marginTop: 2,
  },
  listItemSubtext: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  listItemProfit: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
});
