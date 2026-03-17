import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows } from '../../src/theme';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';
import { EmptyState, StatCard, Divider } from '../../src/components/UI';
import { exportToCSV, INVENTORY_COLUMNS, SALES_COLUMNS } from '../../src/utils/csvExport';
import { Toast } from '../../src/components/Toast';

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

// Minimal Bar Chart
function BarChart({ data, valueKey, formatValue, colorFn }: { 
  data: Array<{ month: string; [key: string]: any }>; 
  valueKey: string;
  formatValue: (v: number) => string;
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
        const barColor = colorFn ? colorFn(value, isLast) : (isLast ? colors.accent : colors.surfaceMuted);
        
        return (
          <View key={i} style={chartStyles.col}>
            <Text style={[chartStyles.value, isLast && { color: colors.textPrimary }]}>
              {formatValue(Math.abs(value))}
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
  const { formatAmount, formatAmountCompact } = useCurrency();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

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

  // Export functions
  const handleExportInventory = async () => {
    setExporting(true);
    try {
      const items = await api.getItems();
      const success = await exportToCSV({
        filename: 'resellr_inventory',
        data: items,
        columns: INVENTORY_COLUMNS,
      });
      if (success) {
        setToast({ visible: true, message: 'Inventory exported successfully', type: 'success' });
      } else {
        setToast({ visible: true, message: 'Export failed', type: 'error' });
      }
    } catch (e) {
      console.error('Export error:', e);
      setToast({ visible: true, message: 'Export failed', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleExportSales = async () => {
    setExporting(true);
    try {
      const items = await api.getItems({ status: 'sold' });
      // Add ROI calculation to each item
      const salesWithROI = items.map((item: any) => ({
        ...item,
        roi: item.purchase_price > 0 ? ((item.net_profit / item.purchase_price) * 100) : 0,
      }));
      const success = await exportToCSV({
        filename: 'resellr_sales',
        data: salesWithROI,
        columns: SALES_COLUMNS,
      });
      if (success) {
        setToast({ visible: true, message: 'Sales data exported successfully', type: 'success' });
      } else {
        setToast({ visible: true, message: 'Export failed', type: 'error' });
      }
    } catch (e) {
      console.error('Export error:', e);
      setToast({ visible: true, message: 'Export failed', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + space[4] }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
        </View>
        <EmptyState
          icon="bar-chart-2"
          title="No data yet"
          description="Start selling to see your business insights"
        />
      </View>
    );
  }

  const platformEntries = Object.entries(data.platform_revenue).sort((a, b) => b[1] - a[1]);
  const categoryEntries = Object.entries(data.category_performance).sort((a, b) => b[1].profit - a[1].profit);
  const maxPlatformRev = Math.max(...platformEntries.map(x => x[1]), 1);
  const maxCategoryProfit = Math.max(...categoryEntries.map(x => x[1].profit), 1);
  
  // Check if there's meaningful chart data (at least one month with non-zero values)
  const hasChartData = data.monthly_trends?.some(t => t.revenue > 0 || t.profit > 0);

  return (
    <ScrollView
      testID="insights-screen"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space[4] }]}
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
        <View>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Business performance</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.exportBtn} 
            onPress={handleExportInventory}
            disabled={exporting}
            activeOpacity={0.7}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Feather name="download" size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Export Options */}
      <View style={styles.exportSection}>
        <TouchableOpacity 
          style={styles.exportCard} 
          onPress={handleExportInventory}
          disabled={exporting}
          activeOpacity={0.7}
        >
          <View style={styles.exportCardIcon}>
            <Feather name="package" size={18} color={colors.brand} />
          </View>
          <View style={styles.exportCardContent}>
            <Text style={styles.exportCardTitle}>Export Inventory</Text>
            <Text style={styles.exportCardDesc}>All items with full details</Text>
          </View>
          <Feather name="download" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.exportCard} 
          onPress={handleExportSales}
          disabled={exporting}
          activeOpacity={0.7}
        >
          <View style={[styles.exportCardIcon, { backgroundColor: colors.successLight }]}>
            <Feather name="dollar-sign" size={18} color={colors.success} />
          </View>
          <View style={styles.exportCardContent}>
            <Text style={styles.exportCardTitle}>Export Sales</Text>
            <Text style={styles.exportCardDesc}>Sold items with profit data</Text>
          </View>
          <Feather name="download" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Key Metrics - 2x2 Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCardWrap}>
          <StatCard
            label="Avg ROI"
            value={`${data.avg_roi}%`}
            variant={data.avg_roi > 100 ? 'highlight' : 'default'}
          />
          {data.avg_roi > 100 && (
            <View style={styles.excellentBadge}>
              <Text style={styles.excellentText}>Excellent</Text>
            </View>
          )}
        </View>
        <StatCard
          label="Avg Days to Sell"
          value={`${data.avg_days_to_sell}`}
        />
        <StatCard
          label="Dead Stock"
          value={`${data.dead_stock_percentage}%`}
          variant={data.dead_stock_percentage > 20 ? 'warning' : 'default'}
        />
        <StatCard
          label="Stale Capital"
          value={formatAmountCompact(data.capital_in_stale)}
        />
      </View>

      {/* Monthly Revenue */}
      {data.monthly_trends.length > 0 && hasChartData ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Revenue</Text>
          <View style={styles.chartCard}>
            <BarChart 
              data={data.monthly_trends} 
              valueKey="revenue"
              formatValue={(v) => formatAmountCompact(v)}
              colorFn={(_, isLast) => isLast ? colors.accent : colors.surfaceMuted}
            />
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Revenue</Text>
          <View style={styles.chartPlaceholder}>
            <Feather name="trending-up" size={32} color={colors.textMuted} />
            <Text style={styles.chartPlaceholderTitle}>Your charts will appear here</Text>
            <Text style={styles.chartPlaceholderText}>Complete your first sale to see revenue trends</Text>
          </View>
        </View>
      )}

      {/* Monthly Profit */}
      {data.monthly_trends.length > 0 && hasChartData ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Profit</Text>
          <View style={styles.chartCard}>
            <BarChart 
              data={data.monthly_trends} 
              valueKey="profit"
              formatValue={(v) => formatAmountCompact(v)}
              colorFn={(value, isLast) => {
                if (isLast) return value >= 0 ? colors.success : colors.warning;
                return colors.surfaceMuted;
              }}
            />
          </View>
        </View>
      ) : null}

      {/* Platform Performance */}
      {platformEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Platform</Text>
          <View style={styles.listCard}>
            {platformEntries.map(([platform, revenue], i) => {
              const profit = data.platform_profit[platform] || 0;
              return (
                <View key={platform}>
                  {i > 0 && <Divider />}
                  <View style={styles.listItem}>
                    <View style={styles.listItemHeader}>
                      <Text style={styles.listItemTitle}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Text>
                      <Text style={styles.listItemValue}>{formatAmount(revenue)}</Text>
                    </View>
                    <Text style={styles.listItemSubtext}>{formatAmount(profit)} profit</Text>
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
                {i > 0 && <Divider />}
                <View style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <View>
                      <Text style={styles.listItemTitle}>{category}</Text>
                      <Text style={styles.listItemSubtext}>{perf.count} sold</Text>
                    </View>
                    <Text style={[styles.listItemProfit, { color: colors.success }]}>{formatAmount(perf.profit)}</Text>
                  </View>
                  <ProgressBar value={perf.profit} max={maxCategoryProfit} color={colors.success} />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: space[8] }} />
      
      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: space[2],
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: space[2],
  },
  value: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
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
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: colors.textPrimary,
    fontFamily: fontFamily.monoBold,
  },
});

