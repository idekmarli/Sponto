import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, statusLabels } from '../../src/theme';
import { api } from '../../src/api';

const STAGES = [
  { key: 'sourced', icon: 'shopping-bag', color: colors.accent },
  { key: 'intake', icon: 'inbox', color: colors.accent },
  { key: 'photographed', icon: 'camera', color: colors.accent },
  { key: 'listed', icon: 'tag', color: colors.success },
  { key: 'crosslisted', icon: 'copy', color: colors.success },
  { key: 'sold', icon: 'dollar-sign', color: colors.profit },
  { key: 'shipped', icon: 'truck', color: colors.profit },
  { key: 'completed', icon: 'check-circle', color: colors.textTertiary },
];

// Pipeline Item Card
function PipelineCard({ item, onPress }: { item: any; onPress: () => void }) {
  const daysInfo = item.days_listed ?? item.days_in_inventory;
  
  return (
    <TouchableOpacity
      testID={`pipeline-item-${item.id}`}
      style={styles.pipeCard}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.pipePhoto}>
        <Feather name="camera" size={14} color={colors.textMuted} />
      </View>
      <Text style={styles.pipeTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.pipeBrand} numberOfLines={1}>{item.brand}</Text>
      {item.platforms?.length > 0 && (
        <View style={styles.pipePlatforms}>
          {item.platforms.slice(0, 2).map((p: string, i: number) => (
            <Text key={p} style={styles.pipePlatformText}>
              {i > 0 ? ' · ' : ''}{p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          ))}
        </View>
      )}
      {daysInfo != null && daysInfo > 0 && (
        <View style={styles.pipeDays}>
          <Text style={styles.pipeDaysText}>{daysInfo}d</Text>
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
      setPipeline(await api.getPipeline());
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

  // Loading State
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
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
                  {(pipeline[stage.key] || []).length} {statusLabels[stage.key]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="layers" size={28} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No items in pipeline</Text>
          <Text style={styles.emptyText}>Add items to see them flow through your workflow</Text>
        </View>
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
                <Text style={styles.stageName}>{statusLabels[stage.key]}</Text>
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

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingLeft: spacing.containerPadding,
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

  // Header
  header: {
    paddingRight: spacing.containerPadding,
    marginBottom: spacing.l,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textTertiary,
  },

  // Progress Card
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
    marginRight: spacing.containerPadding,
    marginBottom: spacing.sectionGap,
    ...shadows.card,
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
    marginBottom: 14,
  },
  progressSegment: {
    minWidth: 8,
  },
  progressLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  progressLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressLegendText: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingRight: spacing.containerPadding,
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
  },

  // Stage Section
  stageSection: {
    marginBottom: spacing.l,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.containerPadding,
    marginBottom: 14,
  },
  stageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stageIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageName: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  stageCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  stageCountText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 13,
  },

  // Stage Cards
  stageCards: {
    gap: 12,
    paddingRight: spacing.containerPadding,
  },

  // Pipeline Card
  pipeCard: {
    width: 156,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: 14,
    ...shadows.card,
  },
  pipePhoto: {
    width: '100%',
    height: 80,
    borderRadius: borderRadius.m,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pipeTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 2,
  },
  pipeBrand: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  pipePlatforms: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  pipePlatformText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  pipeDays: {
    marginTop: 'auto',
  },
  pipeDaysText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
});
