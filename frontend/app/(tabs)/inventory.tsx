import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, healthLabels } from '../../src/theme';
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
      setItems(await api.getItems(params));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const renderItem = ({ item }: { item: any }) => {
    const health = healthLabels[item.health] || healthLabels.fresh;
    const displayPrice = item.sold_price > 0 ? item.sold_price : item.target_list_price;
    const isSold = item.status === 'sold' || item.status === 'shipped' || item.status === 'completed';

    return (
      <TouchableOpacity
        testID={`inventory-item-${item.id}`}
        style={s.itemCard}
        onPress={() => router.push(`/item/${item.id}`)}
        activeOpacity={0.6}
      >
        {/* Photo */}
        <View style={s.itemPhoto}>
          <Feather name="camera" size={16} color={colors.textTertiary} />
        </View>

        {/* Info */}
        <View style={s.itemBody}>
          <View style={s.itemTopRow}>
            <View style={s.itemTitleArea}>
              <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={s.itemBrand}>{item.brand}{item.size ? ` · ${item.size}` : ''}</Text>
            </View>
            <View style={s.itemPriceArea}>
              <Text style={s.itemPrice}>${displayPrice}</Text>
              <Text style={[s.itemProfit, { color: item.net_profit >= 0 ? colors.profit : colors.loss }]}>
                {item.net_profit >= 0 ? '+' : ''}${item.net_profit}
              </Text>
            </View>
          </View>
          <View style={s.itemBottomRow}>
            <View style={[s.healthDot, { backgroundColor: health.color }]} />
            <Text style={s.healthText}>{health.label}</Text>
            {item.platforms?.slice(0, 3).map((p: string) => (
              <Text key={p} style={s.platformText}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
            ))}
            {item.days_listed != null && item.days_listed > 0 && !isSold && (
              <Text style={s.daysText}>{item.days_listed}d</Text>
            )}
            {item.days_to_sell != null && isSold && (
              <Text style={s.daysText}>{item.days_to_sell}d to sell</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View testID="inventory-screen" style={[s.container, { paddingTop: insets.top + 20 }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Inventory</Text>
          <Text style={s.subtitle}>{items.length} items</Text>
        </View>
        <TouchableOpacity testID="add-item-btn" style={s.addBtn} onPress={() => router.push('/add-item')} activeOpacity={0.6}>
          <Feather name="plus" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        data={FILTERS}
        showsHorizontalScrollIndicator={false}
        style={s.filterList}
        contentContainerStyle={s.filterContent}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            testID={`filter-${f.toLowerCase()}`}
            style={[s.filterChip, filter === f && s.filterActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.6}
          >
            <Text style={[s.filterText, filter === f && s.filterActiveText]}>{f}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
      />

      {/* List */}
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      ) : items.length === 0 ? (
        <View style={s.emptyState}>
          <View style={s.emptyIcon}><Feather name="archive" size={32} color={colors.textTertiary} /></View>
          <Text style={s.emptyTitle}>No items yet</Text>
          <Text style={s.emptyText}>Add your first item to start tracking</Text>
          <TouchableOpacity testID="empty-add-btn" style={s.emptyBtn} onPress={() => router.push('/add-item')} activeOpacity={0.6}>
            <Text style={s.emptyBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor={colors.accent} />}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.containerPadding, marginBottom: 16 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 30, color: colors.textPrimary, letterSpacing: -0.6 },
  subtitle: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textTertiary, marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center' },

  filterList: { maxHeight: 40, marginBottom: 14 },
  filterContent: { paddingHorizontal: spacing.containerPadding, gap: 6 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.pill, backgroundColor: colors.surface },
  filterActive: { backgroundColor: colors.textPrimary },
  filterText: { fontFamily: 'Mulish_600SemiBold', fontSize: 13, color: colors.textSecondary },
  filterActiveText: { color: '#FFFFFF' },

  listContent: { paddingHorizontal: spacing.containerPadding, paddingBottom: 24 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: 14,
    gap: 14,
    ...shadows.subtle,
  },
  itemPhoto: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.s,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1, justifyContent: 'center', gap: 8 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemTitleArea: { flex: 1, marginRight: 12 },
  itemTitle: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: colors.textPrimary, lineHeight: 20 },
  itemBrand: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  itemPriceArea: { alignItems: 'flex-end' },
  itemPrice: { fontFamily: 'Mulish_700Bold', fontSize: 17, color: colors.textPrimary, letterSpacing: -0.3 },
  itemProfit: { fontFamily: 'SpaceMono_400Regular', fontSize: 12, marginTop: 2 },

  itemBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  healthText: { fontFamily: 'Mulish_600SemiBold', fontSize: 11, color: colors.textSecondary, marginRight: 4 },
  platformText: { fontFamily: 'Mulish_400Regular', fontSize: 11, color: colors.textTertiary },
  daysText: { fontFamily: 'Mulish_400Regular', fontSize: 11, color: colors.textTertiary, marginLeft: 'auto' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingBottom: 80 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontFamily: 'Mulish_700Bold', fontSize: 20, color: colors.textPrimary },
  emptyText: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary },
  emptyBtn: { marginTop: 12, backgroundColor: colors.textPrimary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: borderRadius.pill },
  emptyBtnText: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: '#FFFFFF' },
});
