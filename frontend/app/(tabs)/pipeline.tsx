import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows, statusConfig } from '../../src/theme';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';
import { EmptyState } from '../../src/components/UI';
import { Toast } from '../../src/components/Toast';

// Pipeline Stage Colors — Distinct, vibrant palette
const pipelineColors = {
  sourced: '#6366F1',     // Indigo - new acquisition
  intake: '#8B5CF6',      // Purple - processing
  photographed: '#F43F5E', // Rose/Red - creative/photos
  listed: '#F59E0B',      // Amber - live/active
  crosslisted: '#06B6D4', // Cyan - multi-platform
  sold: '#22C55E',        // Bright Green - success/money
  shipped: '#3B82F6',     // Blue - in transit
  completed: '#16A34A',   // Vibrant Green - done
};

const STAGES = [
  { key: 'sourced', icon: 'shopping-bag', color: pipelineColors.sourced },
  { key: 'intake', icon: 'inbox', color: pipelineColors.intake },
  { key: 'photographed', icon: 'camera', color: pipelineColors.photographed },
  { key: 'listed', icon: 'tag', color: pipelineColors.listed },
  { key: 'crosslisted', icon: 'copy', color: pipelineColors.crosslisted },
  { key: 'sold', icon: 'check', color: pipelineColors.sold },
  { key: 'shipped', icon: 'truck', color: pipelineColors.shipped },
  { key: 'completed', icon: 'check-circle', color: pipelineColors.completed },
];

