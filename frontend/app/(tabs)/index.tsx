import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, cardStyles, shadows, actionTypeConfig, priorityConfig, iconSize } from '../../src/theme';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';
import { QuickActionSheet, QuickAction } from '../../src/components/QuickActionSheet';
import { SoldModal } from '../../src/components/SoldModal';
import { Toast } from '../../src/components/Toast';
import { Badge, EmptyState, SectionHeader } from '../../src/components/UI';

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
function ActionItem({ action, onQuickAction, onNavigate, isLast }: { 
  action: any; 
  onQuickAction: (action: any) => void;
  onNavigate: () => void; 
  isLast: boolean;
}) {
  const config = actionTypeConfig[action.type] || actionTypeConfig.default;
  const priority = action.priority || 7;
  const priorityInfo = priorityConfig[priority] || priorityConfig[7];
  const { formatAmount } = useCurrency();
  const hasQuickAction = ['sold_pending', 'shipped_pending', 'needs_listing', 'stale_reprice', 'critical_stale'].includes(action.type);

  return (
    <View style={[styles.actionItem, !isLast && styles.actionItemBorder]}>
      <TouchableOpacity
        testID={`action-${action.type}-${action.item_id}`}
        style={styles.actionItemContent}
        onPress={onNavigate}
        activeOpacity={0.5}
      >
        <View style={[styles.actionIcon, { backgroundColor: config.bg }]}>
          <Feather name={config.icon as any} size={iconSize.sm} color={config.color} />
        </View>
        <View style={styles.actionBody}>
          <Text style={styles.actionMessage} numberOfLines={2}>{action.message}</Text>
          <View style={styles.actionMeta}>
            {priority <= 3 && (
              <Badge label={priorityInfo.label} variant={priority === 1 ? 'error' : priority === 2 ? 'warning' : 'default'} size="sm" />
            )}
            {action.capital_at_risk > 0 && (
              <Text style={styles.actionRisk}>{formatAmount(action.capital_at_risk)} at risk</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      {hasQuickAction && (
        <TouchableOpacity
          testID={`quick-action-${action.item_id}`}
          style={styles.quickActionBtn}
          onPress={() => onQuickAction(action)}
          activeOpacity={0.6}
        >
          <Feather name="zap" size={iconSize.sm} color={colors.accent} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Mini Bar Chart
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
                  ? { backgroundColor: colors.brand }
                  : { backgroundColor: isPositive ? colors.successMuted : colors.warningMuted }
              ]} />
            </View>
            <Text style={[styles.trendLabel, isLast && styles.trendLabelActive]}>{d.month}</Text>
          </View>
        );
      })}
    </View>
  );
}

