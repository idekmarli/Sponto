import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows, statusConfig } from '../../src/theme';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';
import { EmptyState } from '../../src/components/UI';

const STAGES = [
  { key: 'sourced', icon: 'shopping-bag', color: colors.accent },
  { key: 'intake', icon: 'inbox', color: colors.accent },
  { key: 'photographed', icon: 'camera', color: colors.accent },
  { key: 'listed', icon: 'tag', color: colors.success },
  { key: 'crosslisted', icon: 'copy', color: colors.success },
  { key: 'sold', icon: 'dollar-sign', color: colors.success },
  { key: 'shipped', icon: 'truck', color: colors.success },
  { key: 'completed', icon: 'check-circle', color: colors.textTertiary },
];

// Pipeline Item Card - Enhanced with price, profit, and photo
function PipelineCard({ item, onPress }: { item: any; onPress: () => void }) {
  const { formatAmount } = useCurrency();
  const daysInfo = item.days_listed ?? item.days_in_inventory;
  const hasPhoto = item.photos && item.photos.length > 0 && item.photos[0];
  const price = item.listed_price || item.target_list_price || item.purchase_price;
  const profit = item.profit || (item.listed_price && item.purchase_price ? item.listed_price - item.purchase_price : 0);
  const isStale = daysInfo > 30;
  
  return (
    <TouchableOpacity
      testID={`pipeline-item-${item.id}`}
      style={styles.pipeCard}
      onPress={onPress}
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
      
      {/* Platform badges */}
      {item.platforms?.length > 0 && (
        <View style={styles.pipePlatforms}>
          {item.platforms.slice(0, 2).map((p: string, i: number) => (
            <View key={p} style={styles.pipePlatformBadge}>
              <Text style={styles.pipePlatformText}>{p.charAt(0).toUpperCase()}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function PipelineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

      {/* Stage Progress Overview */}
      {totalItems > 0 && (
        <View style={styles.progressCard}>
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
                    i === 0 && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.progressLegend}>
            {STAGES.filter(st => (pipeline[st.key] || []).length > 0).slice(0, 4).map(stage => (
              <View key={stage.key} style={styles.progressLegendItem}>
                <View style={[styles.progressDot, { backgroundColor: stage.color }]} />
                <Text style={styles.progressLegendText}>
                  {(pipeline[stage.key] || []).length} {statusConfig[stage.key]?.label || stage.key}
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
                  onPress={() => router.push(`/item/${item.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        );
      })}

      <View style={{ height: space[8] }} />
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
    marginBottom: space[8],
    ...shadows.sm,
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
    marginBottom: space[3] + 2,
  },
  progressSegment: {
    minWidth: 8,
  },
  progressLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[4],
  },
  progressLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressLegendText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
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
    gap: space[3],
    paddingRight: spacing.screenPadding,
  },

  // Pipeline Card
  pipeCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[3],
    ...shadows.card,
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
});
