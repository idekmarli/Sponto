import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, statusLabels, healthLabels } from '../../src/theme';
import { api } from '../../src/api';

// Financial Row Component
function FinancialRow({ label, value, highlight = false, bold = false }: { label: string; value: string; highlight?: boolean; bold?: boolean }) {
  return (
    <View style={[finStyles.row, highlight && finStyles.rowHighlight]}>
      <Text style={[finStyles.label, bold && finStyles.labelBold]}>{label}</Text>
      <Text style={[finStyles.value, bold && finStyles.valueBold]}>{value}</Text>
    </View>
  );
}

export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      api.getItem(id)
        .then(setItem)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const updateStatus = async (status: string) => {
    if (updating) return;
    setUpdating(true);
    try {
      const updates: any = { status };
      if (status === 'sold') updates.date_sold = new Date().toISOString();
      if (status === 'listed') updates.date_listed = new Date().toISOString();
      setItem(await api.updateItem(id!, updates));
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading item...</Text>
      </View>
    );
  }

  // Not Found State
  if (!item) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <View style={styles.errorIcon}>
          <Feather name="alert-circle" size={28} color={colors.textTertiary} />
        </View>
        <Text style={styles.errorTitle}>Item not found</Text>
        <Text style={styles.errorText}>This item may have been deleted</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const health = healthLabels[item.health] || healthLabels.fresh;
  const hasPhoto = item.photos?.length > 0;
  const isSold = ['sold', 'shipped', 'completed'].includes(item.status);

  // Determine available actions based on status
  const getActions = () => {
    const actions = [];
    
    if (!['listed', 'crosslisted', 'sold', 'shipped', 'completed'].includes(item.status)) {
      actions.push({ key: 'listed', label: 'Mark Listed', icon: 'tag', color: colors.textPrimary });
    }
    if (item.status === 'listed') {
      actions.push({ key: 'crosslisted', label: 'Crosslisted', icon: 'copy', color: colors.textPrimary });
    }
    if (['listed', 'crosslisted'].includes(item.status)) {
      actions.push({ key: 'sold', label: 'Mark Sold', icon: 'dollar-sign', color: colors.success });
    }
    if (item.status === 'sold') {
      actions.push({ key: 'shipped', label: 'Shipped', icon: 'truck', color: colors.textPrimary });
    }
    if (item.status === 'shipped') {
      actions.push({ key: 'completed', label: 'Complete', icon: 'check-circle', color: colors.success });
    }
    
    return actions;
  };

  const actions = getActions();

  return (
    <ScrollView
      testID="item-detail-screen"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Navigation */}
      <View style={styles.nav}>
        <TouchableOpacity
          testID="back-btn"
          onPress={() => router.back()}
          style={styles.navBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          testID="edit-item-btn"
          onPress={() => router.push(`/add-item?edit=${id}`)}
          style={styles.navBtn}
          activeOpacity={0.6}
        >
          <Feather name="edit-2" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Photo */}
      <View style={styles.photoContainer}>
        {hasPhoto ? (
          <Image source={{ uri: item.photos[0] }} style={styles.photo} />
        ) : (
          <View style={styles.photoEmpty}>
            <Feather name="camera" size={24} color={colors.textMuted} />
            <Text style={styles.photoEmptyText}>No photos</Text>
          </View>
        )}
      </View>

      {/* Title & Status */}
      <Text style={styles.itemTitle}>{item.title}</Text>
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: health.bg }]}>
          <View style={[styles.badgeDot, { backgroundColor: health.color }]} />
          <Text style={[styles.badgeText, { color: health.color }]}>{health.label}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={styles.badgeText}>{statusLabels[item.status] || item.status}</Text>
        </View>
      </View>

      {/* Item Info Card */}
      <View style={styles.infoCard}>
        {[
          { label: 'Brand', value: item.brand },
          { label: 'Category', value: item.category },
          { label: 'Size', value: item.size },
          { label: 'Condition', value: item.condition },
          { label: 'Source', value: item.source },
        ].map((row, i) => row.value ? (
          <View key={i}>
            {i > 0 && <View style={styles.infoDivider} />}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          </View>
        ) : null)}
      </View>

      {/* Platforms */}
      {item.platforms?.length > 0 && (
        <View style={styles.platformsRow}>
          {item.platforms.map((p: string) => (
            <View key={p} style={styles.platformChip}>
              <Text style={styles.platformText}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Financials */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financials</Text>
        <View style={styles.card}>
          <FinancialRow label="Purchase Price" value={`$${item.purchase_price || 0}`} />
          <FinancialRow label="Shipping to Acquire" value={`$${item.shipping_to_acquire || 0}`} />
          <FinancialRow label="Prep / Repair" value={`$${item.prep_cost || 0}`} />
          <FinancialRow label="Total Cost Basis" value={`$${item.total_cost_basis || 0}`} highlight bold />
          <FinancialRow label="Target List Price" value={`$${item.target_list_price || 0}`} />
          {item.sold_price > 0 && (
            <>
              <View style={styles.cardDivider} />
              <FinancialRow label="Sold Price" value={`$${item.sold_price}`} />
              <FinancialRow label="Fees" value={`-$${item.fees || 0}`} />
              <FinancialRow label="Packaging" value={`-$${item.packaging_cost || 0}`} />
            </>
          )}
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Net Profit</Text>
            <Text style={[styles.profitValue, { color: item.net_profit >= 0 ? colors.success : colors.warning }]}>
              ${item.net_profit}
            </Text>
          </View>
          <FinancialRow label="ROI" value={`${item.roi}%`} />
        </View>
      </View>

      {/* Lifecycle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lifecycle</Text>
        <View style={styles.card}>
          <FinancialRow label="Acquired" value={item.date_acquired ? new Date(item.date_acquired).toLocaleDateString() : '—'} />
          <FinancialRow label="Listed" value={item.date_listed ? new Date(item.date_listed).toLocaleDateString() : '—'} />
          <FinancialRow label="Sold" value={item.date_sold ? new Date(item.date_sold).toLocaleDateString() : '—'} />
          {item.days_listed != null && <FinancialRow label="Days Listed" value={`${item.days_listed}`} />}
          {item.days_to_sell != null && <FinancialRow label="Days to Sell" value={`${item.days_to_sell}`} />}
        </View>
      </View>

      {/* Notes */}
      {item.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        </View>
      ) : null}

      {/* Actions */}
      {actions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsGrid}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.key}
                testID={`action-mark-${action.key}`}
                style={styles.actionBtn}
                onPress={() => updateStatus(action.key)}
                disabled={updating}
                activeOpacity={0.6}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: action.color === colors.success ? colors.successLight : colors.surfaceHighlight }]}>
                  <Feather name={action.icon as any} size={18} color={action.color} />
                </View>
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Archive Button */}
      {!isSold && (
        <TouchableOpacity
          testID="action-archive"
          style={styles.archiveBtn}
          onPress={() => updateStatus('completed')}
          activeOpacity={0.6}
        >
          <Feather name="archive" size={16} color={colors.warning} />
          <Text style={styles.archiveBtnText}>Archive Item</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const finStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowHighlight: {
    backgroundColor: colors.surfaceHighlight,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: borderRadius.m,
  },
  label: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  labelBold: {
    fontFamily: 'Mulish_700Bold',
    color: colors.textPrimary,
  },
  value: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
  },
  valueBold: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: 15,
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

  // Error
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: borderRadius.pill,
  },
  backBtnText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  // Navigation
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },

  // Photo
  photoContainer: {
    marginBottom: spacing.l,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceHighlight,
  },
  photoEmpty: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoEmptyText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textTertiary,
  },

  // Title & Badges
  itemTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.6,
    lineHeight: 34,
    marginBottom: 14,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.l,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.pill,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    paddingHorizontal: 16,
    marginBottom: spacing.m,
    ...shadows.subtle,
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  infoLabel: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },

  // Platforms
  platformsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: spacing.l,
  },
  platformChip: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.pill,
  },
  platformText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Sections
  section: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 17,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...shadows.subtle,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },

  // Profit Row
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    marginTop: 4,
  },
  profitLabel: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  profitValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 24,
    letterSpacing: -0.5,
  },

  // Notes
  notesText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
    paddingVertical: 12,
  },

  // Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.l,
    ...shadows.card,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },

  // Archive
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: borderRadius.l,
    backgroundColor: colors.warningLight,
    marginBottom: spacing.m,
  },
  archiveBtnText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.warning,
  },
});