// Health Bar
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
  const { formatAmount } = useCurrency();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickActionVisible, setQuickActionVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [soldModalVisible, setSoldModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });

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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleQuickAction = (action: any) => {
    setSelectedAction(action);
    if (action.type === 'sold_pending') {
      setSelectedItem({ id: action.item_id, title: action.title, target_list_price: action.suggested_price || 0, total_cost_basis: 0 });
      setSoldModalVisible(true);
      return;
    }
    setQuickActionVisible(true);
  };

  const getQuickActions = (action: any): QuickAction[] => {
    if (!action) return [];
    switch (action.type) {
      case 'shipped_pending':
        return [{ key: 'complete', label: 'Mark as Complete', icon: 'check-circle', color: colors.success }, { key: 'view', label: 'View Details', icon: 'eye' }];
      case 'needs_listing':
        return [{ key: 'list', label: 'Mark as Listed', icon: 'tag', color: colors.success }, { key: 'view', label: 'View Details', icon: 'eye' }];
      case 'stale_reprice':
      case 'critical_stale':
        return [{ key: 'reprice', label: `Drop to ${formatAmount(action.suggested_price)}`, icon: 'trending-down', color: colors.warning }, { key: 'view', label: 'View Details', icon: 'eye' }];
      default:
        return [{ key: 'view', label: 'View Details', icon: 'eye' }];
    }
  };

  const executeQuickAction = async (key: string) => {
    if (!selectedAction) return;
    try {
      if (key === 'view') { router.push(`/item/${selectedAction.item_id}`); return; }
      if (key === 'complete') { await api.updateItem(selectedAction.item_id, { status: 'completed' }); setToast({ visible: true, message: 'Marked complete!', type: 'success' }); }
      else if (key === 'list') { await api.updateItem(selectedAction.item_id, { status: 'listed', date_listed: new Date().toISOString() }); setToast({ visible: true, message: 'Marked as listed!', type: 'success' }); }
      else if (key === 'reprice') { await api.updateItem(selectedAction.item_id, { target_list_price: selectedAction.suggested_price }); setToast({ visible: true, message: `Price updated`, type: 'success' }); }
      fetchData();
    } catch (e) { setToast({ visible: true, message: 'Action failed', type: 'error' as const }); }
  };

  const handleSoldConfirm = async (soldPrice: number) => {
    if (!selectedItem) return;
    await api.updateItem(selectedItem.id, { status: 'sold', sold_price: soldPrice, date_sold: new Date().toISOString() });
    setToast({ visible: true, message: `Sold for ${formatAmount(soldPrice)}!`, type: 'success' });
    fetchData();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.centered]}>
        <EmptyState icon="wifi-off" title="Unable to load" description="Check your connection and try again" />
        <TouchableOpacity testID="retry-btn" style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasRisk = data.capital_at_risk > 0 || data.dead_stock_count > 0;

  return (
    <>
      <ScrollView
        testID="home-screen"
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space[4] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandArea}>
            <Text style={styles.brandName}>Resellr</Text>
            <Text style={styles.brandTag}>OS</Text>
          </View>
          <TouchableOpacity testID="settings-btn" onPress={() => router.push('/settings')} style={styles.iconBtn} activeOpacity={0.6}>
            <Feather name="settings" size={iconSize.md} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View testID="hero-profit" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>Net Profit</Text>
            <Badge label="This Month" variant="brand" size="sm" />
          </View>
          <Text style={styles.heroValue}>{formatAmount(data.monthly_net_profit)}</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{formatAmount(data.monthly_revenue)}</Text>
              <Text style={styles.heroStatLabel}>revenue</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{data.sold_this_month}</Text>
              <Text style={styles.heroStatLabel}>sold</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{formatAmount(data.profit_velocity)}/d</Text>
              <Text style={styles.heroStatLabel}>velocity</Text>
            </View>
          </View>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={[cardStyles.padded, styles.metricCard]}>
            <Text style={styles.metricLabel}>Sell-Through</Text>
            <Text style={styles.metricValue}>{data.sell_through_rate}%</Text>
          </View>
          <View style={[cardStyles.padded, styles.metricCard]}>
            <Text style={styles.metricLabel}>Avg Margin</Text>
            <Text style={styles.metricValue}>{data.avg_margin}%</Text>
          </View>
          <View style={[cardStyles.padded, styles.metricCard]}>
            <Text style={styles.metricLabel}>Active</Text>
            <Text style={styles.metricValue}>{data.active_listings}</Text>
          </View>
        </View>

        {/* Capital */}
        <View style={styles.capitalRow}>
          <View style={[cardStyles.padded, styles.capitalCard]}>
            <Feather name="lock" size={iconSize.sm} color={colors.textSecondary} />
            <View>
              <Text style={styles.capitalLabel}>Capital Locked</Text>
              <Text style={styles.capitalValue}>{formatAmount(data.capital_in_inventory)}</Text>
            </View>
          </View>
          {hasRisk && (
            <TouchableOpacity style={[cardStyles.padded, styles.capitalCard, styles.capitalCardRisk]} onPress={() => router.push('/deadstock')} activeOpacity={0.6}>
              <Feather name="alert-triangle" size={iconSize.sm} color={colors.warning} />
              <View>
                <Text style={[styles.capitalLabel, { color: colors.warning }]}>At Risk</Text>
                <Text style={[styles.capitalValue, { color: colors.warning }]}>{formatAmount(data.capital_at_risk)}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Health */}
        {data.inventory_age && (
          <View style={styles.section}>
            <SectionHeader title="Inventory Health" />
            <View style={cardStyles.padded}><HealthBar age={data.inventory_age} /></View>
          </View>
        )}

        {/* Trend */}
        {data.trends?.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Profit Trend" subtitle="6 months" />
            <View style={cardStyles.padded}><TrendChart data={data.trends} /></View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.quickActionsRow}>
            <TouchableOpacity testID="quick-add" style={styles.quickActionCard} onPress={() => router.push('/quick-add')} activeOpacity={0.6}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.brand }]}><Feather name="plus" size={iconSize.md} color={colors.textInverse} /></View>
              <Text style={styles.quickActionLabel}>Quick Add</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="quick-source" style={styles.quickActionCard} onPress={() => router.push('/(tabs)/source')} activeOpacity={0.6}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accent }]}><Feather name="target" size={iconSize.md} color={colors.textInverse} /></View>
              <Text style={styles.quickActionLabel}>Source Calc</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="quick-deadstock" style={styles.quickActionCard} onPress={() => router.push('/deadstock')} activeOpacity={0.6}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.warning }]}><Feather name="alert-triangle" size={iconSize.md} color={colors.textInverse} /></View>
              <Text style={styles.quickActionLabel}>Dead Stock</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Feed */}
        {data.actions?.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Action Feed" action={<Badge label={String(data.action_count)} />} />
            <View style={cardStyles.padded}>
              {data.actions.slice(0, 6).map((action, i) => (
                <ActionItem key={`${action.item_id}-${action.type}`} action={action} onQuickAction={handleQuickAction} onNavigate={() => router.push(`/item/${action.item_id}`)} isLast={i === Math.min(data.actions.length, 6) - 1} />
              ))}
            </View>
          </View>
        )}

        {(!data.actions || data.actions.length === 0) && (
          <View style={styles.section}>
            <SectionHeader title="Action Feed" />
            <View style={cardStyles.padded}><EmptyState icon="check-circle" title="All caught up" description="No urgent actions needed" variant="success" /></View>
          </View>
        )}

        <View style={{ height: space[8] }} />
      </ScrollView>

      <QuickActionSheet visible={quickActionVisible} onClose={() => { setQuickActionVisible(false); setSelectedAction(null); }} title={selectedAction?.title} subtitle={selectedAction?.message} actions={getQuickActions(selectedAction)} onAction={executeQuickAction} />
      <SoldModal visible={soldModalVisible} onClose={() => { setSoldModalVisible(false); setSelectedItem(null); }} item={selectedItem} onConfirm={handleSoldConfirm} />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.screenPadding },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.screenPadding },
  loadingText: { fontFamily: fontFamily.regular, fontSize: fontSize.md, color: colors.textTertiary, marginTop: space[4] },
  retryBtn: { backgroundColor: colors.brand, paddingHorizontal: space[8], paddingVertical: space[3], borderRadius: radius.full, marginTop: space[4] },
  retryBtnText: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.textInverse },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space[6] },
  brandArea: { flexDirection: 'row', alignItems: 'baseline', gap: space[2] },
  brandName: { fontFamily: fontFamily.bold, fontSize: fontSize['3xl'], color: colors.textPrimary, letterSpacing: -0.8 },
  brandTag: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: colors.textTertiary, letterSpacing: 2, textTransform: 'uppercase' },
  iconBtn: { width: spacing.touchTarget, height: spacing.touchTarget, borderRadius: spacing.touchTarget / 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.xs },

  heroCard: { backgroundColor: colors.brand, borderRadius: radius.xl, paddingHorizontal: spacing.cardPaddingLarge, paddingTop: space[6], paddingBottom: space[5], marginBottom: space[3], ...shadows.lg },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[2] },
  heroLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroValue: { fontFamily: fontFamily.bold, fontSize: fontSize['5xl'], color: colors.textInverse, letterSpacing: -2, marginBottom: space[5] },
  heroStats: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: space[4] },
  heroStatItem: { flex: 1 },
  heroStatValue: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: 'rgba(255,255,255,0.9)', marginBottom: 2 },
  heroStatLabel: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },

  metricsRow: { flexDirection: 'row', gap: space[2], marginBottom: space[2] },
  metricCard: { flex: 1 },
  metricLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: colors.textTertiary, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: space[1] },
  metricValue: { fontFamily: fontFamily.bold, fontSize: fontSize.xl, color: colors.textPrimary, letterSpacing: -0.5 },

  capitalRow: { flexDirection: 'row', gap: space[2], marginBottom: spacing.sectionGap },
  capitalCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[3] },
  capitalCardRisk: { backgroundColor: colors.warningLight },
  capitalLabel: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 2 },
  capitalValue: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textPrimary, letterSpacing: -0.3 },

  section: { marginBottom: spacing.sectionGap },

  healthContainer: { gap: space[3] },
  healthBar: { flexDirection: 'row', height: 8, gap: 2 },
  healthSegment: { minWidth: 8 },
  healthLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: space[4] },
  healthLegendItem: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthLegendText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textSecondary },

  trendContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, paddingTop: space[2] },
  trendCol: { flex: 1, alignItems: 'center', gap: space[2] },
  trendBarArea: { justifyContent: 'flex-end', height: 52 },
  trendBar: { width: 24, borderRadius: 6 },
  trendLabel: { fontFamily: fontFamily.mono, fontSize: fontSize.xs, color: colors.textTertiary, letterSpacing: 0.3 },
  trendLabelActive: { color: colors.textPrimary, fontFamily: fontFamily.monoBold },

  quickActionsRow: { flexDirection: 'row', gap: space[2] },
  quickActionCard: { flex: 1, alignItems: 'center', gap: space[3], backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: space[5], ...shadows.sm },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },

  actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: space[3] },
  actionItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  actionItemContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  actionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionBody: { flex: 1, gap: space[1] },
  actionMessage: { fontFamily: fontFamily.medium, fontSize: fontSize.md, color: colors.textPrimary, lineHeight: fontSize.md * 1.4 },
  actionMeta: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  actionRisk: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textTertiary },
  quickActionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginLeft: space[2] },
});