// Pipeline Item Card - Enhanced with price, profit, and photo
function PipelineCard({ item, onPress, onLongPress, onAdvance, currentStage }: { 
  item: any; 
  onPress: () => void;
  onLongPress: () => void;
  onAdvance: () => void;
  currentStage: string;
}) {
  const { formatAmount } = useCurrency();
  const daysInfo = item.days_listed ?? item.days_in_inventory;
  const hasPhoto = item.photos && item.photos.length > 0 && item.photos[0];
  const price = item.listed_price || item.target_list_price || item.purchase_price;
  const profit = item.profit || (item.listed_price && item.purchase_price ? item.listed_price - item.purchase_price : 0);
  const isStale = daysInfo > 30;
  
  // Get next stage
  const currentIndex = STAGES.findIndex(s => s.key === currentStage);
  const nextStage = currentIndex < STAGES.length - 1 ? STAGES[currentIndex + 1] : null;
  const isCompleted = currentStage === 'completed';
  
  return (
    <TouchableOpacity
      testID={`pipeline-item-${item.id}`}
      style={styles.pipeCard}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.6}
    >
      {/* Photo */}
      <View style={styles.pipePhoto}>
        {hasPhoto ? (
          <Image source={{ uri: item.photos[0] }} style={styles.pipePhotoImage} />
        ) : (
          <Feather name="camera" size={16} color={colors.textMuted} />
        )}
        {/* Days badge overlay */}
        {daysInfo != null && daysInfo > 0 && (
          <View style={[styles.pipeDaysBadge, isStale && styles.pipeDaysBadgeStale]}>
            <Text style={[styles.pipeDaysText, isStale && styles.pipeDaysTextStale]}>{daysInfo}d</Text>
          </View>
        )}
      </View>
      
      {/* Content */}
      <Text style={styles.pipeTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.pipeBrand} numberOfLines={1}>{item.brand || 'No brand'}</Text>
      
      {/* Price & Profit Row */}
      {price > 0 && (
        <View style={styles.pipePriceRow}>
          <Text style={styles.pipePrice}>{formatAmount(price)}</Text>
          {profit > 0 && (
            <Text style={styles.pipeProfit}>+{formatAmount(profit)}</Text>
          )}
        </View>
      )}
      
      {/* Platform badges + Advance button */}
      <View style={styles.pipeBottomRow}>
        {item.platforms?.length > 0 && (
          <View style={styles.pipePlatforms}>
            {item.platforms.slice(0, 2).map((p: string, i: number) => (
              <View key={p} style={styles.pipePlatformBadge}>
                <Text style={styles.pipePlatformText}>{p.charAt(0).toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Advance button */}
        {nextStage && !isCompleted && (
          <TouchableOpacity
            style={[styles.pipeAdvanceBtn, { backgroundColor: nextStage.color + '20', borderColor: nextStage.color }]}
            onPress={(e) => { e.stopPropagation(); onAdvance(); }}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-right" size={12} color={nextStage.color} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function PipelineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  
  // Quick Move Modal state
  const [quickMoveItem, setQuickMoveItem] = useState<any | null>(null);
  const [quickMoveStage, setQuickMoveStage] = useState<string>('');
  const [moving, setMoving] = useState(false);

  const fetchPipeline = useCallback(async () => {
    try {
      const data = await api.getPipeline();
      // API returns { stage: { items: [], count: N, ... } } - extract items array
      const normalized: Record<string, any[]> = {};
      for (const key of Object.keys(data)) {
        normalized[key] = data[key]?.items || [];
      }
      setPipeline(normalized);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Advance item to next stage
  const advanceItem = async (item: any, currentStage: string) => {
    const currentIndex = STAGES.findIndex(s => s.key === currentStage);
    if (currentIndex >= STAGES.length - 1) return;
    
    const nextStage = STAGES[currentIndex + 1].key;
    
    try {
      await api.updateItem(item.id, { status: nextStage });
      setToast({ visible: true, message: `Moved to ${nextStage}`, type: 'success' });
      fetchPipeline(); // Refresh
    } catch (e) {
      console.error(e);
      setToast({ visible: true, message: 'Failed to update', type: 'error' });
    }
  };

  // Quick move to any stage
  const quickMoveToStage = async (newStage: string) => {
    if (!quickMoveItem || moving) return;
    setMoving(true);
    
    try {
      await api.updateItem(quickMoveItem.id, { status: newStage });
      const stageLabel = STAGES.find(s => s.key === newStage)?.key || newStage;
      setToast({ visible: true, message: `Moved to ${stageLabel}`, type: 'success' });
      setQuickMoveItem(null);
      fetchPipeline();
    } catch (e) {
      console.error(e);
      setToast({ visible: true, message: 'Failed to move item', type: 'error' });
    } finally {
      setMoving(false);
    }
  };

  // Open Quick Move Modal
  const openQuickMove = (item: any, currentStage: string) => {
    setQuickMoveItem(item);
    setQuickMoveStage(currentStage);
  };

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading pipeline...</Text>
      </View>
    );
  }

  const totalItems = Object.values(pipeline).reduce((sum, arr) => sum + arr.length, 0);
  const activeStages = STAGES.filter(st => (pipeline[st.key] || []).length > 0);

  return (
    <ScrollView
      testID="pipeline-screen"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space[4] }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchPipeline(); }}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pipeline</Text>
        <Text style={styles.subtitle}>
          {totalItems} items across {activeStages.length} stages
        </Text>
      </View>

      {/* Stage Progress Overview - Clean Design */}
      {totalItems > 0 && (
        <View style={styles.progressCard}>
          {/* Simple Progress Bar */}
          <View style={styles.progressBar}>
            {STAGES.map((stage, i) => {
              const count = (pipeline[stage.key] || []).length;
              if (count === 0) return null;
              return (
                <View
                  key={stage.key}
                  style={[
                    styles.progressSegment,
                    { flex: count, backgroundColor: stage.color },
                    i === 0 && { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
                  ]}
                >
                  {count > 0 && (
                    <Text style={styles.progressSegmentCount}>{count}</Text>
                  )}
                </View>
              );
            })}
          </View>
          
          {/* Legend - Wrapping */}
          <View style={styles.progressLegend}>
            {STAGES.filter(st => (pipeline[st.key] || []).length > 0).map(stage => (
              <View key={stage.key} style={styles.progressLegendItem}>
                <View style={[styles.progressDot, { backgroundColor: stage.color }]} />
                <Text style={styles.progressLegendText}>
                  {statusConfig[stage.key]?.label || stage.key}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <EmptyState
          icon="layers"
          title="No items in pipeline"
          description="Add items to see them flow through your workflow"
        />
      )}

      {/* Stages */}
      {STAGES.map((stage) => {
        const items = pipeline[stage.key] || [];
        if (items.length === 0) return null;

        return (
          <View key={stage.key} testID={`stage-${stage.key}`} style={styles.stageSection}>
            {/* Stage Header */}
            <View style={styles.stageHeader}>
              <View style={styles.stageLeft}>
                <View style={[styles.stageIconWrap, { backgroundColor: stage.color + '15' }]}>
                  <Feather name={stage.icon as any} size={14} color={stage.color} />
                </View>
                <Text style={styles.stageName}>{statusConfig[stage.key]?.label || stage.key}</Text>
              </View>
              <View style={[styles.stageCountBadge, { backgroundColor: stage.color + '15' }]}>
                <Text style={[styles.stageCountText, { color: stage.color }]}>{items.length}</Text>
              </View>
            </View>

            {/* Stage Items */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stageCards}
            >
              {items.map((item: any) => (
                <PipelineCard
                  key={item.id}
                  item={item}
                  currentStage={stage.key}
                  onPress={() => router.push(`/item/${item.id}`)}
                  onLongPress={() => openQuickMove(item, stage.key)}
                  onAdvance={() => advanceItem(item, stage.key)}
                />
              ))}
            </ScrollView>
          </View>
        );
      })}

      <View style={{ height: space[8] }} />

      {/* Quick Move Modal */}
      <Modal
        visible={!!quickMoveItem}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setQuickMoveItem(null)}
      >
        <Pressable style={styles.quickMoveOverlay} onPress={() => setQuickMoveItem(null)}>
          <Pressable style={styles.quickMoveContainer} onPress={() => {}}>
            {/* Header */}
            <View style={styles.quickMoveHeader}>
              <View>
                <Text style={styles.quickMoveTitle}>Move to Stage</Text>
                <Text style={styles.quickMoveItemName} numberOfLines={1}>
                  {quickMoveItem?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setQuickMoveItem(null)} style={styles.quickMoveClose}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Stage Options */}
            <View style={styles.quickMoveStages}>
              {STAGES.map((stage) => {
                const isCurrent = stage.key === quickMoveStage;
                return (
                  <TouchableOpacity
                    key={stage.key}
                    style={[
                      styles.quickMoveStageBtn,
                      isCurrent && styles.quickMoveStageBtnCurrent,
                    ]}
                    onPress={() => !isCurrent && quickMoveToStage(stage.key)}
                    disabled={isCurrent || moving}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.quickMoveStageIcon, { backgroundColor: stage.color + '20' }]}>
                      <Feather name={stage.icon as any} size={16} color={stage.color} />
                    </View>
                    <Text style={[
                      styles.quickMoveStageName,
                      isCurrent && styles.quickMoveStageNameCurrent,
                    ]}>
                      {statusConfig[stage.key]?.label || stage.key}
                    </Text>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Hint */}
            <View style={styles.quickMoveHint}>
              <Feather name="info" size={12} color={colors.textMuted} />
              <Text style={styles.quickMoveHintText}>Long-press any card to move it quickly</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingLeft: spacing.screenPadding,
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
  header: {
    paddingRight: spacing.screenPadding,
    marginBottom: space[6],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    color: colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: space[1],
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },

  // Progress Card
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
    marginRight: spacing.screenPadding,
    marginBottom: space[6],
    ...shadows.sm,
  },
  progressBar: {
    flexDirection: 'row',
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    gap: 2,
    marginBottom: space[3],
  },
  progressSegment: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSegmentCount: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    rowGap: space[2],
  },
  progressLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingRight: space[2],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressLegendText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Stage Section
  stageSection: {
    marginBottom: space[6],
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.screenPadding,
    marginBottom: space[3] + 2,
  },
  stageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2] + 2,
  },
  stageIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  stageCountBadge: {
    paddingHorizontal: space[2] + 2,
    paddingVertical: space[1],
    borderRadius: radius.full,
  },
  stageCountText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },

  // Stage Cards
  stageCards: {
    paddingRight: spacing.screenPadding,
  },

  // Pipeline Card
  pipeCard: {
    width: 156,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[3],
    marginRight: space[3],
    ...shadows.xs,
  },
  pipePhoto: {
    width: '100%',
    height: 90,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[3],
    overflow: 'hidden',
    position: 'relative',
  },
  pipePhotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
  },
  pipeDaysBadge: {
    position: 'absolute',
    top: space[1],
    right: space[1],
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pipeDaysBadgeStale: {
    backgroundColor: colors.warningLight,
  },
  pipeDaysText: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    color: colors.textSecondary,
  },
  pipeDaysTextStale: {
    color: colors.warning,
  },
  pipeTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: fontSize.sm * 1.3,
    marginBottom: 2,
  },
  pipeBrand: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: space[2],
  },
  pipePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginBottom: space[2],
  },
  pipePrice: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  pipeProfit: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.success,
  },
  pipePlatforms: {
    flexDirection: 'row',
    gap: space[1],
  },
  pipePlatformBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipePlatformText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: colors.textTertiary,
  },
  pipeBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pipeAdvanceBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick Move Modal
  quickMoveOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  quickMoveContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space[4],
    paddingBottom: space[8],
    maxHeight: '80%',
  },
  quickMoveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: space[4],
  },
  quickMoveTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    marginBottom: space[1],
  },
  quickMoveItemName: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    maxWidth: 250,
  },
  quickMoveClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMoveStages: {
    paddingHorizontal: spacing.screenPadding,
    gap: space[2],
  },
  quickMoveStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  quickMoveStageBtnCurrent: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.7,
  },
  quickMoveStageIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMoveStageName: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  quickMoveStageNameCurrent: {
    color: colors.textTertiary,
  },
  currentBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  currentBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  quickMoveHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    marginTop: space[4],
    paddingTop: space[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    marginHorizontal: spacing.screenPadding,
  },
  quickMoveHintText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
