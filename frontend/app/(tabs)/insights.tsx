import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, platformColors } from '../../src/theme';
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

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const maxVal = Math.max(...data.map(Math.abs), 1);
  return (
    <View style={chartStyles.miniBar}>
      {data.map((v, i) => (
        <View key={i} style={chartStyles.miniBarCol}>
          <View style={[chartStyles.miniBarFill, { height: Math.max((Math.abs(v) / maxVal) * 40, 2), backgroundColor: color }]} />
        </View>
      ))}
    </View>
  );
}

function StatCard({ label, value, icon, color = colors.textPrimary, testID }: { label: string; value: string; icon: string; color?: string; testID: string }) {
  return (
    <View testID={testID} style={insightStyles.statCard}>
      <Feather name={icon as any} size={18} color={colors.textSecondary} />
      <Text style={insightStyles.statValue}>{value}</Text>
      <Text style={insightStyles.statLabel}>{label}</Text>
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
      const d = await api.getInsights();
      setData(d);
    } catch (e) {
      console.error('Insights fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  if (loading) {
    return (
      <View style={[insightStyles.container, insightStyles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[insightStyles.container, insightStyles.center, { paddingTop: insets.top }]}>
        <Feather name="bar-chart-2" size={48} color={colors.textTertiary} />
        <Text style={insightStyles.emptyText}>No insights data available</Text>
      </View>
    );
  }

  const platformEntries = Object.entries(data.platform_revenue).sort((a, b) => b[1] - a[1]);
  const categoryEntries = Object.entries(data.category_performance).sort((a, b) => b[1].profit - a[1].profit);

  return (
    <ScrollView
      testID="insights-screen"
      style={insightStyles.container}
      contentContainerStyle={[insightStyles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInsights(); }} tintColor={colors.accent} />}
    >
      <Text style={insightStyles.title}>Insights</Text>
      <Text style={insightStyles.subtitle}>Business intelligence</Text>

      {/* Key Stats */}
      <View style={insightStyles.statsGrid}>
        <StatCard testID="stat-roi" label="Avg ROI" value={`${data.avg_roi}%`} icon="trending-up" />
        <StatCard testID="stat-days" label="Avg Days to Sell" value={`${data.avg_days_to_sell}`} icon="clock" />
        <StatCard testID="stat-deadstock" label="Dead Stock %" value={`${data.dead_stock_percentage}%`} icon="alert-triangle" />
        <StatCard testID="stat-stale-capital" label="Stale Capital" value={`$${data.capital_in_stale}`} icon="lock" />
      </View>

      {/* Monthly Trend */}
      {data.monthly_trends.length > 0 && (
        <View style={insightStyles.section}>
          <Text style={insightStyles.sectionTitle}>Monthly Revenue</Text>
          <View style={insightStyles.card}>
            <View style={insightStyles.trendChart}>
              {data.monthly_trends.map((t, i) => {
                const maxRev = Math.max(...data.monthly_trends.map(x => x.revenue), 1);
                const h = Math.max((t.revenue / maxRev) * 80, 4);
                return (
                  <View key={i} style={insightStyles.trendCol}>
                    <Text style={insightStyles.trendValue}>${t.revenue}</Text>
                    <View style={[insightStyles.trendBar, { height: h, backgroundColor: colors.accent }]} />
                    <Text style={insightStyles.trendLabel}>{t.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Monthly Profit */}
      {data.monthly_trends.length > 0 && (
        <View style={insightStyles.section}>
          <Text style={insightStyles.sectionTitle}>Monthly Profit</Text>
          <View style={insightStyles.card}>
            <View style={insightStyles.trendChart}>
              {data.monthly_trends.map((t, i) => {
                const maxProf = Math.max(...data.monthly_trends.map(x => Math.abs(x.profit)), 1);
                const h = Math.max((Math.abs(t.profit) / maxProf) * 80, 4);
                return (
                  <View key={i} style={insightStyles.trendCol}>
                    <Text style={[insightStyles.trendValue, { color: t.profit >= 0 ? colors.success : colors.warning }]}>${t.profit}</Text>
                    <View style={[insightStyles.trendBar, { height: h, backgroundColor: t.profit >= 0 ? colors.success : colors.warning }]} />
                    <Text style={insightStyles.trendLabel}>{t.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Revenue by Platform */}
      {platformEntries.length > 0 && (
        <View style={insightStyles.section}>
          <Text style={insightStyles.sectionTitle}>Revenue by Platform</Text>
          <View style={insightStyles.card}>
            {platformEntries.map(([platform, revenue], i) => {
              const profit = data.platform_profit[platform] || 0;
              const maxRev = Math.max(...platformEntries.map(x => x[1]), 1);
              const width = Math.max((revenue / maxRev) * 100, 5);
              return (
                <View key={platform}>
                  <View style={insightStyles.platformRow}>
                    <View style={styles.platformInfo}>
                      <Text style={insightStyles.platformName}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
                      <Text style={insightStyles.platformSub}>${revenue} rev · ${profit} profit</Text>
                    </View>
                  </View>
                  <View style={insightStyles.barBg}>
                    <View style={[insightStyles.barFill, { width: `${width}%`, backgroundColor: platformColors[platform] || colors.accent }]} />
                  </View>
                  {i < platformEntries.length - 1 && <View style={insightStyles.divider} />}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Category Performance */}
      {categoryEntries.length > 0 && (
        <View style={insightStyles.section}>
          <Text style={insightStyles.sectionTitle}>Category Performance</Text>
          <View style={insightStyles.card}>
            {categoryEntries.map(([category, perf], i) => (
              <View key={category}>
                <View style={insightStyles.catRow}>
                  <Text style={insightStyles.catName}>{category}</Text>
                  <View style={insightStyles.catRight}>
                    <Text style={insightStyles.catProfit}>${perf.profit}</Text>
                    <Text style={insightStyles.catCount}>{perf.count} sold</Text>
                  </View>
                </View>
                {i < categoryEntries.length - 1 && <View style={insightStyles.divider} />}
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  platformInfo: { flex: 1 },
});

const chartStyles = StyleSheet.create({
  miniBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 44 },
  miniBarCol: { flex: 1, justifyContent: 'flex-end' },
  miniBarFill: { borderRadius: 2, minHeight: 2 },
});

const insightStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.containerPadding },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.l },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.l },
  statCard: {
    width: '47%' as any,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 6,
  },
  statValue: { fontFamily: 'Mulish_700Bold', fontSize: 22, color: colors.textPrimary },
  statLabel: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textSecondary },
  section: { marginBottom: spacing.l },
  sectionTitle: { fontFamily: 'Mulish_700Bold', fontSize: 18, color: colors.textPrimary, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  trendChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 8, paddingVertical: 8 },
  trendCol: { alignItems: 'center', flex: 1, gap: 6 },
  trendValue: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: colors.textSecondary },
  trendBar: { width: 28, borderRadius: 4, minHeight: 4 },
  trendLabel: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: colors.textTertiary },
  platformRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  platformName: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: colors.textPrimary },
  platformSub: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  barBg: { height: 6, backgroundColor: colors.surfaceHighlight, borderRadius: 3, marginBottom: 4 },
  barFill: { height: 6, borderRadius: 3 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 4 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  catName: { fontFamily: 'Mulish_600SemiBold', fontSize: 15, color: colors.textPrimary },
  catRight: { alignItems: 'flex-end' },
  catProfit: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.success },
  catCount: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textSecondary },
  emptyText: { fontFamily: 'Mulish_400Regular', fontSize: 16, color: colors.textSecondary, marginTop: 12 },
});
