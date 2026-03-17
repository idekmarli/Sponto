import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows, typography, cardStyles, buttonStyles, actionTypeConfig, priorityConfig } from '../../src/theme';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';
import { QuickActionSheet } from '../../src/components/QuickActionSheet';
import { SoldModal } from '../../src/components/SoldModal';
import { Toast } from '../../src/components/Toast';
import { Skeleton, SkeletonStatCard, SkeletonListItem } from '../../src/components/UI';

// Glass Header Height for padding
const HEADER_HEIGHT = 90;

// ─── HERO METRIC CARD ───
function HeroMetric({ label, value, subValue, trend, color }: {
  label: string; value: string; subValue?: string; trend?: 'up' | 'down' | 'neutral'; color?: string;
}) {
  const trendColor = trend === 'up' ? colors.success : trend === 'down' ? colors.error : colors.textTertiary;
  return (
    <View style={styles.heroMetric}>
      <Text style={styles.heroLabel}>{label}</Text>
      <Text style={[styles.heroValue, color ? { color } : null]}>{value}</Text>
      {subValue && (
        <View style={styles.heroSubRow}>
          {trend && trend !== 'neutral' && (
            <Feather name={trend === 'up' ? 'trending-up' : 'trending-down'} size={12} color={trendColor} />
          )}
          <Text style={[styles.heroSub, { color: trendColor }]}>{subValue}</Text>
        </View>
      )}
    </View>
  );
}

