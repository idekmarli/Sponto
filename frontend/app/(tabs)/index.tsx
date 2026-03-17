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

function MetricCard({ label, value, prefix = '', suffix = '', accent = false, testID }: { label: string; value: string | number; prefix?: string; suffix?: string; accent?: boolean; testID: string }) {
  return (
    <View testID={testID} style={[styles.metricCard, accent && styles.metricCardAccent]}>
      <Text style={[styles.metricLabel, accent && styles.metricLabelAccent]}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.metricValueAccent]}>
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </Text>
    </View>
  );
}

function TrendChart({ data }: { data: Array<{ month: string; profit: number }> }) {
  const maxVal = Math.max(...data.map(d => Math.abs(d.profit)), 1);
  return (
    <View testID="profit-trend-chart" style={styles.trendChart}>
      <View style={styles.trendBars}>
        {data.map((d, i) => {
          const height = Math.max((Math.abs(d.profit) / maxVal) * 60, 4);
          const isPositive = d.profit >= 0;
          return (
            <View key={i} style={styles.trendBarWrap}>
              <View style={[styles.trendBar, { height, backgroundColor: isPositive ? colors.success : colors.warning }]} />
              <Text style={styles.trendBarLabel}>{d.month}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ActionItem({ action, onPress }: { action: any; onPress: () => void }) {
  const iconMap: Record<string, string> = {
    needs_listing: 'tag',
    stale: 'clock',
    dead_stock: 'alert-triangle',
    incomplete: 'edit-3',
    cleanup: 'check-circle',
  };
  const colorMap: Record<string, string> = {
    needs_listing: colors.accent,
    stale: colors.warning,
    dead_stock: colors.error,
    incomplete: colors.textTertiary,
    cleanup: colors.success,
  };
  return (
    <TouchableOpacity testID={`action-${action.type}`} style={styles.actionItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionDot, { backgroundColor: colorMap[action.type] || colors.accent }]}>
        <Feather name={(iconMap[action.type] || 'info') as any} size={14} color={colors.surface} />
      </View>
      <Text style={styles.actionText} numberOfLines={2}>{action.message}</Text>
      <Feather name="chevron-right" size={16} color={colors.textTertiary} />
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
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Feather name="wifi-off" size={32} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Unable to load dashboard</Text>
        <TouchableOpacity testID="retry-btn" style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      testID="home-screen"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Resellr OS</Text>
          <Text style={styles.subGreeting}>Your command center</Text>
        </View>
        <TouchableOpacity testID="settings-btn" onPress={() => router.push('/settings')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={styles.settingsBtn}>
            <Feather name="settings" size={20} color={colors.textPrimary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Hero Metric */}
      <View testID="hero-profit" style={styles.heroCard}>
        <Text style={styles.heroLabel}>Net Profit This Month</Text>
        <Text style={styles.heroValue}>
          ${data.monthly_net_profit.toLocaleString()}
        </Text>
        <View style={styles.heroSubRow}>
          <Text style={styles.heroSubText}>${data.monthly_revenue.toLocaleString()} revenue</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroSubText}>{data.sold_this_month} sold</Text>
        </View>
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <MetricCard testID="metric-active" label="Active Listings" value={data.active_listings} />
        <MetricCard testID="metric-capital" label="Capital Locked" value={data.capital_in_inventory} prefix="$" />
        <MetricCard testID="metric-deadstock" label="Dead Stock" value={data.dead_stock_count} accent={data.dead_stock_count > 0} />
        <MetricCard testID="metric-total" label="Total Items" value={data.total_items} />
      </View>

      {/* Best This Month */}
      {(data.best_platform || data.best_category) && (
        <View style={styles.bestRow}>
          {data.best_platform && (
            <View testID="best-platform" style={styles.bestCard}>
              <Text style={styles.bestLabel}>Best Platform</Text>
              <Text style={styles.bestValue}>{data.best_platform.charAt(0).toUpperCase() + data.best_platform.slice(1)}</Text>
            </View>
          )}
          {data.best_category && (
            <View testID="best-category" style={styles.bestCard}>
              <Text style={styles.bestLabel}>Best Category</Text>
              <Text style={styles.bestValue}>{data.best_category}</Text>
            </View>
          )}
        </View>
      )}

      {/* Profit Trend */}
      {data.trends && data.trends.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profit Trend</Text>
          <View style={styles.card}>
            <TrendChart data={data.trends} />
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity testID="quick-add" style={styles.quickAction} onPress={() => router.push('/add-item')} activeOpacity={0.7}>
            <View style={styles.quickActionIcon}>
              <Feather name="plus" size={22} color={colors.surface} />
            </View>
            <Text style={styles.quickActionLabel}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="quick-source" style={styles.quickAction} onPress={() => router.push('/(tabs)/source')} activeOpacity={0.7}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.accent }]}>
              <Feather name="target" size={22} color={colors.surface} />
            </View>
            <Text style={styles.quickActionLabel}>Source Calc</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="quick-deadstock" style={styles.quickAction} onPress={() => router.push('/deadstock')} activeOpacity={0.7}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.warning }]}>
              <Feather name="alert-triangle" size={22} color={colors.surface} />
            </View>
            <Text style={styles.quickActionLabel}>Dead Stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Action Feed */}
      {data.actions && data.actions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action Feed</Text>
          <View style={styles.card}>
            {data.actions.slice(0, 6).map((action, i) => (
              <React.Fragment key={i}>
                <ActionItem action={action} onPress={() => router.push(`/item/${action.item_id}`)} />
                {i < Math.min(data.actions.length, 6) - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.containerPadding },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.l },
  greeting: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.textPrimary, letterSpacing: -0.5 },
  subGreeting: { fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textSecondary, marginTop: 2 },
  settingsBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.l,
    padding: spacing.l,
    marginBottom: spacing.l,
    ...shadows.medium,
  },
  heroLabel: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  heroValue: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 42, color: colors.surface, letterSpacing: -1, marginBottom: 12 },
  heroSubRow: { flexDirection: 'row', alignItems: 'center' },
  heroSubText: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  heroDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.l },
  metricCard: {
    width: '47%' as any,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  metricCardAccent: { borderColor: colors.warning, backgroundColor: '#FDF8F6' },
  metricLabel: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  metricLabelAccent: { color: colors.warning },
  metricValue: { fontFamily: 'Mulish_700Bold', fontSize: 24, color: colors.textPrimary },
  metricValueAccent: { color: colors.warning },
  bestRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.l },
  bestCard: {
    flex: 1,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.m,
    padding: spacing.cardPadding,
  },
  bestLabel: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  bestValue: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.textPrimary },
  section: { marginBottom: spacing.l },
  sectionTitle: { fontFamily: 'Mulish_700Bold', fontSize: 18, color: colors.textPrimary, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  quickActionsRow: { flexDirection: 'row', gap: 12 },
  quickAction: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.m, padding: spacing.m, borderWidth: 1, borderColor: colors.divider },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickActionLabel: { fontFamily: 'Mulish_600SemiBold', fontSize: 13, color: colors.textPrimary, textAlign: 'center' },
  trendChart: { paddingVertical: 8 },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 80 },
  trendBarWrap: { alignItems: 'center', flex: 1, gap: 6 },
  trendBar: { width: 24, borderRadius: 4, minHeight: 4 },
  trendBarLabel: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: colors.textTertiary },
  actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  actionDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.divider },
  emptyText: { fontFamily: 'Mulish_400Regular', fontSize: 16, color: colors.textSecondary, marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: borderRadius.pill },
  retryBtnText: { fontFamily: 'Mulish_700Bold', fontSize: 14, color: colors.surface },
});
