import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows, healthConfig } from '../../src/theme';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';
import { SoldModal } from '../../src/components/SoldModal';
import { Toast } from '../../src/components/Toast';
import { Badge, EmptyState } from '../../src/components/UI';

const FILTERS = ['All', 'Listed', 'Sourced', 'Sold'];

// Item Card Component - Elegant, scannable design
function ItemCard({ item, onPress, onQuickSold, formatAmount }: { 
  item: any; 
  onPress: () => void; 
  onQuickSold: () => void;
  formatAmount: (n: number) => string;
}) {
  const health = healthConfig[item.health] || healthConfig.fresh;
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
      <View style={styles.photoContainer}>
        {hasPhoto ? (
          <Image source={{ uri: item.photos[0] }} style={styles.photo} />
        ) : (
          <View style={styles.photoEmpty}>
            <Feather name="camera" size={16} color={colors.textTertiary} />
          </View>
        )}
        {/* Health dot indicator */}
        <View style={[styles.healthDot, { backgroundColor: health.color }]} />
      </View>

      {/* Content */}
      <View style={styles.itemContent}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleArea}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.itemMeta}>
              {item.brand}{item.size ? ` · ${item.size}` : ''}
            </Text>
          </View>
          <View style={styles.priceArea}>
            <Text style={styles.price}>{formatAmount(displayPrice)}</Text>
            <Text style={[styles.profit, { color: item.net_profit >= 0 ? colors.success : colors.error }]}>
              {item.net_profit >= 0 ? '+' : ''}{formatAmount(item.net_profit)}
            </Text>
          </View>
        </View>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <Badge 
            label={health.label} 
            variant={item.health === 'fresh' ? 'success' : item.health === 'stale' ? 'warning' : item.health === 'dead_stock' ? 'error' : 'default'}
            size="sm"
          />
          <View style={styles.platforms}>
            {item.platforms?.slice(0, 2).map((p: string) => (
              <Text key={p} style={styles.platformText}>
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
  const { formatAmount } = useCurrency();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  // Modal state
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
    setToast({ visible: true, message: `Sold for ${formatAmount(soldPrice)}!`, type: 'success' });
    fetchItems();
  };

  const renderItem = ({ item }: { item: any }) => (
    <ItemCard 
      item={item} 
      onPress={() => router.push(`/item/${item.id}`)}
      onQuickSold={() => handleQuickSold(item)}
      formatAmount={formatAmount}
    />
  );

  const ListHeader = () => (
    <View style={styles.headerArea}>
      {/* Title Row */}
      <View style={styles.headerRow}>
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
          <Feather name="plus" size={20} color={colors.textInverse} />
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
      <View testID="inventory-screen" style={[styles.container, { paddingTop: insets.top + space[4] }]}>
        <ListHeader />
        <EmptyState 
          icon="archive"
          title="No items yet"
          description="Add your first item to start tracking your inventory"
        />
        <View style={styles.emptyActionContainer}>
          <TouchableOpacity
            testID="empty-add-btn"
            style={styles.emptyAddButton}
            onPress={() => router.push('/quick-add')}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={18} color={colors.textInverse} />
            <Text style={styles.emptyAddText}>Add First Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <View testID="inventory-screen" style={[styles.container, { paddingTop: insets.top + space[4] }]}>
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

      <SoldModal
        visible={soldModalVisible}
        onClose={() => { setSoldModalVisible(false); setSelectedItem(null); }}
        item={selectedItem}
        onConfirm={handleSoldConfirm}
      />

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
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: space[4],
  },

  // Header
  headerArea: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: space[4],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space[5],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: space[1],
  },
  addButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  // Filters
  filterList: {
    marginHorizontal: -spacing.screenPadding,
  },
  filterContent: {
    paddingHorizontal: spacing.screenPadding,
    gap: space[2],
  },
  filterChip: {
    paddingHorizontal: space[4],
    paddingVertical: space[2] + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    ...shadows.xs,
  },
  filterChipActive: {
    backgroundColor: colors.brand,
  },
  filterText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textInverse,
  },

  // List
  listContent: {
    paddingBottom: space[6],
  },
  separator: {
    height: space[3],
  },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.screenPadding,
    borderRadius: radius.lg,
    padding: space[3] + 2,
    gap: space[3],
    ...shadows.sm,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  photoEmpty: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthDot: {
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space[2],
  },
  titleArea: {
    flex: 1,
    marginRight: space[3],
  },
  itemTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: fontSize.md * 1.3,
    marginBottom: 2,
  },
  itemMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  priceArea: {
    alignItems: 'flex-end',
  },
  price: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  profit: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    marginTop: 2,
  },

  // Bottom Row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  platforms: {
    flexDirection: 'row',
    gap: space[1],
    flex: 1,
  },
  platformText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  daysText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
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
  emptyActionContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.brand,
    paddingHorizontal: space[6],
    paddingVertical: space[3] + 2,
    borderRadius: radius.full,
    ...shadows.sm,
  },
  emptyAddText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
});
