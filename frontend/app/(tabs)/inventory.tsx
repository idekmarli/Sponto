import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows, typography, statusConfig, tagConfig, MANUAL_TAGS } from '../../src/theme';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';
import { SoldModal } from '../../src/components/SoldModal';
import { Toast } from '../../src/components/Toast';
import { EmptyState } from '../../src/components/UI';

const FILTERS = ['All', 'Listed', 'Sourced', 'Sold'];
const MAX_VISIBLE_TAGS = 3;

// Tag Chip Component - Small, subtle
function TagChip({ tagKey, isDerived = false }: { tagKey: string; isDerived?: boolean }) {
  const config = tagConfig[tagKey];
  if (!config) return null;
  
  return (
    <View style={[styles.tagChip, { backgroundColor: config.bg }]}>
      <Text style={[styles.tagText, { color: config.color }, isDerived && styles.tagTextDerived]}>
        {config.label}
      </Text>
    </View>
  );
}

// Item Card Component - Photo-first, scannable
function ItemCard({ item, onPress, onQuickSold, formatAmount }: { 
  item: any; 
  onPress: () => void; 
  onQuickSold: () => void;
  formatAmount: (n: number) => string;
}) {
  const statusCfg = statusConfig[item.status] || statusConfig.sourced;
  const displayPrice = item.sold_price > 0 ? item.sold_price : item.target_list_price;
  const isSold = ['sold', 'shipped', 'completed'].includes(item.status);
  const isListed = ['listed', 'crosslisted'].includes(item.status);
  const hasPhoto = item.photos?.length > 0;
  
  // Combine manual tags + derived tags for display
  const manualTags = item.tags || [];
  const derivedTags = item.derived_tags || [];
  const allTags = [...manualTags, ...derivedTags];
  const visibleTags = allTags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = allTags.length - MAX_VISIBLE_TAGS;

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
            <Feather name="camera" size={20} color={colors.textMuted} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.itemContent}>
        {/* Title row with status */}
        <View style={styles.titleRow}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Meta */}
        <Text style={styles.itemMeta}>
          {item.brand}{item.size ? ` · ${item.size}` : ''}{item.category ? ` · ${item.category}` : ''}
        </Text>

        {/* Tags Row */}
        {allTags.length > 0 && (
          <View style={styles.tagsRow}>
            {visibleTags.map((tag) => (
              <TagChip 
                key={tag} 
                tagKey={tag} 
                isDerived={derivedTags.includes(tag)}
              />
            ))}
            {overflowCount > 0 && (
              <View style={styles.tagOverflow}>
                <Text style={styles.tagOverflowText}>+{overflowCount}</Text>
              </View>
            )}
          </View>
        )}

        {/* Price Row */}
        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            <Text style={styles.price}>{formatAmount(displayPrice)}</Text>
            <Text style={[styles.profit, { color: item.net_profit >= 0 ? colors.success : colors.error }]}>
              {item.net_profit >= 0 ? '+' : ''}{formatAmount(item.net_profit)}
            </Text>
          </View>
          <View style={styles.priceRight}>
            {!isSold && item.days_listed != null && item.days_listed > 0 && (
              <Text style={styles.daysText}>{item.days_listed}d</Text>
            )}
            {isSold && item.days_to_sell != null && (
              <Text style={styles.daysText}>{item.days_to_sell}d</Text>
            )}
            {isListed && (
              <TouchableOpacity
                testID={`quick-sold-${item.id}`}
                style={styles.quickSoldBtn}
                onPress={(e) => { e.stopPropagation(); onQuickSold(); }}
                activeOpacity={0.6}
              >
                <Feather name="dollar-sign" size={14} color={colors.success} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            testID={`filter-${f.toLowerCase()}`}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.6}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: space[4],
  },

  // Header
  headerArea: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: space[5],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space[6],
  },
  title: {
    ...typography.h1,
    marginBottom: space[1],
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textTertiary,
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
  filterRow: {
    flexDirection: 'row',
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
    paddingBottom: space[8],
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
    overflow: 'hidden',
    ...shadows.card,
  },
  photoContainer: {
    width: 100,
  },
  photo: {
    width: 100,
    height: '100%',
    minHeight: 120,
    backgroundColor: colors.surfaceMuted,
  },
  photoEmpty: {
    width: 100,
    height: '100%',
    minHeight: 120,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Item Content
  itemContent: {
    flex: 1,
    padding: space[3] + 2,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space[2],
    marginBottom: space[1],
  },
  itemTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: fontSize.md * 1.3,
  },
  statusBadge: {
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
  },
  statusText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
  },
  itemMeta: {
    ...typography.caption,
    marginBottom: space[2],
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1],
    marginBottom: space[2],
  },
  tagChip: {
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  tagText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize['2xs'],
    letterSpacing: 0.2,
  },
  tagTextDerived: {
    fontStyle: 'italic',
  },
  tagOverflow: {
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceMuted,
  },
  tagOverflowText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize['2xs'],
    color: colors.textTertiary,
  },

  // Price Row
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceLeft: {
    gap: 2,
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
  },
  priceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  daysText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  quickSoldBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
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
