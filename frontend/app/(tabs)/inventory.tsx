import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows, typography, statusConfig, tagConfig, MANUAL_TAGS } from '../../src/theme';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';
import { SoldModal } from '../../src/components/SoldModal';
import { Toast } from '../../src/components/Toast';
import { EmptyState, SkeletonCard } from '../../src/components/UI';
import { DeleteConfirmModal } from '../../src/components/DeleteConfirmModal';

const FILTERS = ['All', 'Listed', 'Sourced', 'Sold'];
const TAG_FILTERS = ['stale', 'dead_stock', 'incomplete', 'needs_cleanup', 'margin_risk'];
const PLATFORM_FILTERS = ['eBay', 'Depop', 'Vinted', 'Poshmark', 'Vestiaire', 'Etsy'];
const MAX_VISIBLE_TAGS = 3;
const HEADER_HEIGHT = 130; // Glass header height

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
function ItemCard({ item, onPress, onLongPress, onQuickSold, formatAmount, currencySymbol, isSelected, selectionMode, avgDaysToSell }: { 
  item: any; 
  onPress: () => void; 
  onLongPress?: () => void;
  onQuickSold: () => void;
  formatAmount: (n: number) => string;
  currencySymbol: string;
  isSelected?: boolean;
  selectionMode?: boolean;
  avgDaysToSell?: number;
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
      style={[styles.itemCard, isSelected && styles.itemCardSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.6}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <View style={[styles.selectionCheckbox, isSelected && styles.selectionCheckboxSelected]}>
          {isSelected && <Feather name="check" size={14} color={colors.textInverse} />}
        </View>
      )}
      
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
              <View style={[
                styles.daysChip,
                avgDaysToSell && item.days_listed > avgDaysToSell * 1.5 
                  ? styles.daysChipDanger 
                  : avgDaysToSell && item.days_listed > avgDaysToSell 
                    ? styles.daysChipWarning 
                    : styles.daysChipNormal
              ]}>
                <Text style={[
                  styles.daysChipText,
                  avgDaysToSell && item.days_listed > avgDaysToSell * 1.5 
                    ? styles.daysChipTextDanger 
                    : avgDaysToSell && item.days_listed > avgDaysToSell 
                      ? styles.daysChipTextWarning 
                      : styles.daysChipTextNormal
                ]}>{item.days_listed}d</Text>
              </View>
            )}
            {isSold && item.days_to_sell != null && (
              <View style={[
                styles.daysChip,
                avgDaysToSell && item.days_to_sell < avgDaysToSell * 0.75 
                  ? styles.daysChipSuccess 
                  : styles.daysChipNormal
              ]}>
                <Text style={[
                  styles.daysChipText,
                  avgDaysToSell && item.days_to_sell < avgDaysToSell * 0.75 
                    ? styles.daysChipTextSuccess 
                    : styles.daysChipTextNormal
                ]}>{item.days_to_sell}d</Text>
              </View>
            )}
            {isListed && (
              <TouchableOpacity
                testID={`quick-sold-${item.id}`}
                style={styles.quickSoldBtn}
                onPress={(e) => { e.stopPropagation(); onQuickSold(); }}
                activeOpacity={0.6}
              >
                <Text style={styles.quickSoldIcon}>{currencySymbol}</Text>
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
  const { formatAmount, currency } = useCurrency();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);

  // Modal state
  const [soldModalVisible, setSoldModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  
  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Average days to sell for color-coding
  const [avgDaysToSell, setAvgDaysToSell] = useState<number>(0);
  
  // Count active filters
  const activeFilterCount = [tagFilter, platformFilter].filter(Boolean).length;

  const fetchItems = useCallback(async () => {
    try {
      const params: any = {};
      if (filter !== 'All') params.status = filter.toLowerCase();
      
      // Fetch items and insights in parallel
      const [allItems, insights] = await Promise.all([
        api.getItems(params),
        api.getInsights()
      ]);
      
      // Set average days to sell for color-coding
      if (insights?.avg_days_to_sell) {
        setAvgDaysToSell(insights.avg_days_to_sell);
      }
      
      // Apply client-side advanced filters
      let filtered = allItems;
      
      if (tagFilter) {
        filtered = filtered.filter((item: any) => 
          item.tags?.includes(tagFilter) || item.derived_tags?.includes(tagFilter)
        );
      }
      
      if (platformFilter) {
        filtered = filtered.filter((item: any) => 
          item.platforms?.some((p: string) => p.toLowerCase() === platformFilter.toLowerCase())
        );
      }
      
      setItems(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, tagFilter, platformFilter]);

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

  // Bulk selection handlers
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
    if (newSelection.size === 0) {
      setSelectionMode(false);
    }
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map(i => i.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleLongPress = (item: any) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set([item.id]));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      const ids = Array.from(selectedIds);
      await api.bulkUpdateItems(ids, { status: newStatus });
      setToast({ visible: true, message: `${ids.length} items updated`, type: 'success' });
      clearSelection();
      fetchItems();
    } catch (e) {
      setToast({ visible: true, message: 'Failed to update items', type: 'error' });
    }
    setShowBulkActions(false);
  };

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await api.bulkDeleteItems(ids);
      setToast({ visible: true, message: `${ids.length} items deleted`, type: 'success' });
      clearSelection();
      fetchItems();
    } catch (e) {
      setToast({ visible: true, message: 'Failed to delete items', type: 'error' });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
    setShowBulkActions(false);
  };

  const renderItem = ({ item }: { item: any }) => (
    <ItemCard 
      item={item} 
      onPress={() => selectionMode ? toggleSelection(item.id) : router.push(`/item/${item.id}`)}
      onLongPress={() => handleLongPress(item)}
      onQuickSold={() => handleQuickSold(item)}
      formatAmount={formatAmount}
      currencySymbol={currency.symbol}
      isSelected={selectedIds.has(item.id)}
      selectionMode={selectionMode}
      avgDaysToSell={avgDaysToSell}
    />
  );

  const ListHeader = () => (
    <View style={styles.headerArea}>
      {/* Title Row */}
      <View style={styles.headerRow}>
        {selectionMode ? (
          <>
            <View style={styles.selectionHeader}>
              <TouchableOpacity onPress={clearSelection} style={styles.cancelSelectionBtn}>
                <Feather name="x" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.selectionCount}>{selectedIds.size} selected</Text>
            </View>
            <TouchableOpacity onPress={selectAll} style={styles.selectAllBtn}>
              <Text style={styles.selectAllText}>Select All</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View>
              <Text style={styles.title}>Inventory</Text>
              <Text style={styles.subtitle}>{items.length} items</Text>
            </View>
            <View style={styles.headerActions}>
              {/* Filter Button */}
              <TouchableOpacity
                style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
                onPress={() => setShowFilters(true)}
                activeOpacity={0.7}
              >
                <Feather name="filter" size={18} color={activeFilterCount > 0 ? colors.brand : colors.textSecondary} />
                {activeFilterCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Add Button */}
              <TouchableOpacity
                testID="add-item-btn"
                style={styles.addButton}
                onPress={() => router.push('/quick-add')}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={20} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Status Filters - hide in selection mode */}
      {!selectionMode && (
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
      )}
      
      {/* Active Advanced Filters - hide in selection mode */}
      {!selectionMode && activeFilterCount > 0 && (
        <View style={styles.activeFiltersRow}>
          {tagFilter && (
            <TouchableOpacity 
              style={styles.activeFilterChip} 
              onPress={() => setTagFilter(null)}
              activeOpacity={0.6}
            >
              <Text style={styles.activeFilterText}>{tagConfig[tagFilter]?.label || tagFilter}</Text>
              <Feather name="x" size={12} color={colors.brand} />
            </TouchableOpacity>
          )}
          {platformFilter && (
            <TouchableOpacity 
              style={styles.activeFilterChip} 
              onPress={() => setPlatformFilter(null)}
              activeOpacity={0.6}
            >
              <Text style={styles.activeFilterText}>{platformFilter}</Text>
              <Feather name="x" size={12} color={colors.brand} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  // Loading State - Skeleton
  if (loading) {
    return (
      <View testID="inventory-screen" style={[styles.container, { paddingTop: insets.top + space[4] }]}>
        <View style={styles.headerArea}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Inventory</Text>
              <Text style={styles.subtitle}>Loading...</Text>
            </View>
          </View>
          <View style={styles.filterRow}>
            {FILTERS.map((f) => (
              <View key={f} style={[styles.filterChip, f === 'All' && styles.filterChipActive]}>
                <Text style={[styles.filterText, f === 'All' && styles.filterTextActive]}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.skeletonList}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <SkeletonCard />
            </View>
          ))}
        </View>
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
          contentContainerStyle={[styles.listContent, selectionMode && { paddingBottom: 120 }]}
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

      {/* Advanced Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.modalCloseBtn}>
              <Feather name="x" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity 
              onPress={() => { setTagFilter(null); setPlatformFilter(null); }}
              style={styles.modalClearBtn}
            >
              <Text style={styles.modalClearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Tag Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>By Tag</Text>
              <View style={styles.filterChipsWrap}>
                {TAG_FILTERS.map((t) => {
                  const config = tagConfig[t];
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.modalFilterChip, 
                        tagFilter === t && { backgroundColor: config?.bg || colors.surfaceMuted, borderColor: config?.color || colors.brand }
                      ]}
                      onPress={() => setTagFilter(tagFilter === t ? null : t)}
                      activeOpacity={0.6}
                    >
                      <Text style={[
                        styles.modalFilterChipText,
                        tagFilter === t && { color: config?.color || colors.brand }
                      ]}>
                        {config?.label || t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Platform Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>By Platform</Text>
              <View style={styles.filterChipsWrap}>
                {PLATFORM_FILTERS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.modalFilterChip, 
                      platformFilter === p && styles.modalFilterChipActive
                    ]}
                    onPress={() => setPlatformFilter(platformFilter === p ? null : p)}
                    activeOpacity={0.6}
                  >
                    <Text style={[
                      styles.modalFilterChipText,
                      platformFilter === p && styles.modalFilterChipTextActive
                    ]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={styles.modalApplyBtn}
            onPress={() => setShowFilters(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.modalApplyText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Bulk Action Bar */}
      {selectionMode && selectedIds.size > 0 && (
        <View style={styles.bulkActionBar}>
          <View style={styles.bulkActionButtons}>
            <TouchableOpacity 
              style={styles.bulkActionBtn}
              onPress={() => setShowBulkActions(true)}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={18} color={colors.textPrimary} />
              <Text style={styles.bulkActionBtnText}>Status</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bulkActionBtn, styles.bulkActionBtnDanger]}
              onPress={() => setShowDeleteConfirm(true)}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={18} color={colors.error} />
              <Text style={[styles.bulkActionBtnText, styles.bulkActionBtnTextDanger]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bulk Status Change Modal */}
      <Modal
        visible={showBulkActions}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowBulkActions(false)}
      >
        <View style={styles.bulkStatusModal}>
          <View style={styles.bulkStatusContent}>
            <View style={styles.bulkStatusHeader}>
              <Text style={styles.bulkStatusTitle}>Change Status</Text>
              <TouchableOpacity onPress={() => setShowBulkActions(false)}>
                <Feather name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.bulkStatusOptions}>
              {['sourced', 'listed', 'crosslisted', 'sold', 'shipped', 'completed'].map((status) => {
                const cfg = statusConfig[status];
                return (
                  <TouchableOpacity
                    key={status}
                    style={styles.bulkStatusOption}
                    onPress={() => handleBulkStatusChange(status)}
                    activeOpacity={0.7}
                  >
                    <View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: cfg?.color || colors.brand }]} />
                    <Text style={styles.bulkStatusOptionText}>{cfg?.label || status}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={selectedIds.size > 1 ? `Delete ${selectedIds.size} Items` : 'Delete Item'}
        itemCount={selectedIds.size}
        loading={deleteLoading}
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
  skeletonList: {
    paddingHorizontal: spacing.screenPadding,
    gap: space[3],
  },
  skeletonItem: {
    marginBottom: space[3],
  },

  // Liquid Glass Header
  headerArea: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: space[4],
    paddingTop: space[2],
    paddingBottom: space[3],
    marginHorizontal: -spacing.screenPadding,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space[4],
    paddingHorizontal: spacing.screenPadding,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: colors.textInverse,
  },

  // Liquid Glass Filters
  filterRow: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: spacing.screenPadding,
  },
  filterChip: {
    paddingHorizontal: space[4],
    paddingVertical: space[2] + 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
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
  // Days chip styles for color-coded display
  daysChip: {
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  daysChipNormal: {
    backgroundColor: colors.surfaceMuted,
  },
  daysChipWarning: {
    backgroundColor: colors.warningLight,
  },
  daysChipDanger: {
    backgroundColor: colors.errorLight,
  },
  daysChipSuccess: {
    backgroundColor: colors.successLight,
  },
  daysChipText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
  },
  daysChipTextNormal: {
    color: colors.textTertiary,
  },
  daysChipTextWarning: {
    color: colors.warning,
  },
  daysChipTextDanger: {
    color: colors.error,
  },
  daysChipTextSuccess: {
    color: colors.success,
  },
  quickSoldBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSoldIcon: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.success,
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

  // Active Filters Row
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginTop: space[3],
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[3],
    paddingVertical: space[1] + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  activeFilterText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.brand,
  },

  // Filter Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: space[4],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  modalClearBtn: {
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  modalClearText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.brand,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  filterSection: {
    marginTop: space[6],
  },
  filterSectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: space[3],
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
  modalFilterChip: {
    paddingHorizontal: space[4],
    paddingVertical: space[2] + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalFilterChipActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.brand,
  },
  modalFilterChipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  modalFilterChipTextActive: {
    color: colors.brand,
  },
  modalApplyBtn: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: space[8],
    marginTop: space[4],
    backgroundColor: colors.brand,
    height: spacing.buttonHeight,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  modalApplyText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },

  // Selection Mode Styles
  itemCardSelected: {
    borderWidth: 2,
    borderColor: colors.brand,
  },
  selectionCheckbox: {
    position: 'absolute',
    top: space[2],
    left: space[2],
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  selectionCheckboxSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  cancelSelectionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCount: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  selectAllBtn: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  selectAllText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.brand,
  },

  // Bulk Action Bar
  bulkActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: space[3],
    paddingBottom: space[8],
    ...shadows.lg,
  },
  bulkActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: space[2],
  },
  bulkActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[3],
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  bulkActionBtnDanger: {
    backgroundColor: colors.errorLight,
  },
  bulkActionBtnText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.textPrimary,
    marginTop: space[1],
  },
  bulkActionBtnTextDanger: {
    color: colors.error,
  },

  // Bulk Status Modal
  bulkStatusModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bulkStatusContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space[4],
    paddingBottom: space[8],
    paddingHorizontal: spacing.screenPadding,
  },
  bulkStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[4],
  },
  bulkStatusTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  bulkStatusOptions: {
    gap: space[2],
  },
  bulkStatusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  bulkStatusOptionText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
});
