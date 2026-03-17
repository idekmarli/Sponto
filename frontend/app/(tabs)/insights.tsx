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

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async () => {
    try { setData(await api.getInsights()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  if (loading) {
    return <View style={[s.container, s.center, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  if (!data) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <Feather name="bar-chart-2" size={32} color={colors.textTertiary} />
        <Text style={s.emptyText}>No data yet</Text>
      </View>
    );
  }

  const platformEntries = Object.entries(data.platform_revenue).sort((a, b) => b[1] - a[1]);
  const categoryEntries = Object.entries(data.category_performance).sort((a, b) => b[1].profit - a[1].profit);
  const maxPlatformRev = Math.max(...platformEntries.map(x => x[1]), 1);

  return (
    <ScrollView
      testID="insights-screen"
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 20 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInsights(); }} tintColor={colors.accent} />}
    >
      <Text style={s.title}>Insights</Text>
      <Text style={s.subtitle}>Business performance</Text>

      {/* Key Stats */}
      <View style={s.statsRow}>
        <View testID="stat-roi" style={s.statCard}>
          <Text style={s.statLabel}>Avg ROI</Text>
          <Text style={s.statValue}>{data.avg_roi}%</Text>
        </View>
        <View testID="stat-days" style={s.statCard}>
          <Text style={s.statLabel}>Avg Days</Text>
          <Text style={s.statValue}>{data.avg_days_to_sell}</Text>
        </View>
      </View>
      <View style={s.statsRow}>
        <View testID="stat-deadstock" style={[s.statCard, data.dead_stock_percentage > 20 && { backgroundColor: '#FAF4F1' }]}>
          <Text style={s.statLabel}>Dead Stock</Text>
          <Text style={[s.statValue, data.dead_stock_percentage > 20 && { color: colors.warning }]}>{data.dead_stock_percentage}%</Text>
        </View>
        <View testID="stat-stale-capital" style={s.statCard}>
          <Text style={s.statLabel}>Stale Capital</Text>
          <Text style={s.statValue}>${data.capital_in_stale}</Text>
        </View>
      </View>

      {/* Monthly Revenue Chart */}
      {data.monthly_trends.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Monthly Revenue</Text>
          <View style={s.card}>
            <View style={s.chartArea}>
              {data.monthly_trends.map((t, i) => {
                const maxRev = Math.max(...data.monthly_trends.map(x => x.revenue), 1);
                const h = Math.max((t.revenue / maxRev) * 72, 3);
                const isLast = i === data.monthly_trends.length - 1;
                return (
                  <View key={i} style={s.chartCol}>
                    <Text style={[s.chartValue, isLast && { color: colors.textPrimary }]}>${t.revenue}</Text>
                    <View style={s.chartBarArea}>
                      <View style={[s.chartBar, { height: h, backgroundColor: isLast ? colors.accent : colors.surfaceHighlight }]} />
                    </View>
                    <Text style={[s.chartLabel, isLast && { color: colors.textPrimary }]}>{t.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Monthly Profit Chart */}
      {data.monthly_trends.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Monthly Profit</Text>
          <View style={s.card}>
            <View style={s.chartArea}>
              {data.monthly_trends.map((t, i) => {
                const maxProf = Math.max(...data.monthly_trends.map(x => Math.abs(x.profit)), 1);
                const h = Math.max((Math.abs(t.profit) / maxProf) * 72, 3);
                const isLast = i === data.monthly_trends.length - 1;
                return (
                  <View key={i} style={s.chartCol}>
                    <Text style={[s.chartValue, { color: t.profit >= 0 ? colors.success : colors.warning }]}>${t.profit}</Text>
                    <View style={s.chartBarArea}>
                      <View style={[s.chartBar, { height: h, backgroundColor: isLast ? (t.profit >= 0 ? colors.success : colors.warning) : colors.surfaceHighlight }]} />
                    </View>
                    <Text style={[s.chartLabel, isLast && { color: colors.textPrimary }]}>{t.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Platform Revenue */}
      {platformEntries.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>By Platform</Text>
          <View style={s.card}>
            {platformEntries.map(([platform, revenue], i) => {
              const profit = data.platform_profit[platform] || 0;
              const width = Math.max((revenue / maxPlatformRev) * 100, 8);
              return (
                <View key={platform}>
                  <View style={s.platformRow}>
                    <View style={s.platformInfo}>
                      <Text style={s.platformName}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
                      <Text style={s.platformDetail}>${revenue} rev · ${profit} profit</Text>
                    </View>
                  </View>
                  <View style={s.barBg}>
                    <View style={[s.barFill, { width: `${width}%` }]} />
                  </View>
                  {i < platformEntries.length - 1 && <View style={s.divider} />}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Category */}
      {categoryEntries.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>By Category</Text>
          <View style={s.card}>
            {categoryEntries.map(([category, perf], i) => (
              <View key={category}>
                <View style={s.catRow}>
                  <View>
                    <Text style={s.catName}>{category}</Text>
                    <Text style={s.catSold}>{perf.count} sold</Text>
                  </View>
                  <Text style={s.catProfit}>${perf.profit}</Text>
                </View>
                {i < categoryEntries.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.containerPadding },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 30, color: colors.textPrimary, letterSpacing: -0.6 },
  subtitle: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textTertiary, marginTop: 2, marginBottom: spacing.sectionGap },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.m, paddingVertical: 18, paddingHorizontal: 16, ...shadows.subtle },
  statLabel: { fontFamily: 'Mulish_400Regular', fontSize: 11, color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  statValue: { fontFamily: 'Mulish_700Bold', fontSize: 26, color: colors.textPrimary, letterSpacing: -0.5 },

  section: { marginTop: spacing.l, marginBottom: 4 },
  sectionTitle: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.textPrimary, letterSpacing: -0.2, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.l, paddingHorizontal: 18, paddingVertical: 16, ...shadows.subtle },

  chartArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 },
  chartCol: { flex: 1, alignItems: 'center', gap: 6 },
  chartValue: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: colors.textTertiary },
  chartBarArea: { justifyContent: 'flex-end', height: 76 },
  chartBar: { width: 24, borderRadius: 6, minHeight: 3 },
  chartLabel: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: colors.textTertiary },

  platformRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 6 },
  platformInfo: { flex: 1 },
  platformName: { fontFamily: 'Mulish_700Bold', fontSize: 14, color: colors.textPrimary },
  platformDetail: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  barBg: { height: 4, backgroundColor: colors.surfaceHighlight, borderRadius: 2, marginBottom: 8 },
  barFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },

  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  catName: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.textPrimary },
  catSold: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  catProfit: { fontFamily: 'Mulish_700Bold', fontSize: 17, color: colors.success, letterSpacing: -0.3 },

  emptyText: { fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textSecondary, marginTop: 12 },
});
