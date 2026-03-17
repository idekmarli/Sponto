import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, statusLabels, healthLabels, platformColors } from '../../src/theme';
import { api } from '../../src/api';

const FILTERS = ['All', 'Listed', 'Crosslisted', 'Sourced', 'Sold', 'Completed'];

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const fetchItems = useCallback(async () => {
    try {
      const params: any = {};
      if (filter !== 'All') params.status = filter.toLowerCase();
      const data = await api.getItems(params);
      setItems(data);
    } catch (e) {
      console.error('Items fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const onRefresh = () => { setRefreshing(true); fetchItems(); };

  const renderItem = ({ item }: { item: any }) => {
    const health = healthLabels[item.health] || healthLabels.fresh;
    const costBasis = item.total_cost_basis || 0;
    const displayPrice = item.sold_price > 0 ? item.sold_price : item.target_list_price;

    return (
      <TouchableOpacity
        testID={`inventory-item-${item.id}`}
        style={styles.itemCard}
        onPress={() => router.push(`/item/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.itemPhotoPlaceholder}>
          <Feather name="image" size={20} color={colors.textTertiary} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.itemBrand}>{item.brand}</Text>
          <View style={styles.itemChips}>
            <View style={[styles.healthBadge, { backgroundColor: health.color + '18' }]}>
              <Text style={[styles.healthBadgeText, { color: health.color }]}>{health.label}</Text>
            </View>
            {item.platforms?.slice(0, 2).map((p: string) => (
              <View key={p} style={[styles.platformBadge, { backgroundColor: (platformColors[p] || colors.accent) + '15' }]}>
                <Text style={[styles.platformBadgeText, { color: platformColors[p] || colors.accent }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemPrice}>${displayPrice}</Text>
          <Text style={[styles.itemProfit, { color: item.net_profit >= 0 ? colors.success : colors.warning }]}>
            {item.net_profit >= 0 ? '+' : ''}${item.net_profit}
          </Text>
          {item.days_listed != null && (
            <Text style={styles.itemDays}>{item.days_listed}d</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View testID="inventory-screen" style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>{items.length} items</Text>
        </View>
        <TouchableOpacity testID="add-item-btn" style={styles.addBtn} onPress={() => router.push('/add-item')} activeOpacity={0.7}>
          <Feather name="plus" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        data={FILTERS}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            testID={`filter-${f.toLowerCase()}`}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
      />

      {/* Items List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="archive" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptyText}>Add your first item to start tracking</Text>
          <TouchableOpacity testID="empty-add-btn" style={styles.emptyBtn} onPress={() => router.push('/add-item')} activeOpacity={0.7}>
            <Text style={styles.emptyBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.containerPadding, marginBottom: 12 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  filterList: { maxHeight: 44, marginBottom: 12 },
  filterContent: { paddingHorizontal: spacing.containerPadding, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.textSecondary },
  filterTextActive: { color: colors.surface },
  listContent: { paddingHorizontal: spacing.containerPadding, paddingBottom: 24 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 12,
  },
  itemPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.s,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, gap: 3 },
  itemTitle: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: colors.textPrimary },
  itemBrand: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textSecondary },
  itemChips: { flexDirection: 'row', gap: 4, marginTop: 2, flexWrap: 'wrap' },
  healthBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.pill },
  healthBadgeText: { fontFamily: 'Mulish_600SemiBold', fontSize: 11 },
  platformBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.pill },
  platformBadgeText: { fontFamily: 'Mulish_600SemiBold', fontSize: 10 },
  itemRight: { alignItems: 'flex-end', gap: 2 },
  itemPrice: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.textPrimary },
  itemProfit: { fontFamily: 'SpaceMono_400Regular', fontSize: 13 },
  itemDays: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textTertiary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingBottom: 80 },
  emptyTitle: { fontFamily: 'Mulish_700Bold', fontSize: 20, color: colors.textPrimary },
  emptyText: { fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textSecondary },
  emptyBtn: { marginTop: 8, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: borderRadius.pill },
  emptyBtnText: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: colors.surface },
});
