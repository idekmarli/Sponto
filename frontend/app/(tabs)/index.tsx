import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';
import { api } from '../../src/api';

interface DashboardData {
  monthly_net_profit: number;
  monthly_revenue: number;
  sold_this_month: number;
  active_listings: number;
  capital_in_inventory: number;
  dead_stock_count: number;
  best_platform: string | null;
  best_category: string | null;
  actions: Array<{ type: string; item_id: string; title: string; message: string }>;
  trends: Array<{ month: string; revenue: number; profit: number }>;
  total_items: number;
}

function TrendChart({ data }: { data: Array<{ month: string; profit: number }> }) {
  const maxVal = Math.max(...data.map(d => Math.abs(d.profit)), 1);
  return (
    <View testID="profit-trend-chart" style={trendStyles.container}>
      {data.map((d, i) => {
        const height = Math.max((Math.abs(d.profit) / maxVal) * 56, 3);
        const isPositive = d.profit >= 0;
        const isLast = i === data.length - 1;
        return (
          <View key={i} style={trendStyles.col}>
            <View style={trendStyles.barArea}>
              <View style={[
                trendStyles.bar,
                {
                  height,
                  backgroundColor: isLast ? colors.textPrimary : isPositive ? colors.success : colors.warning,
                  opacity: isLast ? 1 : 0.35 + (i / data.length) * 0.65,
                },
              ]} />
            </View>
            <Text style={[trendStyles.label, isLast && trendStyles.labelActive]}>{d.month}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ActionItem({ action, onPress, isLast }: { action: any; onPress: () => void; isLast: boolean }) {
  const iconMap: Record<string, string> = {
    needs_listing: 'tag', stale: 'clock', dead_stock: 'alert-triangle',
    incomplete: 'edit-3', cleanup: 'check-circle',
  };
  const colorMap: Record<string, string> = {
    needs_listing: colors.accent, stale: colors.warning, dead_stock: colors.error,
    incomplete: colors.textTertiary, cleanup: colors.success,
  };
  const bgMap: Record<string, string> = {
    needs_listing: '#F5F0EC', stale: '#F7EFEB', dead_stock: '#F5EAEA',
    incomplete: '#F0F0F0', cleanup: '#EFF3EE',
  };
  return (
    <TouchableOpacity testID={`action-${action.type}`} style={[actionStyles.item, !isLast && actionStyles.itemBorder]} onPress={onPress} activeOpacity={0.6}>
      <View style={[actionStyles.icon, { backgroundColor: bgMap[action.type] || '#F0F0F0' }]}>
        <Feather name={(iconMap[action.type] || 'info') as any} size={13} color={colorMap[action.type] || colors.accent} />
      </View>
      <Text style={actionStyles.text} numberOfLines={2}>{action.message}</Text>
      <Feather name="chevron-right" size={14} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setData(await api.getDashboard()); }
    catch (e) { console.error('Dashboard fetch error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <View style={[s.container, s.center]}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  if (!data) {
    return (
      <View style={[s.container, s.center]}>
        <Feather name="wifi-off" size={28} color={colors.textTertiary} />
        <Text style={s.emptyText}>Unable to load</Text>
        <TouchableOpacity testID="retry-btn" style={s.retryBtn} onPress={fetchData}><Text style={s.retryBtnText}>Retry</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      testID="home-screen"
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 20 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.brandName}>Resellr</Text>
          <Text style={s.brandTag}>OS</Text>
        </View>
        <TouchableOpacity testID="settings-btn" onPress={() => router.push('/settings')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <View style={s.settingsBtn}>
            <Feather name="settings" size={18} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Hero Profit Card */}
      <View testID="hero-profit" style={s.heroCard}>
        <View style={s.heroTop}>
          <Text style={s.heroLabel}>Net Profit</Text>
          <Text style={s.heroPeriod}>This Month</Text>
        </View>
        <Text style={s.heroValue}>
          <Text style={s.heroCurrency}>$</Text>{data.monthly_net_profit.toLocaleString()}
        </Text>
        <View style={s.heroBottom}>
          <View style={s.heroStat}>
            <Text style={s.heroStatValue}>${data.monthly_revenue.toLocaleString()}</Text>
            <Text style={s.heroStatLabel}>revenue</Text>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStat}>
            <Text style={s.heroStatValue}>{data.sold_this_month}</Text>
            <Text style={s.heroStatLabel}>sold</Text>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStat}>
            <Text style={s.heroStatValue}>{data.active_listings}</Text>
            <Text style={s.heroStatLabel}>active</Text>
          </View>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={s.metricsRow}>
        <View testID="metric-capital" style={s.metricCard}>
          <Text style={s.metricLabel}>Capital Locked</Text>
          <Text style={s.metricValue}>${data.capital_in_inventory.toLocaleString()}</Text>
        </View>
        <View testID="metric-total" style={s.metricCard}>
          <Text style={s.metricLabel}>Total Items</Text>
          <Text style={s.metricValue}>{data.total_items}</Text>
        </View>
        <View testID="metric-deadstock" style={[s.metricCard, data.dead_stock_count > 0 && s.metricCardWarn]}>
          <Text style={[s.metricLabel, data.dead_stock_count > 0 && { color: colors.warning }]}>Dead Stock</Text>
          <Text style={[s.metricValue, data.dead_stock_count > 0 && { color: colors.warning }]}>{data.dead_stock_count}</Text>
        </View>
      </View>

      {/* Highlights */}
      {(data.best_platform || data.best_category) && (
        <View style={s.highlightsRow}>
          {data.best_platform && (
            <View testID="best-platform" style={s.highlightCard}>
              <Feather name="award" size={14} color={colors.accent} />
              <View>
                <Text style={s.highlightLabel}>Top Platform</Text>
                <Text style={s.highlightValue}>{data.best_platform.charAt(0).toUpperCase() + data.best_platform.slice(1)}</Text>
              </View>
            </View>
          )}
          {data.best_category && (
            <View testID="best-category" style={s.highlightCard}>
              <Feather name="trending-up" size={14} color={colors.success} />
              <View>
                <Text style={s.highlightLabel}>Top Category</Text>
                <Text style={s.highlightValue}>{data.best_category}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Profit Trend */}
      {data.trends?.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Profit Trend</Text>
            <Text style={s.sectionSub}>6 months</Text>
          </View>
          <View style={s.card}>
            <TrendChart data={data.trends} />
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickRow}>
          <TouchableOpacity testID="quick-add" style={s.quickCard} onPress={() => router.push('/add-item')} activeOpacity={0.6}>
            <View style={[s.quickIcon, { backgroundColor: colors.textPrimary }]}>
              <Feather name="plus" size={20} color={colors.surface} />
            </View>
            <Text style={s.quickLabel}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="quick-source" style={s.quickCard} onPress={() => router.push('/(tabs)/source')} activeOpacity={0.6}>
            <View style={[s.quickIcon, { backgroundColor: colors.accent }]}>
              <Feather name="target" size={20} color={colors.surface} />
            </View>
            <Text style={s.quickLabel}>Source Calc</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="quick-deadstock" style={s.quickCard} onPress={() => router.push('/deadstock')} activeOpacity={0.6}>
            <View style={[s.quickIcon, { backgroundColor: colors.warning }]}>
              <Feather name="alert-triangle" size={20} color={colors.surface} />
            </View>
            <Text style={s.quickLabel}>Dead Stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Feed */}
      {data.actions?.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Action Feed</Text>
            <Text style={s.sectionSub}>{data.actions.length} items</Text>
          </View>
          <View style={s.card}>
            {data.actions.slice(0, 5).map((action, i) => (
              <ActionItem key={i} action={action} onPress={() => router.push(`/item/${action.item_id}`)} isLast={i === Math.min(data.actions.length, 5) - 1} />
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const trendStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90, paddingTop: 8 },
  col: { flex: 1, alignItems: 'center', gap: 8 },
  barArea: { justifyContent: 'flex-end', height: 60 },
  bar: { width: 22, borderRadius: 6 },
  label: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: colors.textTertiary, letterSpacing: 0.5 },
  labelActive: { color: colors.textPrimary, fontFamily: 'SpaceMono_400Regular' },
});

const actionStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  itemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  icon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.containerPadding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sectionGap },
  brandName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 34, color: colors.textPrimary, letterSpacing: -0.8, lineHeight: 38 },
  brandTag: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textTertiary, letterSpacing: 3, textTransform: 'uppercase', marginTop: -2 },
  settingsBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },

  heroCard: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    marginBottom: spacing.l,
    ...shadows.strong,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heroLabel: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroPeriod: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  heroValue: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 52, color: '#FFFFFF', letterSpacing: -2, lineHeight: 56, marginBottom: 20 },
  heroCurrency: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 32, color: 'rgba(255,255,255,0.5)' },
  heroBottom: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 },
  heroStat: { flex: 1 },
  heroStatValue: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 2 },
  heroStatLabel: { fontFamily: 'Mulish_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroStatDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },

  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.l },
  metricCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.m, paddingVertical: 16, paddingHorizontal: 14, ...shadows.subtle },
  metricCardWarn: { backgroundColor: '#FAF4F1' },
  metricLabel: { fontFamily: 'Mulish_400Regular', fontSize: 11, color: colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 6 },
  metricValue: { fontFamily: 'Mulish_700Bold', fontSize: 22, color: colors.textPrimary, letterSpacing: -0.3 },

  highlightsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.sectionGap },
  highlightCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceHighlight, borderRadius: borderRadius.m, paddingVertical: 14, paddingHorizontal: 14 },
  highlightLabel: { fontFamily: 'Mulish_400Regular', fontSize: 11, color: colors.textSecondary, letterSpacing: 0.2 },
  highlightValue: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: colors.textPrimary, marginTop: 1 },

  section: { marginBottom: spacing.sectionGap },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  sectionTitle: { fontFamily: 'Mulish_700Bold', fontSize: 17, color: colors.textPrimary, letterSpacing: -0.2 },
  sectionSub: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textTertiary },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.l, paddingHorizontal: 18, paddingVertical: 6, ...shadows.card },

  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: { flex: 1, alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: borderRadius.m, paddingVertical: 20, ...shadows.card },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: 'Mulish_600SemiBold', fontSize: 12, color: colors.textPrimary, letterSpacing: 0.1 },

  emptyText: { fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textSecondary, marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: borderRadius.pill },
  retryBtnText: { fontFamily: 'Mulish_700Bold', fontSize: 14, color: colors.surface },
});
