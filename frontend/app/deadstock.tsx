import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, platformColors } from '../src/theme';
import { api } from '../src/api';

const BUCKETS = [
  { key: '30_45', label: '30–45 days', urgency: 'low', color: colors.accent },
  { key: '45_60', label: '45–60 days', urgency: 'medium', color: colors.warning },
  { key: '60_90', label: '60–90 days', urgency: 'high', color: '#C4704A' },
  { key: '90_plus', label: '90+ days', urgency: 'critical', color: colors.error },
];

const ACTION_ICONS: Record<string, string> = {
  'Optimize listing': 'edit-3',
  'Crosslist or lower price': 'repeat',
  'Lower price significantly': 'trending-down',
  'Archive or bundle': 'archive',
};

export default function DeadStockScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const d = await api.getDeadstock();
      setData(d);
    } catch (e) {
      console.error('Deadstock fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalItems = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      testID="deadstock-screen"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Dead Stock</Text>
      <Text style={styles.subtitle}>{totalItems} items need attention</Text>

      {totalItems === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="check-circle" size={48} color={colors.success} />
          </View>
          <Text style={styles.emptyTitle}>All clear</Text>
          <Text style={styles.emptyText}>No stale inventory right now. Keep it up!</Text>
        </View>
      ) : (
        BUCKETS.map((bucket) => {
          const items = data[bucket.key] || [];
          if (items.length === 0) return null;
          return (
            <View key={bucket.key} testID={`bucket-${bucket.key}`} style={styles.bucketSection}>
              <View style={styles.bucketHeader}>
                <View style={[styles.bucketDot, { backgroundColor: bucket.color }]} />
                <Text style={styles.bucketLabel}>{bucket.label}</Text>
                <View style={[styles.bucketCount, { backgroundColor: bucket.color + '18' }]}>
                  <Text style={[styles.bucketCountText, { color: bucket.color }]}>{items.length}</Text>
                </View>
              </View>
              {items.map((item: any) => {
                const profitPotential = (item.target_list_price || 0) - (item.total_cost_basis || 0);
                return (
                  <TouchableOpacity
                    key={item.id}
                    testID={`deadstock-item-${item.id}`}
                    style={styles.itemCard}
                    onPress={() => router.push(`/item/${item.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemTop}>
                      <View style={styles.itemPhoto}>
                        <Feather name="image" size={16} color={colors.textTertiary} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.itemDays}>{item.days_listed} days listed</Text>
                      </View>
                    </View>
                    <View style={styles.itemNumbers}>
                      <View style={styles.numItem}>
                        <Text style={styles.numLabel}>Price</Text>
                        <Text style={styles.numValue}>${item.target_list_price || 0}</Text>
                      </View>
                      <View style={styles.numItem}>
                        <Text style={styles.numLabel}>Cost</Text>
                        <Text style={styles.numValue}>${item.total_cost_basis || 0}</Text>
                      </View>
                      <View style={styles.numItem}>
                        <Text style={styles.numLabel}>Potential</Text>
                        <Text style={[styles.numValue, { color: profitPotential >= 0 ? colors.success : colors.warning }]}>
                          ${profitPotential.toFixed(0)}
                        </Text>
                      </View>
                    </View>
                    {item.suggested_action && (
                      <View style={[styles.actionSuggestion, { backgroundColor: bucket.color + '10' }]}>
                        <Feather name={(ACTION_ICONS[item.suggested_action] || 'info') as any} size={14} color={bucket.color} />
                        <Text style={[styles.actionSuggestionText, { color: bucket.color }]}>{item.suggested_action}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.containerPadding },
  header: { marginBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.l },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontFamily: 'Mulish_700Bold', fontSize: 22, color: colors.textPrimary },
  emptyText: { fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  bucketSection: { marginBottom: spacing.l },
  bucketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  bucketDot: { width: 10, height: 10, borderRadius: 5 },
  bucketLabel: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.textPrimary },
  bucketCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.pill },
  bucketCountText: { fontFamily: 'Mulish_600SemiBold', fontSize: 12 },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 10,
  },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemPhoto: { width: 44, height: 44, borderRadius: borderRadius.s, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, gap: 2 },
  itemTitle: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: colors.textPrimary },
  itemDays: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textSecondary },
  itemNumbers: { flexDirection: 'row', gap: 12 },
  numItem: { flex: 1, gap: 2 },
  numLabel: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textTertiary },
  numValue: { fontFamily: 'SpaceMono_400Regular', fontSize: 14, color: colors.textPrimary },
  actionSuggestion: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: borderRadius.m },
  actionSuggestionText: { fontFamily: 'Mulish_600SemiBold', fontSize: 13 },
});