// ─── STAT PILL ───
function StatPill({ icon, value, label, color = colors.textPrimary }: {
  icon: string; value: string | number; label: string; color?: string;
}) {
  return (
    <View style={styles.statPill}>
      <View style={styles.statPillIcon}>
        <Feather name={icon as any} size={14} color={color} />
      </View>
      <Text style={[styles.statPillValue, { color }]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

// ─── ACTION ITEM ───
function ActionItem({ action, onQuickAction, onNavigate }: { 
  action: any; 
  onQuickAction: (action: any) => void;
  onNavigate: () => void;
}) {
  const config = actionTypeConfig[action.type] || actionTypeConfig.default;
  const { formatAmount } = useCurrency();
  const hasQuickAction = ['sold_pending', 'shipped_pending', 'needs_listing', 'stale_reprice', 'critical_stale'].includes(action.type);

  return (
    <TouchableOpacity
      testID={`action-${action.item_id || action.id}`}
      style={styles.actionCard}
      onPress={onNavigate}
      activeOpacity={0.6}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: config.bg }]}>
        <Feather name={config.icon as any} size={16} color={config.color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle} numberOfLines={1}>{action.title}</Text>
        <Text style={styles.actionMessage} numberOfLines={1}>{action.message}</Text>
      </View>
      {action.potential_profit != null && (
        <Text style={[styles.actionProfit, { color: action.potential_profit >= 0 ? colors.success : colors.error }]}>
          {action.potential_profit >= 0 ? '+' : ''}{formatAmount(action.potential_profit)}
        </Text>
      )}
      {hasQuickAction ? (
        <TouchableOpacity 
          style={styles.actionQuickBtn}
          onPress={(e) => { e.stopPropagation(); onQuickAction(action); }}
          activeOpacity={0.7}
        >
          <Feather name="zap" size={14} color={colors.textInverse} />
        </TouchableOpacity>
      ) : (
        <Feather name="chevron-right" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

// ─── QUICK ACTION BUTTON ───
function QuickActionButton({ icon, label, onPress, variant = 'default' }: {
  icon: string; label: string; onPress: () => void; variant?: 'default' | 'primary' | 'success';
}) {
  const bgColor = variant === 'primary' ? colors.brand : variant === 'success' ? colors.success : colors.surface;
  const textColor = variant === 'default' ? colors.textPrimary : colors.textInverse;
  const iconColor = variant === 'default' ? colors.brand : colors.textInverse;

  return (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: bgColor }, variant !== 'default' && shadows.sm]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, variant === 'default' && { backgroundColor: colors.surfaceMuted }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={[styles.quickActionLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { formatAmount, formatAmountCompact } = useCurrency();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionSheet, setActionSheet] = useState({ visible: false, action: null as any });
  const [soldModal, setSoldModal] = useState({ visible: false, item: null as any });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(await api.getDashboard());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleQuickAction = (action: any) => {
    if (action.type === 'sold_pending' || action.type === 'needs_listing') {
      setSoldModal({ visible: true, item: { id: action.item_id, title: action.title, target_list_price: action.potential_profit || 0, total_cost_basis: 0 } });
    } else {
      setActionSheet({ visible: true, action });
    }
  };

  const handleSoldConfirm = async (soldPrice: number) => {
    if (!soldModal.item) return;
    await api.updateItem(soldModal.item.id, {
      status: 'sold',
      sold_price: soldPrice,
      date_sold: new Date().toISOString(),
    });
    setToast({ visible: true, message: `Sold for ${formatAmount(soldPrice)}!`, type: 'success' });
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Skeleton */}
          <View style={styles.header}>
            <View>
              <Skeleton width={140} height={28} borderRadius={radius.sm} />
              <Skeleton width={100} height={14} style={{ marginTop: space[2] }} />
            </View>
            <Skeleton width={40} height={40} borderRadius={20} />
          </View>

          {/* Hero Card Skeleton */}
          <View style={[cardStyles.hero, styles.heroCard]}>
            <View style={styles.heroRow}>
              <View style={styles.heroMetric}>
                <Skeleton width={90} height={10} />
                <Skeleton width={70} height={32} style={{ marginTop: space[2] }} />
                <Skeleton width={50} height={12} style={{ marginTop: space[2] }} />
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroMetric}>
                <Skeleton width={90} height={10} />
                <Skeleton width={70} height={32} style={{ marginTop: space[2] }} />
                <Skeleton width={50} height={12} style={{ marginTop: space[2] }} />
              </View>
            </View>
          </View>

          {/* Stats Pills Skeleton */}
          <View style={styles.statPillsRow}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.statPill}>
                <Skeleton width={32} height={32} borderRadius={16} />
                <Skeleton width={20} height={18} style={{ marginTop: space[1] }} />
                <Skeleton width={40} height={10} style={{ marginTop: space[1] }} />
              </View>
            ))}
          </View>

          {/* Quick Actions Skeleton */}
          <View style={styles.sectionHeader}>
            <Skeleton width={100} height={18} />
          </View>
          <View style={styles.quickActionsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width="48%" height={56} borderRadius={radius.lg} style={{ marginBottom: space[3] }} />
            ))}
          </View>

          {/* This Week Skeleton */}
          <View style={styles.sectionHeader}>
            <Skeleton width={80} height={18} />
          </View>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: space[3] }}>
              <SkeletonListItem />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  const d = dashboard || {};
  // Dashboard data is at root level, not nested under metrics
  const metrics = {
    active_capital: d.capital_in_inventory || 0,
    monthly_profit: d.monthly_net_profit || 0,
    total_active: (d.active_listings || 0) + (d.pre_listing || 0),
    total_listed: d.active_listings || 0,
    total_stale: d.stale_count || 0,
    dead_stock_count: d.dead_stock_count || 0,
    avg_roi: d.avg_margin || 0,
    avg_days_to_sell: Math.round((d.sell_through_rate || 0) > 0 ? 30 : 0),
    sell_through_rate: d.sell_through_rate || 0,
  };
  const actions = d.actions || [];
  const topActions = actions.slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Glass Header */}
      <View style={[styles.glassHeader, Platform.OS === 'web' && styles.glassHeaderWeb]}>
        <View style={[styles.glassHeaderContent, { paddingTop: insets.top + space[2] }]}>
          <View>
            <Text style={styles.greeting}>Resellr OS</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
          </View>
          <TouchableOpacity testID="settings-btn" onPress={() => router.push('/settings')} style={styles.settingsBtn} activeOpacity={0.7}>
            <Feather name="settings" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        testID="home-screen"
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + HEADER_HEIGHT, paddingBottom: insets.bottom + space[8] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} tintColor={colors.brand} />
        }
      >

        {/* ─── HERO METRICS CARD ─── */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <HeroMetric 
              label="Active Capital" 
              value={formatAmountCompact(metrics.active_capital || 0)}
              subValue={`${metrics.total_active || 0} items`}
            />
            <View style={styles.heroDivider} />
            <HeroMetric 
              label="Monthly Profit" 
              value={formatAmountCompact(metrics.monthly_profit || 0)}
              subValue={metrics.monthly_profit > 0 ? `${metrics.avg_roi || 0}% ROI` : '—'}
              trend={metrics.monthly_profit > 0 ? 'up' : 'neutral'}
              color={metrics.monthly_profit > 0 ? colors.success : colors.textPrimary}
            />
          </View>
        </View>

        {/* ─── STAT PILLS ─── */}
        <View style={styles.statPillsRow}>
          <StatPill icon="package" value={metrics.total_active || 0} label="Active" color={colors.brand} />
          <StatPill icon="tag" value={metrics.total_listed || 0} label="Listed" color={colors.success} />
          <StatPill icon="clock" value={metrics.total_stale || 0} label="Stale" color={colors.warning} />
          <StatPill icon="alert-octagon" value={metrics.dead_stock_count || 0} label="Dead" color={colors.error} />
        </View>

        {/* ─── FIRST ITEM GUIDANCE ─── */}
        {metrics.total_active === 0 && (
          <TouchableOpacity 
            style={styles.firstItemCard} 
            onPress={() => router.push('/quick-add')}
            activeOpacity={0.7}
          >
            <View style={styles.firstItemIconWrap}>
              <Feather name="plus-circle" size={28} color={colors.brand} />
            </View>
            <View style={styles.firstItemContent}>
              <Text style={styles.firstItemTitle}>Add your first item</Text>
              <Text style={styles.firstItemDesc}>Start tracking your inventory and watch your profits grow</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* ─── QUICK ACTIONS ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton icon="plus" label="Add Item" onPress={() => router.push('/quick-add')} variant="primary" />
            <QuickActionButton icon="zap" label="Source Calc" onPress={() => router.push('/source')} />
            <QuickActionButton icon="alert-triangle" label="Dead Stock" onPress={() => router.push('/deadstock')} />
            <QuickActionButton icon="bar-chart-2" label="Insights" onPress={() => router.push('/insights')} />
          </View>
        </View>

        {/* ─── ACTION FEED ─── */}
        <View style={[styles.section, styles.sectionWithTopSpace]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Week</Text>
            {actions.length > 5 && (
              <TouchableOpacity onPress={() => router.push('/deadstock')} activeOpacity={0.6}>
                <Text style={styles.seeAll}>See all {actions.length}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {topActions.length === 0 ? (
            <View style={styles.emptyActions}>
              <View style={styles.emptyIcon}>
                <Feather name="check-circle" size={24} color={colors.success} />
              </View>
              <Text style={styles.emptyTitle}>All clear</Text>
              <Text style={styles.emptyText}>No urgent actions this week</Text>
            </View>
          ) : (
            <View style={styles.actionsList}>
              {topActions.map((action: any, i: number) => (
                <ActionItem
                  key={action.item_id || `action-${i}`}
                  action={action}
                  onQuickAction={handleQuickAction}
                  onNavigate={() => router.push(`/item/${action.item_id}`)}
                />
              ))}
            </View>
          )}
        </View>

        {/* ─── VELOCITY CARD ─── */}
        {metrics.avg_days_to_sell > 0 && (
          <View style={styles.velocityCard}>
            <View style={styles.velocityLeft}>
              <Text style={styles.velocityLabel}>Avg. Time to Sell</Text>
              <Text style={styles.velocityValue}>{metrics.avg_days_to_sell} days</Text>
            </View>
            <View style={styles.velocityRight}>
              <Text style={styles.velocityLabel}>Sell-Through</Text>
              <Text style={styles.velocityValue}>{metrics.sell_through_rate || 0}%</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <QuickActionSheet
        visible={actionSheet.visible}
        action={actionSheet.action}
        onClose={() => setActionSheet({ visible: false, action: null })}
        onComplete={(msg) => {
          setToast({ visible: true, message: msg, type: 'success' });
          fetchDashboard();
        }}
      />

      <SoldModal
        visible={soldModal.visible}
        onClose={() => setSoldModal({ visible: false, item: null })}
        item={soldModal.item}
        onConfirm={handleSoldConfirm}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: space[4],
  },

  // Glass Header
  glassHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(245, 244, 242, 0.75)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  glassHeaderWeb: {
    // @ts-ignore - web only property
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  glassHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: space[3],
  },
  greeting: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  date: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: space[1],
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero Card
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[5],
    marginBottom: space[4],
    ...shadows.medium,
  },
  heroRow: {
    flexDirection: 'row',
  },
  heroDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: space[5],
  },
  heroMetric: {
    flex: 1,
  },
  heroLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space[2],
  },
  heroValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    marginTop: space[1],
  },
  heroSub: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },

  // Stat Pills
  statPillsRow: {
    flexDirection: 'row',
    gap: space[2],
    marginBottom: space[6],
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: space[3],
    paddingHorizontal: space[2],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    ...shadows.xs,
  },
  statPillIcon: {
    marginBottom: space[2],
  },
  statPillValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  statPillLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 3,
    textAlign: 'center',
  },

  // First Item Guidance Card
  firstItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[4],
    marginBottom: space[5],
    borderWidth: 2,
    borderColor: colors.brand,
    borderStyle: 'dashed',
    gap: space[3],
    ...shadows.sm,
  },
  firstItemIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstItemContent: {
    flex: 1,
  },
  firstItemTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  firstItemDesc: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Sections
  section: {
    marginBottom: space[7],
  },
  sectionWithTopSpace: {
    marginTop: space[2],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: space[3],
  },
  seeAll: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.brand,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  quickAction: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: space[4],
    paddingHorizontal: space[3],
    minHeight: 64,
    ...shadows.xs,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    flex: 1,
  },

  // Actions List
  actionsList: {
    gap: space[2],
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[3] + 2,
    gap: space[3],
    ...shadows.sm,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionMessage: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  actionProfit: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    letterSpacing: -0.3,
  },
  actionQuickBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty Actions
  emptyActions: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[8],
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[3],
  },
  emptyTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: space[1],
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },

  // Velocity Card
  velocityCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[4],
    ...shadows.sm,
  },
  velocityLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: space[4],
  },
  velocityRight: {
    flex: 1,
    paddingLeft: space[4],
  },
  velocityLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space[1],
  },
  velocityValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
});
