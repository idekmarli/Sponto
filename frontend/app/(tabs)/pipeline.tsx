import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, statusLabels } from '../../src/theme';
import { api } from '../../src/api';

const STAGES = ['sourced', 'intake', 'photographed', 'listed', 'crosslisted', 'sold', 'shipped', 'completed'];
const STAGE_ICONS: Record<string, string> = {
  sourced: 'shopping-bag', intake: 'inbox', photographed: 'camera', listed: 'tag',
  crosslisted: 'copy', sold: 'dollar-sign', shipped: 'truck', completed: 'check-circle',
};

export default function PipelineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPipeline = useCallback(async () => {
    try { setPipeline(await api.getPipeline()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  if (loading) {
    return <View style={[s.container, s.center, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  const totalItems = Object.values(pipeline).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <ScrollView
      testID="pipeline-screen"
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 20 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPipeline(); }} tintColor={colors.accent} />}
    >
      <Text style={s.title}>Pipeline</Text>
      <Text style={s.subtitle}>{totalItems} items across {STAGES.filter(st => (pipeline[st] || []).length > 0).length} stages</Text>

      {STAGES.map((stage) => {
        const items = pipeline[stage] || [];
        const isEmpty = items.length === 0;
        return (
          <View key={stage} testID={`stage-${stage}`} style={s.stageSection}>
            <View style={s.stageHeader}>
              <View style={s.stageLeft}>
                <Feather name={STAGE_ICONS[stage] as any} size={14} color={colors.textSecondary} />
                <Text style={s.stageName}>{statusLabels[stage]}</Text>
              </View>
              <Text style={[s.stageCount, isEmpty && s.stageCountEmpty]}>{items.length}</Text>
            </View>
            {isEmpty ? (
              <View style={s.emptyStage}><Text style={s.emptyStageText}>—</Text></View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.stageCards}>
                {items.map((item: any) => (
                  <TouchableOpacity key={item.id} testID={`pipeline-item-${item.id}`} style={s.pipeCard} onPress={() => router.push(`/item/${item.id}`)} activeOpacity={0.6}>
                    <View style={s.pipePhoto}><Feather name="camera" size={14} color={colors.textTertiary} /></View>
                    <Text style={s.pipeTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={s.pipeBrand} numberOfLines={1}>{item.brand}</Text>
                    {item.platforms?.length > 0 && (
                      <Text style={s.pipePlatforms} numberOfLines={1}>
                        {item.platforms.slice(0, 2).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' · ')}
                      </Text>
                    )}
                    {(item.days_listed != null || item.days_in_inventory != null) && (
                      <Text style={s.pipeAge}>{item.days_listed ?? item.days_in_inventory}d</Text>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingLeft: spacing.containerPadding },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 30, color: colors.textPrimary, letterSpacing: -0.6, paddingRight: spacing.containerPadding },
  subtitle: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textTertiary, marginTop: 2, marginBottom: spacing.sectionGap, paddingRight: spacing.containerPadding },
  stageSection: { marginBottom: spacing.l },
  stageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingRight: spacing.containerPadding },
  stageLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stageName: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: colors.textPrimary },
  stageCount: { fontFamily: 'Mulish_600SemiBold', fontSize: 13, color: colors.textSecondary },
  stageCountEmpty: { color: colors.textTertiary },
  stageCards: { gap: 10, paddingRight: spacing.containerPadding },
  pipeCard: {
    width: 150,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: 12,
    gap: 4,
    ...shadows.subtle,
  },
  pipePhoto: { width: '100%', height: 72, borderRadius: borderRadius.xs, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  pipeTitle: { fontFamily: 'Mulish_700Bold', fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  pipeBrand: { fontFamily: 'Mulish_400Regular', fontSize: 11, color: colors.textSecondary },
  pipePlatforms: { fontFamily: 'Mulish_400Regular', fontSize: 10, color: colors.textTertiary, marginTop: 2 },
  pipeAge: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: colors.textTertiary, marginTop: 2 },
  emptyStage: { height: 40, justifyContent: 'center', alignItems: 'center', marginRight: spacing.containerPadding },
  emptyStageText: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textTertiary },
});
