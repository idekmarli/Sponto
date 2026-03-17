import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, statusLabels, healthLabels } from '../../src/theme';
import { api } from '../../src/api';

function FinRow({ label, value, bold = false, highlight = false }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <View style={[fin.row, highlight && fin.rowHighlight]}>
      <Text style={[fin.label, bold && { fontFamily: 'Mulish_700Bold' }]}>{label}</Text>
      <Text style={[fin.value, bold && { fontFamily: 'Mulish_700Bold', fontSize: 16 }]}>{value}</Text>
    </View>
  );
}

export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) api.getItem(id).then(setItem).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    try {
      const updates: any = { status };
      if (status === 'sold') updates.date_sold = new Date().toISOString();
      if (status === 'listed') updates.date_listed = new Date().toISOString();
      setItem(await api.updateItem(id!, updates));
    } catch (e) { console.error(e); }
  };

  if (loading) return <View style={[s.container, s.center, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={colors.accent} /></View>;

  if (!item) return (
    <View style={[s.container, s.center, { paddingTop: insets.top }]}>
      <Feather name="alert-circle" size={32} color={colors.textTertiary} />
      <Text style={s.emptyText}>Item not found</Text>
    </View>
  );

  const health = healthLabels[item.health] || healthLabels.fresh;

  return (
    <ScrollView testID="item-detail-screen" style={s.container} contentContainerStyle={[s.content, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={s.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity testID="edit-item-btn" onPress={() => router.push(`/add-item?edit=${id}`)} style={s.navBtn}>
          <Feather name="edit-2" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Photo */}
      <View style={s.photo}><Feather name="camera" size={28} color={colors.textTertiary} /><Text style={s.photoText}>No photos</Text></View>

      {/* Title & Badges */}
      <Text style={s.itemTitle}>{item.title}</Text>
      <View style={s.badges}>
        <View style={[s.badge, { backgroundColor: health.color + '15' }]}><View style={[s.badgeDot, { backgroundColor: health.color }]} /><Text style={[s.badgeText, { color: health.color }]}>{health.label}</Text></View>
        <View style={s.badge}><Text style={s.badgeText}>{statusLabels[item.status] || item.status}</Text></View>
      </View>

      {/* Info */}
      <View style={s.infoCard}>
        {[
          { l: 'Brand', v: item.brand }, { l: 'Category', v: item.category }, { l: 'Size', v: item.size },
          { l: 'Condition', v: item.condition }, { l: 'Source', v: item.source },
        ].map((r, i) => r.v ? (
          <View key={i} style={[s.infoRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }]}>
            <Text style={s.infoLabel}>{r.l}</Text><Text style={s.infoValue}>{r.v}</Text>
          </View>
        ) : null)}
      </View>

      {/* Platforms */}
      {item.platforms?.length > 0 && (
        <View style={s.platforms}>
          {item.platforms.map((p: string) => (<View key={p} style={s.platChip}><Text style={s.platText}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text></View>))}
        </View>
      )}

      {/* Financials */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Financials</Text>
        <View style={s.card}>
          <FinRow label="Purchase Price" value={`$${item.purchase_price || 0}`} />
          <FinRow label="Shipping to Acquire" value={`$${item.shipping_to_acquire || 0}`} />
          <FinRow label="Prep / Repair" value={`$${item.prep_cost || 0}`} />
          <FinRow label="Total Cost Basis" value={`$${item.total_cost_basis || 0}`} bold highlight />
          <FinRow label="Target List Price" value={`$${item.target_list_price || 0}`} />
          {item.sold_price > 0 && <>
            <FinRow label="Sold Price" value={`$${item.sold_price}`} />
            <FinRow label="Fees" value={`-$${item.fees || 0}`} />
            <FinRow label="Packaging" value={`-$${item.packaging_cost || 0}`} />
          </>}
          <View style={fin.profitRow}>
            <Text style={fin.profitLabel}>Net Profit</Text>
            <Text style={[fin.profitValue, { color: item.net_profit >= 0 ? colors.success : colors.warning }]}>${item.net_profit}</Text>
          </View>
          <FinRow label="ROI" value={`${item.roi}%`} />
        </View>
      </View>

      {/* Lifecycle */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Lifecycle</Text>
        <View style={s.card}>
          <FinRow label="Acquired" value={item.date_acquired ? new Date(item.date_acquired).toLocaleDateString() : '—'} />
          <FinRow label="Listed" value={item.date_listed ? new Date(item.date_listed).toLocaleDateString() : '—'} />
          <FinRow label="Sold" value={item.date_sold ? new Date(item.date_sold).toLocaleDateString() : '—'} />
          {item.days_listed != null && <FinRow label="Days Listed" value={`${item.days_listed}`} />}
          {item.days_to_sell != null && <FinRow label="Days to Sell" value={`${item.days_to_sell}`} />}
        </View>
      </View>

      {/* Notes */}
      {item.notes ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Notes</Text>
          <View style={s.card}><Text style={s.notesText}>{item.notes}</Text></View>
        </View>
      ) : null}

      {/* Actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Actions</Text>
        <View style={s.actionsRow}>
          {!['listed', 'crosslisted', 'sold', 'shipped', 'completed'].includes(item.status) && (
            <TouchableOpacity testID="action-mark-listed" style={s.actionBtn} onPress={() => updateStatus('listed')} activeOpacity={0.6}>
              <Feather name="tag" size={16} color={colors.textPrimary} /><Text style={s.actionText}>Mark Listed</Text>
            </TouchableOpacity>
          )}
          {item.status === 'listed' && (
            <TouchableOpacity testID="action-mark-crosslisted" style={s.actionBtn} onPress={() => updateStatus('crosslisted')} activeOpacity={0.6}>
              <Feather name="copy" size={16} color={colors.textPrimary} /><Text style={s.actionText}>Crosslisted</Text>
            </TouchableOpacity>
          )}
          {['listed', 'crosslisted'].includes(item.status) && (
            <TouchableOpacity testID="action-mark-sold" style={s.actionBtn} onPress={() => updateStatus('sold')} activeOpacity={0.6}>
              <Feather name="dollar-sign" size={16} color={colors.success} /><Text style={s.actionText}>Mark Sold</Text>
            </TouchableOpacity>
          )}
          {item.status === 'sold' && (
            <TouchableOpacity testID="action-mark-shipped" style={s.actionBtn} onPress={() => updateStatus('shipped')} activeOpacity={0.6}>
              <Feather name="truck" size={16} color={colors.textPrimary} /><Text style={s.actionText}>Shipped</Text>
            </TouchableOpacity>
          )}
          {item.status === 'shipped' && (
            <TouchableOpacity testID="action-mark-completed" style={s.actionBtn} onPress={() => updateStatus('completed')} activeOpacity={0.6}>
              <Feather name="check-circle" size={16} color={colors.success} /><Text style={s.actionText}>Complete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity testID="action-archive" style={[s.actionBtn, { borderColor: colors.warning + '40' }]} onPress={() => updateStatus('completed')} activeOpacity={0.6}>
            <Feather name="archive" size={16} color={colors.warning} /><Text style={[s.actionText, { color: colors.warning }]}>Archive</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const fin = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  rowHighlight: { backgroundColor: colors.surfaceHighlight, marginHorizontal: -18, paddingHorizontal: 18, borderRadius: borderRadius.s },
  label: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary },
  value: { fontFamily: 'SpaceMono_400Regular', fontSize: 14, color: colors.textPrimary },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, marginTop: 4 },
  profitLabel: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: colors.textPrimary },
  profitValue: { fontFamily: 'Mulish_700Bold', fontSize: 22, letterSpacing: -0.5 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.containerPadding },
  nav: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: 200, borderRadius: borderRadius.l, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: spacing.l },
  photoText: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textTertiary },
  itemTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.textPrimary, letterSpacing: -0.6, lineHeight: 34, marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: spacing.l },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceHighlight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.pill },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: 'Mulish_600SemiBold', fontSize: 12, color: colors.textSecondary },
  infoCard: { backgroundColor: colors.surface, borderRadius: borderRadius.l, paddingHorizontal: 18, ...shadows.subtle, marginBottom: spacing.l },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  infoLabel: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary },
  infoValue: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.textPrimary },
  platforms: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: spacing.l },
  platChip: { backgroundColor: colors.surfaceHighlight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.pill },
  platText: { fontFamily: 'Mulish_600SemiBold', fontSize: 13, color: colors.textSecondary },
  section: { marginBottom: spacing.l },
  sectionTitle: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.textPrimary, letterSpacing: -0.2, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.l, paddingHorizontal: 18, paddingVertical: 4, ...shadows.subtle },
  notesText: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textPrimary, lineHeight: 22, paddingVertical: 12 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: borderRadius.pill, backgroundColor: colors.surface, ...shadows.subtle },
  actionText: { fontFamily: 'Mulish_600SemiBold', fontSize: 13, color: colors.textPrimary },
  emptyText: { fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textSecondary, marginTop: 12 },
});
