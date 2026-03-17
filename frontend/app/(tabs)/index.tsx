import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, actionConfig, priorityConfig } from '../../src/theme';
import { api } from '../../src/api';

interface DashboardData {
  monthly_net_profit: number;
  monthly_revenue: number;
  sold_this_month: number;
  active_listings: number;
  pre_listing: number;
  capital_in_inventory: number;
  capital_at_risk: number;
  dead_stock_count: number;
  stale_count: number;
  sell_through_rate: number;
  profit_velocity: number;
  avg_margin: number;
  inventory_age: { fresh: number; warming: number; stale: number; dead: number };
  best_platform: string | null;
  best_category: string | null;
  actions: any[];
  action_count: number;
  trends: Array<{ month: string; revenue: number; profit: number; count: number }>;
  total_items: number;
}

// Action Item Component
function ActionItem({ action, onPress, isLast }: { action: any; onPress: () => void; isLast: boolean }) {
  const config = actionConfig[action.type] || actionConfig.incomplete;
  const priority = action.priority || 7;
  const priorityInfo = priorityConfig[priority] || priorityConfig[7];

  return (
    <TouchableOpacity
      testID={`action-${action.type}-${action.item_id}`}
      style={[styles.actionItem, !isLast && styles.actionItemBorder]}
      onPress={onPress}
      activeOpacity={0.5}
    >
      <View style={[styles.actionIcon, { backgroundColor: config.bg }]}>
        <Feather name={config.icon as any} size={14} color={config.color} />
      </View>
      <View style={styles.actionBody}>
        <Text style={styles.actionMessage} numberOfLines={2}>{action.message}</Text>
        <View style={styles.actionMeta}>
          {priority <= 3 && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.color }]}>
              <Text style={styles.priorityText}>{priorityInfo.label}</Text>
            </View>
          )}
          {action.capital_at_risk > 0 && (
            <Text style={styles.actionRisk}>${action.capital_at_risk} at risk</Text>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

// Profit Trend Mini Chart
function TrendChart({ data }: { data: Array<{ month: string; profit: number }> }) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => Math.abs(d.profit)), 1);

  return (
    <View testID="profit-trend-chart" style={styles.trendContainer}>
      {data.map((d, i) => {
        const h = Math.max((Math.abs(d.profit) / maxVal) * 48, 4);
        const isLast = i === data.length - 1;
        const isPositive = d.profit >= 0;
        return (
          <View key={i} style={styles.trendCol}>
            <View style={styles.trendBarArea}>
              <View style={[
                styles.trendBar,
                { height: h },
                isLast 
                  ? { backgroundColor: colors.textPrimary }
                  : { backgroundColor: isPositive ? colors.success : colors.warning, opacity: 0.3 + (i / data.length) * 0.5 }
              ]} />
            </View>
            <Text style={[styles.trendLabel, isLast && styles.trendLabelActive]}>{d.month}</Text>
          </View>
        );
      })}
    </View>
  );
}