const progressStyles = StyleSheet.create({
  container: {
    height: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 2,
    marginTop: space[2] + 2,
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
    paddingHorizontal: spacing.screenPadding,
  },
  centered: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space[5],
  },
  headerActions: {
    flexDirection: 'row',
    gap: space[2],
  },
  exportBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
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

  // Export Section
  exportSection: {
    flexDirection: 'row',
    gap: space[3],
    marginBottom: space[6],
  },
  exportCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[3],
    ...shadows.xs,
  },
  exportCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportCardContent: {
    flex: 1,
  },
  exportCardTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  exportCardDesc: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 1,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
    marginBottom: space[8],
  },
  metricCardWrap: {
    flex: 1,
    minWidth: 100,
    position: 'relative',
  },
  excellentBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: colors.success,
    paddingHorizontal: space[2],
    paddingVertical: 3,
    borderRadius: radius.sm,
    zIndex: 10,
    ...shadows.sm,
  },
  excellentText: {
    fontFamily: fontFamily.bold,
    fontSize: 8,
    color: colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Sections
  section: {
    marginBottom: space[8],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: space[3] + 2,
  },

  // Chart Card
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
    ...shadows.xs,
  },
  chartPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[8],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  chartPlaceholderTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: space[4],
  },
  chartPlaceholderText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: space[1],
    textAlign: 'center',
  },

  // List Card
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.cardPadding,
    ...shadows.xs,
  },
  listItem: {
    paddingVertical: space[4],
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listItemTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  listItemValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  listItemSubtext: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listItemProfit: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    letterSpacing: -0.3,
  },
});
