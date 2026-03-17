import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { useTheme } from '../../src/ThemeContext';

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
  const { colors, themeId } = useTheme();
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
    avg_roi: d.avg_roi || d.monthly_roi || 0,
    avg_days_to_sell: Math.round((d.sell_through_rate || 0) > 0 ? 30 : 0),
    sell_through_rate: d.sell_through_rate || 0,
  };
  const actions = d.actions || [];
  const topActions = actions.slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Glass Header */}
      <View style={[styles.glassHeader, Platform.OS === 'web' && styles.glassHeaderWeb, { backgroundColor: colors.background + 'E6' }]}>
        <View style={[styles.glassHeaderContent, { paddingTop: insets.top + space[2] }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.textPrimary }]}>Resellr OS</Text>
            <Text style={[styles.date, { color: colors.textTertiary }]}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
          </View>
          <TouchableOpacity testID="settings-btn" onPress={() => router.push('/settings')} style={[styles.settingsBtn, { backgroundColor: colors.surface }]} activeOpacity={0.7}>
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
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <View style={styles.heroRow}>
            <View style={styles.heroMetric}>
              <Text style={[styles.heroLabel, { color: colors.textTertiary }]}>ACTIVE CAPITAL</Text>
              <Text style={[styles.heroValue, { color: colors.textPrimary }]}>{formatAmountCompact(metrics.active_capital || 0)}</Text>
              <Text style={[styles.heroSub, { color: colors.textTertiary }]}>{metrics.total_active || 0} items</Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroMetric}>
              <Text style={[styles.heroLabel, { color: colors.textTertiary }]}>MONTHLY PROFIT</Text>
              <Text style={[styles.heroValue, { color: metrics.monthly_profit > 0 ? colors.success : colors.textPrimary }]}>{formatAmountCompact(metrics.monthly_profit || 0)}</Text>
              <View style={styles.heroSubRow}>
                {metrics.monthly_profit > 0 && <Feather name="trending-up" size={12} color={colors.success} />}
                <Text style={[styles.heroSub, { color: metrics.monthly_profit > 0 ? colors.success : colors.textTertiary }]}>
                  {metrics.monthly_profit > 0 ? `${metrics.avg_roi || 0}% ROI` : '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── STAT PILLS ─── */}
        <View style={styles.statPillsRow}>
          <View style={[styles.statPill, { backgroundColor: colors.surface }]}>
            <View style={styles.statPillIcon}><Feather name="package" size={14} color={colors.brand} /></View>
            <Text style={[styles.statPillValue, { color: colors.brand }]}>{metrics.total_active || 0}</Text>
            <Text style={[styles.statPillLabel, { color: colors.textTertiary }]}>Active</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.surface }]}>
            <View style={styles.statPillIcon}><Feather name="tag" size={14} color={colors.success} /></View>
            <Text style={[styles.statPillValue, { color: colors.success }]}>{metrics.total_listed || 0}</Text>
            <Text style={[styles.statPillLabel, { color: colors.textTertiary }]}>Listed</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.surface }]}>
            <View style={styles.statPillIcon}><Feather name="clock" size={14} color={colors.warning} /></View>
            <Text style={[styles.statPillValue, { color: colors.warning }]}>{metrics.total_stale || 0}</Text>
            <Text style={[styles.statPillLabel, { color: colors.textTertiary }]}>Stale</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.surface }]}>
            <View style={styles.statPillIcon}><Feather name="alert-octagon" size={14} color={colors.error} /></View>
            <Text style={[styles.statPillValue, { color: colors.error }]}>{metrics.dead_stock_count || 0}</Text>
            <Text style={[styles.statPillLabel, { color: colors.textTertiary }]}>Dead</Text>
          </View>
        </View>

        {/* ─── FIRST ITEM GUIDANCE ─── */}
        {metrics.total_active === 0 && (
          <TouchableOpacity 
            style={[styles.firstItemCard, { backgroundColor: colors.surface, borderColor: colors.brand }]} 
            onPress={() => router.push('/quick-add')}
            activeOpacity={0.7}
          >
            <View style={[styles.firstItemIconWrap, { backgroundColor: colors.surfaceMuted }]}>
              <Feather name="plus-circle" size={28} color={colors.brand} />
            </View>
            <View style={styles.firstItemContent}>
              <Text style={[styles.firstItemTitle, { color: colors.textPrimary }]}>Add your first item</Text>
              <Text style={[styles.firstItemDesc, { color: colors.textSecondary }]}>Start tracking your inventory and watch your profits grow</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* ─── QUICK ACTIONS ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.brand }]}
              onPress={() => router.push('/quick-add')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.surface + '33' }]}>
                <Feather name="plus" size={18} color={colors.textInverse} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.textInverse }]}>Add Item</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/source')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.warningLight }]}>
                <Feather name="zap" size={18} color={colors.warning} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>Source Calc</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/deadstock')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.errorLight }]}>
                <Feather name="alert-triangle" size={18} color={colors.error} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>Dead Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/insights')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.surfaceMuted }]}>
                <Feather name="bar-chart-2" size={18} color={colors.textPrimary} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>Insights</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── ACTION FEED ─── */}
        <View style={[styles.section, styles.sectionWithTopSpace]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>This Week</Text>
            {actions.length > 5 && (
              <TouchableOpacity onPress={() => router.push('/deadstock')} activeOpacity={0.6}>
                <Text style={[styles.seeAll, { color: colors.brand }]}>See all {actions.length}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {topActions.length === 0 ? (
            <View style={[styles.emptyActions, { backgroundColor: colors.surface }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.successLight }]}>
                <Feather name="check-circle" size={24} color={colors.success} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All clear</Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No urgent actions this week</Text>
            </View>
          ) : (
            <View style={styles.actionsList}>
              {topActions.map((action: any, i: number) => (
                <TouchableOpacity
                  key={action.item_id || `action-${i}`}
                  testID={`action-${action.item_id || action.id}`}
                  style={[styles.actionCard, { backgroundColor: colors.surface }]}
                  onPress={() => router.push(`/item/${action.item_id}`)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: actionTypeConfig[action.type]?.bg || colors.surfaceMuted }]}>
                    <Feather name={(actionTypeConfig[action.type]?.icon || 'info') as any} size={16} color={actionTypeConfig[action.type]?.color || colors.textSecondary} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, { color: colors.textPrimary }]} numberOfLines={1}>{action.title}</Text>
                    <Text style={[styles.actionMessage, { color: colors.textTertiary }]} numberOfLines={1}>{action.message}</Text>
                  </View>
                  {action.potential_profit != null && (
                    <Text style={[styles.actionProfit, { color: action.potential_profit >= 0 ? colors.success : colors.error }]}>
                      {action.potential_profit >= 0 ? '+' : ''}{formatAmount(action.potential_profit)}
                    </Text>
                  )}
                  {['sold_pending', 'shipped_pending', 'needs_listing', 'stale_reprice', 'critical_stale'].includes(action.type) ? (
                    <TouchableOpacity 
                      style={[styles.actionQuickBtn, { backgroundColor: colors.brand }]}
                      onPress={() => handleQuickAction(action)}
                      activeOpacity={0.7}
                    >
                      <Feather name="zap" size={14} color={colors.textInverse} />
                    </TouchableOpacity>
                  ) : (
                    <Feather name="chevron-right" size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ─── VELOCITY CARD ─── */}
        {metrics.avg_days_to_sell > 0 && (
          <View style={[styles.velocityCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.velocityLeft, { borderRightColor: colors.border }]}>
              <Text style={[styles.velocityLabel, { color: colors.textTertiary }]}>Avg. Time to Sell</Text>
              <Text style={[styles.velocityValue, { color: colors.textPrimary }]}>{metrics.avg_days_to_sell} days</Text>
            </View>
            <View style={styles.velocityRight}>
              <Text style={[styles.velocityLabel, { color: colors.textTertiary }]}>Sell-Through</Text>
              <Text style={[styles.velocityValue, { color: colors.textPrimary }]}>{metrics.sell_through_rate || 0}%</Text>
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

const styles = StyleSheet.create({ // Using staticColors for static styles
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

  // Liquid Glass Header
  glassHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  glassHeaderWeb: {
    // @ts-ignore - web only property
    backdropFilter: 'blur(50px) saturate(200%)',
    WebkitBackdropFilter: 'blur(50px) saturate(200%)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
    borderBottom: '1.5px solid rgba(255,255,255,0.8)',
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.9), inset 0 -1px 1px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.06)',
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
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
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
