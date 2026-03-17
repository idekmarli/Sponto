import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../src/theme';
import { api } from '../src/api';

const BUCKETS = [
  { key: '90_plus', label: '90+ days', color: colors.error },
  { key: '60_90', label: '60–90 days', color: '#C4704A' },
  { key: '45_60', label: '45–60 days', color: colors.warning },
  { key: '30_45', label: '30–45 days', color: colors.accent },
];

const ACTION_ICONS: Record<string, string> = {
  'Optimize listing': 'edit-3', 'Crosslist or lower price': 'repeat',
  'Lower price significantly': 'trending-down', 'Archive or bundle': 'archive',
};

export default function DeadStockScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setData(await api.getDeadstock()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalItems = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);

  if (loading) return <View style={[s.container, s.center, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <ScrollView testID="deadstock-screen" style={s.container} contentContainerStyle={[s.content, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.accent} />}>
      <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Feather name="arrow-left" size={20} color={colors.textPrimary} />
      </TouchableOpacity>

      <Text style={s.title}>Dead Stock</Text>
      <Text style={s.subtitle}>{totalItems} items need attention</Text>

      {totalItems === 0 ? (
        <View style={s.emptyState}>
          <View style={s.emptyIcon}><Feather name="check-circle" size={36} color={colors.success} /></View>
          <Text style={s.emptyTitle}>All clear</Text>
          <Text style={s.emptyText}>No stale inventory. Keep it up.</Text>
        </View>
      ) : (
        BUCKETS.map((bucket) => {
          const items = data[bucket.key] || [];
          if (items.length === 0) return null;
          return (
            <View key={bucket.key} testID={`bucket-${bucket.key}`} style={s.bucketSection}>
              <View style={s.bucketHeader}>
                <View style={[s.bucketDot, { backgroundColor: bucket.color }]} />
                <Text style={s.bucketLabel}>{bucket.label}</Text>
                <Text style={[s.bucketCount, { color: bucket.color }]}>{items.length}</Text>
              </View>
              {items.map((item: any) => {
                const potential = (item.target_list_price || 0) - (item.total_cost_basis || 0);
                return (
                  <TouchableOpacity key={item.id} testID={`deadstock-item-${item.id}`} style={s.itemCard} onPress={() => router.push(`/item/${item.id}`)} activeOpacity={0.6}>
                    <View style={s.itemTop}>
                      <View style={s.itemPhoto}><Feather name="camera" size={14} color={colors.textTertiary} /></View>
                      <View style={s.itemInfo}>
                        <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={s.itemDays}>{item.days_listed}d listed</Text>
                      </View>
                      <Text style={[s.itemPotential, { color: potential >= 0 ? colors.success : colors.warning }]}>${potential.toFixed(0)}</Text>
                    </View>
                    {item.suggested_action && (
                      <View style={[s.suggestion, { backgroundColor: bucket.color + '0D' }]}>
                        <Feather name={(ACTION_ICONS[item.suggested_action] || 'info') as any} size={12} color={bucket.color} />
                        <Text style={[s.suggestionText, { color: bucket.color }]}>{item.suggested_action}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.containerPadding },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.textPrimary, letterSpacing: -0.6 },
  subtitle: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textTertiary, marginTop: 2, marginBottom: spacing.sectionGap },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontFamily: 'Mulish_700Bold', fontSize: 20, color: colors.textPrimary },
  emptyText: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary },
  bucketSection: { marginBottom: spacing.l },
  bucketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  bucketDot: { width: 8, height: 8, borderRadius: 4 },
  bucketLabel: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: colors.textPrimary, flex: 1 },
  bucketCount: { fontFamily: 'Mulish_600SemiBold', fontSize: 13 },
  itemCard: { backgroundColor: colors.surface, borderRadius: borderRadius.m, padding: 14, marginBottom: 6, ...shadows.subtle, gap: 10 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemPhoto: { width: 40, height: 40, borderRadius: borderRadius.xs, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, gap: 2 },
  itemTitle: { fontFamily: 'Mulish_700Bold', fontSize: 14, color: colors.textPrimary },
  itemDays: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textSecondary },
  itemPotential: { fontFamily: 'Mulish_700Bold', fontSize: 16, letterSpacing: -0.3 },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: borderRadius.s },
  suggestionText: { fontFamily: 'Mulish_600SemiBold', fontSize: 12 },
});
