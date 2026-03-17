import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, statusLabels, platformColors } from '../../src/theme';
import { api } from '../../src/api';

const STAGES = ['sourced', 'intake', 'photographed', 'listed', 'crosslisted', 'sold', 'shipped', 'completed'];
const STAGE_ICONS: Record<string, string> = {
  sourced: 'shopping-bag',
  intake: 'inbox',
  photographed: 'camera',
  listed: 'tag',
  crosslisted: 'copy',
  sold: 'dollar-sign',
  shipped: 'truck',
  completed: 'check-circle',
};

export default function PipelineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPipeline = useCallback(async () => {
    try {
      const data = await api.getPipeline();
      setPipeline(data);
    } catch (e) {
      console.error('Pipeline fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      testID="pipeline-screen"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPipeline(); }} tintColor={colors.accent} />}
    >
      <Text style={styles.title}>Pipeline</Text>
      <Text style={styles.subtitle}>Items by workflow stage</Text>

      {STAGES.map((stage) => {
        const items = pipeline[stage] || [];
        return (
          <View key={stage} testID={`stage-${stage}`} style={styles.stageSection}>
            <View style={styles.stageHeader}>
              <Feather name={STAGE_ICONS[stage] as any} size={16} color={colors.textSecondary} />
              <Text style={styles.stageName}>{statusLabels[stage] || stage}</Text>
              <View style={styles.stageCount}>
                <Text style={styles.stageCountText}>{items.length}</Text>
              </View>
            </View>
            {items.length === 0 ? (
              <View style={styles.emptyStage}>
                <Text style={styles.emptyStageText}>No items</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageItems}>
                {items.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    testID={`pipeline-item-${item.id}`}
                    style={styles.pipelineCard}
                    onPress={() => router.push(`/item/${item.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardPhoto}>
                      <Feather name="image" size={16} color={colors.textTertiary} />
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.cardChips}>
                      {item.platforms?.slice(0, 2).map((p: string) => (
                        <View key={p} style={[styles.cardPlatform, { backgroundColor: (platformColors[p] || colors.accent) + '15' }]}>
                          <Text style={[styles.cardPlatformText, { color: platformColors[p] || colors.accent }]}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {item.days_listed != null && (
                      <Text style={styles.cardAge}>{item.days_listed}d in stage</Text>
                    )}
                    {item.days_in_inventory != null && !item.days_listed && (
                      <Text style={styles.cardAge}>{item.days_in_inventory}d in inventory</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        );
      })}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.containerPadding },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.l },
  stageSection: { marginBottom: spacing.l },
  stageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  stageName: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.textPrimary },
  stageCount: { backgroundColor: colors.surfaceHighlight, borderRadius: borderRadius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  stageCountText: { fontFamily: 'Mulish_600SemiBold', fontSize: 12, color: colors.textSecondary },
  stageItems: { gap: 10, paddingRight: 4 },
  pipelineCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 6,
  },
  cardPhoto: {
    width: '100%',
    height: 80,
    borderRadius: borderRadius.s,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: { fontFamily: 'Mulish_700Bold', fontSize: 13, color: colors.textPrimary },
  cardChips: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  cardPlatform: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: borderRadius.pill },
  cardPlatformText: { fontFamily: 'Mulish_600SemiBold', fontSize: 10 },
  cardAge: { fontFamily: 'Mulish_400Regular', fontSize: 11, color: colors.textTertiary },
  emptyStage: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.m,
    padding: 16,
    alignItems: 'center',
  },
  emptyStageText: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textTertiary },
});
