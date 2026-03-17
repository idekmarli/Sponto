import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, healthLabels } from '../../src/theme';
import { api } from '../../src/api';
import { SoldModal } from '../../src/components/SoldModal';
import { Toast } from '../../src/components/Toast';

const FILTERS = ['All', 'Listed', 'Sourced', 'Sold'];

// Item Card Component
function ItemCard({ item, onPress, onQuickSold }: { item: any; onPress: () => void; onQuickSold: () => void }) {
  const health = healthLabels[item.health] || healthLabels.fresh;
  const displayPrice = item.sold_price > 0 ? item.sold_price : item.target_list_price;
  const isSold = ['sold', 'shipped', 'completed'].includes(item.status);
  const isListed = ['listed', 'crosslisted'].includes(item.status);
  const hasPhoto = item.photos?.length > 0;

  return (
    <TouchableOpacity
      testID={`inventory-item-${item.id}`}
      style={styles.itemCard}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {/* Photo */}
      <View style={styles.itemPhotoWrap}>
        {hasPhoto ? (
          <Image source={{ uri: item.photos[0] }} style={styles.itemPhoto} />
        ) : (
          <View style={styles.itemPhotoEmpty}>
            <Feather name="camera" size={16} color={colors.textMuted} />
          </View>
        )}
        {/* Health Indicator */}
        <View style={[styles.healthIndicator, { backgroundColor: health.color }]} />
      </View>

      {/* Content */}
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleArea}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.itemMeta}>
              {item.brand}
              {item.size ? ` · ${item.size}` : ''}
            </Text>
          </View>
          <View style={styles.itemPriceArea}>
            <Text style={styles.itemPrice}>${displayPrice}</Text>
            <Text style={[styles.itemProfit, { color: item.net_profit >= 0 ? colors.profit : colors.loss }]}>
              {item.net_profit >= 0 ? '+' : ''}${item.net_profit}
            </Text>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <View style={[styles.healthBadge, { backgroundColor: health.bg }]}>
            <Text style={[styles.healthBadgeText, { color: health.color }]}>{health.label}</Text>
          </View>
          <View style={styles.itemTags}>
            {item.platforms?.slice(0, 2).map((p: string) => (
              <Text key={p} style={styles.platformTag}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            ))}
          </View>
          {!isSold && item.days_listed != null && item.days_listed > 0 && (
            <Text style={styles.daysText}>{item.days_listed}d</Text>
          )}
          {isSold && item.days_to_sell != null && (
            <Text style={styles.daysText}>{item.days_to_sell}d to sell</Text>
          )}
        </View>
      </View>

      {/* Quick Sold Button */}
      {isListed && (
        <TouchableOpacity
          testID={`quick-sold-${item.id}`}
          style={styles.quickSoldBtn}
          onPress={(e) => { e.stopPropagation(); onQuickSold(); }}
          activeOpacity={0.6}
        >
          <Feather name="dollar-sign" size={16} color={colors.success} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  // Sold Modal State
  const [soldModalVisible, setSoldModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  const fetchItems = useCallback(async () => {
    try {
      const params: any = {};
      if (filter !== 'All') params.status = filter.toLowerCase();
      setItems(await api.getItems(params));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleQuickSold = (item: any) => {
    setSelectedItem(item);
    setSoldModalVisible(true);
  };

  const handleSoldConfirm = async (soldPrice: number) => {
    if (!selectedItem) return;
    await api.updateItem(selectedItem.id, {
      status: 'sold',
      sold_price: soldPrice,
      date_sold: new Date().toISOString(),
    });
    setToast({ visible: true, message: `Sold for $${soldPrice}! 🎉`, type: 'success' });
    fetchItems();
  };

  const renderItem = ({ item }: { item: any }) => (
    <ItemCard 
      item={item} 
      onPress={() => router.push(`/item/${item.id}`)}
      onQuickSold={() => handleQuickSold(item)}
    />
  );

  const ListHeader = () => (
    <View style={styles.headerArea}>
      {/* Title Row */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>{items.length} items</Text>
        </View>
        <TouchableOpacity
          testID="add-item-btn"
          style={styles.addButton}
          onPress={() => router.push('/quick-add')}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
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
            activeOpacity={0.6}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
      />
    </View>
  );

  // Loading State
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  // Empty State
  if (items.length === 0) {
    return (
      <View testID="inventory-screen" style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <ListHeader />
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="archive" size={28} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptyText}>Add your first item to start tracking your inventory</Text>
          <TouchableOpacity
            testID="empty-add-btn"
            style={styles.emptyButton}
            onPress={() => router.push('/quick-add')}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Add First Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <View testID="inventory-screen" style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchItems(); }}
              tintColor={colors.accent}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>

      {/* Sold Modal */}
      <SoldModal
        visible={soldModalVisible}
        onClose={() => { setSoldModalVisible(false); setSelectedItem(null); }}
        item={selectedItem}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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

  // Header Area
  headerArea: {
    paddingHorizontal: spacing.containerPadding,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },

  // Filters
  filterList: {
    marginHorizontal: -spacing.containerPadding,
  },
  filterContent: {
    paddingHorizontal: spacing.containerPadding,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  filterChipActive: {
    backgroundColor: colors.textPrimary,
  },
  filterText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // List
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 10,
  },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.containerPadding,
    borderRadius: borderRadius.l,
    padding: 14,
    gap: 14,
    ...shadows.card,
  },
  itemPhotoWrap: {
    position: 'relative',
  },
  itemPhoto: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.m,
    backgroundColor: colors.surfaceHighlight,
  },
  itemPhotoEmpty: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.m,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },

  // Item Content
  itemContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitleArea: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 2,
  },
  itemMeta: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  itemPriceArea: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  itemProfit: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 12,
    marginTop: 2,
  },

  // Item Footer
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.s,
  },
  healthBadgeText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 11,
  },
  itemTags: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  platformTag: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  daysText: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 12,
    color: colors.textTertiary,
  },

  // Quick Sold Button
  quickSoldBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.containerPadding,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 280,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: borderRadius.pill,
    ...shadows.card,
  },
  emptyButtonText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