// Inventory Age Health Bar
function HealthBar({ age }: { age: { fresh: number; warming: number; stale: number; dead: number } }) {
  const total = age.fresh + age.warming + age.stale + age.dead;
  if (total === 0) return null;

  const segments = [
    { key: 'fresh', count: age.fresh, color: colors.success, label: 'Fresh' },
    { key: 'warming', count: age.warming, color: colors.accent, label: 'Warming' },
    { key: 'stale', count: age.stale, color: colors.warning, label: 'Stale' },
    { key: 'dead', count: age.dead, color: colors.error, label: 'Dead' },
  ].filter(s => s.count > 0);

  return (
    <View testID="inventory-age" style={styles.healthContainer}>
      <View style={styles.healthBar}>
        {segments.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.healthSegment,
              { flex: s.count, backgroundColor: s.color },
              i === 0 && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
              i === segments.length - 1 && { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
            ]}
          />
        ))}
      </View>
      <View style={styles.healthLegend}>
        {segments.map(s => (
          <View key={s.key} style={styles.healthLegendItem}>
            <View style={[styles.healthDot, { backgroundColor: s.color }]} />
            <Text style={styles.healthLegendText}>{s.count} {s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setData(await api.getDashboard());
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

  // Loading State
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Error State
  if (!data) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.errorIcon}>
          <Feather name="wifi-off" size={24} color={colors.textTertiary} />
        </View>
        <Text style={styles.errorTitle}>Unable to load</Text>
        <Text style={styles.errorText}>Check your connection and try again</Text>
        <TouchableOpacity testID="retry-btn" style={styles.retryBtn} onPress={fetchData} activeOpacity={0.7}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasRisk = data.capital_at_risk > 0 || data.dead_stock_count > 0;

  return (
    <ScrollView
      testID="home-screen"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
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
      <View style={styles.header}>
        <View style={styles.brandArea}>
          <Text style={styles.brandName}>Resellr</Text>
          <Text style={styles.brandTag}>OS</Text>
        </View>
        <TouchableOpacity
          testID="settings-btn"
          onPress={() => router.push('/settings')}
          style={styles.settingsBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.6}
        >
          <Feather name="settings" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Hero Card - Net Profit */}
      <View testID="hero-profit" style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroLabel}>Net Profit</Text>
          <View style={styles.heroPeriodBadge}>
            <Text style={styles.heroPeriodText}>This Month</Text>
          </View>
        </View>
        <Text style={styles.heroValue}>
          <Text style={styles.heroCurrency}>$</Text>
          {data.monthly_net_profit.toLocaleString()}
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>${data.monthly_revenue.toLocaleString()}</Text>
            <Text style={styles.heroStatLabel}>revenue</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>{data.sold_this_month}</Text>
            <Text style={styles.heroStatLabel}>sold</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>${data.profit_velocity}/d</Text>
            <Text style={styles.heroStatLabel}>velocity</Text>
          </View>
        </View>
      </View>

      {/* Operational Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Sell-Through</Text>
          <Text style={styles.metricValue}>{data.sell_through_rate}%</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg Margin</Text>
          <Text style={styles.metricValue}>{data.avg_margin}%</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Active</Text>
          <Text style={styles.metricValue}>{data.active_listings}</Text>
        </View>
      </View>

      {/* Capital Overview */}
      <View style={styles.capitalRow}>
        <View style={styles.capitalCard}>
          <Feather name="lock" size={15} color={colors.textSecondary} />
          <View style={styles.capitalInfo}>
            <Text style={styles.capitalLabel}>Capital Locked</Text>
            <Text style={styles.capitalValue}>${data.capital_in_inventory.toLocaleString()}</Text>
          </View>
        </View>
        {hasRisk && (
          <View style={[styles.capitalCard, styles.capitalCardRisk]}>
            <Feather name="alert-triangle" size={15} color={colors.warning} />
            <View style={styles.capitalInfo}>
              <Text style={[styles.capitalLabel, { color: colors.warning }]}>At Risk</Text>
              <Text style={[styles.capitalValue, { color: colors.warning }]}>${data.capital_at_risk.toLocaleString()}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Inventory Health */}
      {data.inventory_age && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Health</Text>
          <View style={styles.card}>
            <HealthBar age={data.inventory_age} />
          </View>
        </View>
      )}

      {/* Profit Trend */}
      {data.trends?.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profit Trend</Text>
            <Text style={styles.sectionSubtitle}>6 months</Text>
          </View>
          <View style={styles.card}>
            <TrendChart data={data.trends} />
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            testID="quick-add"
            style={styles.quickActionCard}
            onPress={() => router.push('/add-item')}
            activeOpacity={0.6}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.textPrimary }]}>
              <Feather name="plus" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionLabel}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="quick-source"
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/source')}
            activeOpacity={0.6}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.accent }]}>
              <Feather name="target" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionLabel}>Source Calc</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="quick-deadstock"
            style={styles.quickActionCard}
            onPress={() => router.push('/deadstock')}
            activeOpacity={0.6}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.warning }]}>
              <Feather name="alert-triangle" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionLabel}>Dead Stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Feed */}
      {data.actions?.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Action Feed</Text>
            <View style={styles.actionCountBadge}>
              <Text style={styles.actionCountText}>{data.action_count}</Text>
            </View>
          </View>
          <View style={styles.card}>
            {data.actions.slice(0, 6).map((action, i) => (
              <ActionItem
                key={`${action.item_id}-${action.type}`}
                action={action}
                onPress={() => router.push(`/item/${action.item_id}`)}
                isLast={i === Math.min(data.actions.length, 6) - 1}
              />
            ))}
          </View>
          {data.actions.length > 6 && (
            <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.6}>
              <Text style={styles.viewAllText}>View all {data.action_count} actions</Text>
              <Feather name="arrow-right" size={14} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Empty Action State */}
      {(!data.actions || data.actions.length === 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action Feed</Text>
          <View style={[styles.card, styles.emptyCard]}>
            <View style={styles.emptyIcon}>
              <Feather name="check-circle" size={24} color={colors.success} />
            </View>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>No urgent actions needed</Text>
          </View>
        </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.containerPadding,
  },

  // Loading
  loadingText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 16,
  },

  // Error
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  errorText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: borderRadius.pill,
  },
  retryBtnText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.l,
  },
  brandArea: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  brandName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  brandTag: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },

  // Hero Card
  heroCard: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.cardPaddingLarge,
    paddingTop: 24,
    paddingBottom: 20,
    marginBottom: spacing.m,
    ...shadows.strong,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroLabel: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroPeriodBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  heroPeriodText: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  heroValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 48,
    color: '#FFFFFF',
    letterSpacing: -2,
    marginBottom: 20,
  },
  heroCurrency: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: 'rgba(255,255,255,0.4)',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
  },
  heroStatItem: {
    flex: 1,
  },
  heroStatValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  heroStatLabel: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    paddingVertical: 16,
    paddingHorizontal: 14,
    ...shadows.subtle,
  },
  metricLabel: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  metricValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  // Capital Row
  capitalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sectionGap,
  },
  capitalCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...shadows.subtle,
  },
  capitalCardRisk: {
    backgroundColor: colors.warningLight,
  },
  capitalInfo: {},
  capitalLabel: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  capitalValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 17,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // Sections
  section: {
    marginBottom: spacing.sectionGap,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 17,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 13,
    color: colors.textTertiary,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: 14,
    ...shadows.card,
  },

  // Health Bar
  healthContainer: {
    gap: 14,
  },
  healthBar: {
    flexDirection: 'row',
    height: 8,
    gap: 2,
  },
  healthSegment: {
    minWidth: 8,
  },
  healthLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  healthLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthLegendText: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Trend Chart
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    paddingTop: 8,
  },
  trendCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  trendBarArea: {
    justifyContent: 'flex-end',
    height: 52,
  },
  trendBar: {
    width: 24,
    borderRadius: 6,
  },
  trendLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },
  trendLabelActive: {
    color: colors.textPrimary,
    fontFamily: 'SpaceMono_700Bold',
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    paddingVertical: 20,
    ...shadows.card,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },

  // Action Feed
  actionCountBadge: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  actionCountText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  actionItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: {
    flex: 1,
    gap: 6,
  },
  actionMessage: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  actionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  actionRisk: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },

  // View All
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
  },
  viewAllText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.accent,
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
