import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, statusLabels, healthLabels } from '../../src/theme';
import { api } from '../../src/api';
import { SoldModal } from '../../src/components/SoldModal';
import { Toast } from '../../src/components/Toast';

// Financial Row Component
function FinancialRow({ label, value, highlight = false, bold = false }: { label: string; value: string; highlight?: boolean; bold?: boolean }) {
  return (
    <View style={[finStyles.row, highlight && finStyles.rowHighlight]}>
      <Text style={[finStyles.label, bold && finStyles.labelBold]}>{label}</Text>
      <Text style={[finStyles.value, bold && finStyles.valueBold]}>{value}</Text>
    </View>
  );
}

// Get next workflow step
function getNextStep(status: string): { key: string; label: string; icon: string; color: string } | null {
  const steps: Record<string, { key: string; label: string; icon: string; color: string }> = {
    sourced: { key: 'listed', label: 'Mark Listed', icon: 'tag', color: colors.success },
    intake: { key: 'listed', label: 'Mark Listed', icon: 'tag', color: colors.success },
    photographed: { key: 'listed', label: 'Mark Listed', icon: 'tag', color: colors.success },
    listed: { key: 'sold', label: 'Mark Sold', icon: 'dollar-sign', color: colors.success },
    crosslisted: { key: 'sold', label: 'Mark Sold', icon: 'dollar-sign', color: colors.success },
    sold: { key: 'shipped', label: 'Mark Shipped', icon: 'truck', color: colors.textPrimary },
    shipped: { key: 'completed', label: 'Complete', icon: 'check-circle', color: colors.success },
  };
  return steps[status] || null;
}

export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Modal state
  const [soldModalVisible, setSoldModalVisible] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (id) {
      api.getItem(id)
        .then(setItem)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const updateStatus = async (status: string, additionalData?: any) => {
    if (updating) return;
    setUpdating(true);
    try {
      const updates: any = { status, ...additionalData };
      if (status === 'listed') updates.date_listed = new Date().toISOString();
      if (status === 'shipped' || status === 'completed') {
        // Keep existing dates
      }
      const updated = await api.updateItem(id!, updates);
      setItem(updated);
      setToast({ visible: true, message: `Marked as ${statusLabels[status] || status}`, type: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ visible: true, message: 'Failed to update', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleNextStep = () => {
    if (!item) return;
    const next = getNextStep(item.status);
    if (!next) return;

    if (next.key === 'sold') {
      setSoldModalVisible(true);
    } else {
      updateStatus(next.key);
    }
  };

  const handleSoldConfirm = async (soldPrice: number) => {
    await updateStatus('sold', { sold_price: soldPrice, date_sold: new Date().toISOString() });
    setToast({ visible: true, message: `Sold for $${soldPrice}! 🎉`, type: 'success' });
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
  const isCompleted = item.status === 'completed';
  const nextStep = getNextStep(item.status);

  return (
    <>
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

        {/* Primary Action - Next Step */}
        {nextStep && !isCompleted && (
          <TouchableOpacity
            testID={`action-${nextStep.key}`}
            style={[styles.primaryAction, { backgroundColor: nextStep.color }]}
            onPress={handleNextStep}
            disabled={updating}
            activeOpacity={0.7}
          >
            <Feather name={nextStep.icon as any} size={20} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>{nextStep.label}</Text>
            {updating && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>
        )}

        {/* Completed Badge */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <Feather name="check-circle" size={20} color={colors.success} />
            <Text style={styles.completedText}>Item Complete</Text>
          </View>
        )}

        {/* Quick Info */}
        <View style={styles.quickInfoRow}>
          {item.brand && (
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>Brand</Text>
              <Text style={styles.quickInfoValue}>{item.brand}</Text>
            </View>
          )}
          {item.category && (
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>Category</Text>
              <Text style={styles.quickInfoValue}>{item.category}</Text>
            </View>
          )}
          {item.size && (
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>Size</Text>
              <Text style={styles.quickInfoValue}>{item.size}</Text>
            </View>
          )}
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
            <FinancialRow label="Total Cost Basis" value={`$${item.total_cost_basis || 0}`} highlight bold />
            <FinancialRow label="Target List Price" value={`$${item.target_list_price || 0}`} />
            {item.sold_price > 0 && (
              <>
                <View style={styles.cardDivider} />
                <FinancialRow label="Sold Price" value={`$${item.sold_price}`} />
                <FinancialRow label="Fees" value={`-$${item.fees || 0}`} />
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
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Acquired</Text>
                <Text style={styles.timelineValue}>
                  {item.date_acquired ? new Date(item.date_acquired).toLocaleDateString() : '—'}
                </Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: item.date_listed ? colors.success : colors.border }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Listed</Text>
                <Text style={styles.timelineValue}>
                  {item.date_listed ? new Date(item.date_listed).toLocaleDateString() : '—'}
                </Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: item.date_sold ? colors.success : colors.border }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Sold</Text>
                <Text style={styles.timelineValue}>
                  {item.date_sold ? new Date(item.date_sold).toLocaleDateString() : '—'}
                </Text>
              </View>
            </View>
            {item.days_to_sell != null && (
              <View style={styles.timelineSummary}>
                <Text style={styles.timelineSummaryText}>{item.days_to_sell} days to sell</Text>
              </View>
            )}
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

        {/* Secondary Actions */}
        {!isCompleted && (
          <View style={styles.secondaryActions}>
            {['listed', 'crosslisted'].includes(item.status) && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => updateStatus('crosslisted')}
                activeOpacity={0.6}
              >
                <Feather name="copy" size={16} color={colors.textSecondary} />
                <Text style={styles.secondaryBtnText}>Add Platform</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              testID="action-archive"
              style={[styles.secondaryBtn, { backgroundColor: colors.warningLight }]}
              onPress={() => updateStatus('completed')}
              activeOpacity={0.6}
            >
              <Feather name="archive" size={16} color={colors.warning} />
              <Text style={[styles.secondaryBtnText, { color: colors.warning }]}>Archive</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Sold Modal */}
      <SoldModal
        visible={soldModalVisible}
        onClose={() => setSoldModalVisible(false)}
        item={item ? { id: item.id, title: item.title, target_list_price: item.target_list_price, total_cost_basis: item.total_cost_basis } : null}
        onConfirm={handleSoldConfirm}
      />

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </>
  );
}

const finStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
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
    marginBottom: spacing.m,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceHighlight,
  },
  photoEmpty: {
    width: '100%',
    height: 160,
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
    fontSize: 26,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.m,
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

  // Primary Action
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: borderRadius.pill,
    paddingVertical: 16,
    marginBottom: spacing.m,
    ...shadows.medium,
  },
  primaryActionText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Completed Banner
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.l,
    paddingVertical: 14,
    marginBottom: spacing.m,
  },
  completedText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: colors.success,
  },

  // Quick Info
  quickInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.m,
  },
  quickInfoItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...shadows.subtle,
  },
  quickInfoLabel: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  quickInfoValue: {
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
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    paddingVertical: 12,
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
    fontSize: 22,
    letterSpacing: -0.5,
  },

  // Timeline
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: 16,
    ...shadows.subtle,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabel: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  timelineValue: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
  },
  timelineSummary: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.m,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  timelineSummaryText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Notes
  notesText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
    paddingVertical: 8,
  },

  // Secondary Actions
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.m,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.l,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
