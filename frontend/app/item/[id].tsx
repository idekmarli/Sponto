import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, statusLabels, healthLabels, platformColors } from '../../src/theme';
import { api } from '../../src/api';

export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getItem(id).then(setItem).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  const updateStatus = async (status: string) => {
    try {
      const updates: any = { status };
      if (status === 'sold') updates.date_sold = new Date().toISOString();
      if (status === 'listed') updates.date_listed = new Date().toISOString();
      const updated = await api.updateItem(id!, updates);
      setItem(updated);
    } catch (e) {
      console.error('Update error:', e);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Feather name="alert-circle" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Item not found</Text>
      </View>
    );
  }

  const health = healthLabels[item.health] || healthLabels.fresh;
  const costBasis = item.total_cost_basis || 0;

  return (
    <ScrollView
      testID="item-detail-screen"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity testID="edit-item-btn" onPress={() => router.push(`/add-item?edit=${id}`)} style={styles.editBtn}>
          <Feather name="edit-2" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Photo */}
      <View style={styles.photoSection}>
        {item.photos && item.photos.length > 0 ? (
          <View style={styles.photo}>
            <Feather name="image" size={32} color={colors.textTertiary} />
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Feather name="camera" size={32} color={colors.textTertiary} />
            <Text style={styles.photoPlaceholderText}>No photos</Text>
          </View>
        )}
      </View>

      {/* Item Info */}
      <View style={styles.titleSection}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <View style={styles.badges}>
          <View style={[styles.statusBadge, { backgroundColor: health.color + '18' }]}>
            <Text style={[styles.statusBadgeText, { color: health.color }]}>{health.label}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{statusLabels[item.status] || item.status}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Brand</Text>
          <Text style={styles.detailValue}>{item.brand || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailValue}>{item.category || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Size</Text>
          <Text style={styles.detailValue}>{item.size || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Condition</Text>
          <Text style={styles.detailValue}>{item.condition || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Source</Text>
          <Text style={styles.detailValue}>{item.source || '—'}</Text>
        </View>
      </View>

      {/* Platforms */}
      {item.platforms?.length > 0 && (
        <View style={styles.platformSection}>
          <Text style={styles.sectionTitle}>Platforms</Text>
          <View style={styles.platformRow}>
            {item.platforms.map((p: string) => (
              <View key={p} style={[styles.platformChip, { backgroundColor: (platformColors[p] || colors.accent) + '18' }]}>
                <Text style={[styles.platformChipText, { color: platformColors[p] || colors.accent }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Financials */}
      <View style={styles.finSection}>
        <Text style={styles.sectionTitle}>Financials</Text>
        <View style={styles.card}>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Purchase Price</Text>
            <Text style={styles.finValue}>${item.purchase_price || 0}</Text>
          </View>
          <View style={styles.finDivider} />
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Shipping to Acquire</Text>
            <Text style={styles.finValue}>${item.shipping_to_acquire || 0}</Text>
          </View>
          <View style={styles.finDivider} />
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Prep / Repair</Text>
            <Text style={styles.finValue}>${item.prep_cost || 0}</Text>
          </View>
          <View style={styles.finDivider} />
          <View style={[styles.finRow, { backgroundColor: colors.surfaceHighlight, marginHorizontal: -spacing.cardPadding, paddingHorizontal: spacing.cardPadding, paddingVertical: 12 }]}>
            <Text style={[styles.finLabel, { fontFamily: 'Mulish_700Bold' }]}>Total Cost Basis</Text>
            <Text style={[styles.finValue, { fontFamily: 'Mulish_700Bold' }]}>${costBasis}</Text>
          </View>
          <View style={styles.finDivider} />
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Target List Price</Text>
            <Text style={styles.finValue}>${item.target_list_price || 0}</Text>
          </View>
          {item.sold_price > 0 && (
            <>
              <View style={styles.finDivider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Sold Price</Text>
                <Text style={styles.finValue}>${item.sold_price}</Text>
              </View>
              <View style={styles.finDivider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Fees</Text>
                <Text style={styles.finValue}>-${item.fees || 0}</Text>
              </View>
              <View style={styles.finDivider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Packaging</Text>
                <Text style={styles.finValue}>-${item.packaging_cost || 0}</Text>
              </View>
            </>
          )}
          <View style={styles.finDivider} />
          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { fontFamily: 'Mulish_700Bold', fontSize: 16 }]}>Net Profit</Text>
            <Text style={[styles.finValue, { fontFamily: 'Mulish_700Bold', fontSize: 20, color: item.net_profit >= 0 ? colors.success : colors.warning }]}>
              ${item.net_profit}
            </Text>
          </View>
          <View style={styles.finDivider} />
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>ROI</Text>
            <Text style={[styles.finValue, { color: item.roi >= 0 ? colors.success : colors.warning }]}>{item.roi}%</Text>
          </View>
        </View>
      </View>

      {/* Lifecycle */}
      <View style={styles.lifecycleSection}>
        <Text style={styles.sectionTitle}>Lifecycle</Text>
        <View style={styles.card}>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Date Acquired</Text>
            <Text style={styles.finValue}>{item.date_acquired ? new Date(item.date_acquired).toLocaleDateString() : '—'}</Text>
          </View>
          <View style={styles.finDivider} />
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Date Listed</Text>
            <Text style={styles.finValue}>{item.date_listed ? new Date(item.date_listed).toLocaleDateString() : '—'}</Text>
          </View>
          <View style={styles.finDivider} />
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Date Sold</Text>
            <Text style={styles.finValue}>{item.date_sold ? new Date(item.date_sold).toLocaleDateString() : '—'}</Text>
          </View>
          {item.days_listed != null && (
            <>
              <View style={styles.finDivider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Days Listed</Text>
                <Text style={styles.finValue}>{item.days_listed}</Text>
              </View>
            </>
          )}
          {item.days_to_sell != null && (
            <>
              <View style={styles.finDivider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Days to Sell</Text>
                <Text style={styles.finValue}>{item.days_to_sell}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Notes */}
      {item.notes ? (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsGrid}>
          {item.status !== 'listed' && item.status !== 'crosslisted' && item.status !== 'sold' && item.status !== 'shipped' && item.status !== 'completed' && (
            <TouchableOpacity testID="action-mark-listed" style={styles.actionBtn} onPress={() => updateStatus('listed')} activeOpacity={0.7}>
              <Feather name="tag" size={18} color={colors.primary} />
              <Text style={styles.actionBtnText}>Mark Listed</Text>
            </TouchableOpacity>
          )}
          {item.status === 'listed' && (
            <TouchableOpacity testID="action-mark-crosslisted" style={styles.actionBtn} onPress={() => updateStatus('crosslisted')} activeOpacity={0.7}>
              <Feather name="copy" size={18} color={colors.primary} />
              <Text style={styles.actionBtnText}>Crosslisted</Text>
            </TouchableOpacity>
          )}
          {(item.status === 'listed' || item.status === 'crosslisted') && (
            <TouchableOpacity testID="action-mark-sold" style={styles.actionBtn} onPress={() => updateStatus('sold')} activeOpacity={0.7}>
              <Feather name="dollar-sign" size={18} color={colors.success} />
              <Text style={styles.actionBtnText}>Mark Sold</Text>
            </TouchableOpacity>
          )}
          {item.status === 'sold' && (
            <TouchableOpacity testID="action-mark-shipped" style={styles.actionBtn} onPress={() => updateStatus('shipped')} activeOpacity={0.7}>
              <Feather name="truck" size={18} color={colors.primary} />
              <Text style={styles.actionBtnText}>Mark Shipped</Text>
            </TouchableOpacity>
          )}
          {item.status === 'shipped' && (
            <TouchableOpacity testID="action-mark-completed" style={styles.actionBtn} onPress={() => updateStatus('completed')} activeOpacity={0.7}>
              <Feather name="check-circle" size={18} color={colors.success} />
              <Text style={styles.actionBtnText}>Complete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity testID="action-archive" style={[styles.actionBtn, { borderColor: colors.warning }]} onPress={() => updateStatus('completed')} activeOpacity={0.7}>
            <Feather name="archive" size={18} color={colors.warning} />
            <Text style={[styles.actionBtnText, { color: colors.warning }]}>Archive</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.containerPadding },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  photoSection: { marginBottom: spacing.l },
  photo: { width: '100%', height: 220, borderRadius: borderRadius.l, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholder: { width: '100%', height: 220, borderRadius: borderRadius.l, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoPlaceholderText: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textTertiary },
  titleSection: { marginBottom: spacing.l },
  itemTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusBadge: { backgroundColor: colors.surfaceHighlight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: borderRadius.pill },
  statusBadgeText: { fontFamily: 'Mulish_600SemiBold', fontSize: 13, color: colors.textSecondary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  detailLabel: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary },
  detailValue: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.textPrimary },
  platformSection: { marginBottom: spacing.l },
  sectionTitle: { fontFamily: 'Mulish_700Bold', fontSize: 18, color: colors.textPrimary, marginBottom: 12 },
  platformRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  platformChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.pill },
  platformChipText: { fontFamily: 'Mulish_600SemiBold', fontSize: 13 },
  finSection: { marginBottom: spacing.l },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  finLabel: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary },
  finValue: { fontFamily: 'SpaceMono_400Regular', fontSize: 15, color: colors.textPrimary },
  finDivider: { height: 1, backgroundColor: colors.divider },
  lifecycleSection: { marginBottom: spacing.l },
  notesSection: { marginBottom: spacing.l },
  notesText: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textPrimary, lineHeight: 22 },
  actionsSection: { marginBottom: spacing.l },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionBtnText: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.textPrimary },
  emptyText: { fontFamily: 'Mulish_400Regular', fontSize: 16, color: colors.textSecondary, marginTop: 12 },
});
