import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows, typography, statusConfig, healthConfig, tagConfig, MANUAL_TAGS, DERIVED_TAGS } from '../../src/theme';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';
import { SoldModal } from '../../src/components/SoldModal';
import { Toast } from '../../src/components/Toast';
import { Divider } from '../../src/components/UI';

// Financial Row Component
function FinancialRow({ label, value, highlight = false, bold = false }: { 
  label: string; value: string; highlight?: boolean; bold?: boolean 
}) {
  return (
    <View style={[finStyles.row, highlight && finStyles.rowHighlight]}>
      <Text style={[finStyles.label, bold && finStyles.labelBold]}>{label}</Text>
      <Text style={[finStyles.value, bold && finStyles.valueBold]}>{value}</Text>
    </View>
  );
}

// Tag Chip - Editable
function TagChip({ tag, isActive, isDerived, onPress }: {
  tag: typeof MANUAL_TAGS[number] | typeof DERIVED_TAGS[number];
  isActive: boolean;
  isDerived: boolean;
  onPress?: () => void;
}) {
  const config = tagConfig[tag.key];
  if (!config) return null;
  
  return (
    <TouchableOpacity
      style={[
        tagStyles.chip,
        isActive && { backgroundColor: config.bg, borderColor: config.color },
        !isActive && tagStyles.chipInactive,
        isDerived && tagStyles.chipDerived,
      ]}
      onPress={isDerived ? undefined : onPress}
      disabled={isDerived}
      activeOpacity={isDerived ? 1 : 0.6}
    >
      <Feather name={tag.icon as any} size={12} color={isActive ? config.color : colors.textMuted} />
      <Text style={[
        tagStyles.text,
        isActive && { color: config.color },
        !isActive && tagStyles.textInactive,
        isDerived && tagStyles.textDerived,
      ]}>
        {config.label}
      </Text>
      {isDerived && <Text style={tagStyles.autoLabel}>(auto)</Text>}
    </TouchableOpacity>
  );
}

// Get next workflow step
function getNextStep(status: string): { key: string; label: string; icon: string; color: string } | null {
  const steps: Record<string, { key: string; label: string; icon: string; color: string }> = {
    sourced: { key: 'listed', label: 'Mark Listed', icon: 'tag', color: colors.success },
    intake: { key: 'listed', label: 'Mark Listed', icon: 'tag', color: colors.success },
    photographed: { key: 'listed', label: 'Mark Listed', icon: 'tag', color: colors.success },
    listed: { key: 'sold', label: 'Mark Sold', icon: 'dollar-sign', color: colors.success },
    crosslisted: { key: 'sold', label: 'Mark Sold', icon: 'dollar-sign', color: colors.success },
    sold: { key: 'shipped', label: 'Mark Shipped', icon: 'truck', color: colors.brand },
    shipped: { key: 'completed', label: 'Complete', icon: 'check-circle', color: colors.success },
  };
  return steps[status] || null;
}

export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { formatAmount } = useCurrency();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [soldModalVisible, setSoldModalVisible] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (id) {
      api.getItem(id)
        .then(setItem)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Photo upload handler
  const handleAddPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photo library to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setUploadingPhoto(true);
        const photoUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        const currentPhotos = item?.photos || [];
        const updated = await api.updateItem(id!, { photos: [photoUri, ...currentPhotos] });
        setItem(updated);
        setToast({ visible: true, message: 'Photo added!', type: 'success' });
      }
    } catch (e) {
      console.error('Photo upload error:', e);
      setToast({ visible: true, message: 'Failed to add photo', type: 'error' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const updateStatus = async (status: string, additionalData?: any) => {
    if (updating) return;
    setUpdating(true);
    try {
      const updates: any = { status, ...additionalData };
      if (status === 'listed') updates.date_listed = new Date().toISOString();
      const updated = await api.updateItem(id!, updates);
      setItem(updated);
      setToast({ visible: true, message: `Marked as ${statusConfig[status]?.label || status}`, type: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ visible: true, message: 'Failed to update', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const toggleTag = async (tagKey: string) => {
    if (!item || savingTags) return;
    setSavingTags(true);
    try {
      const currentTags = item.tags || [];
      const newTags = currentTags.includes(tagKey)
        ? currentTags.filter((t: string) => t !== tagKey)
        : [...currentTags, tagKey];
      
      const updated = await api.updateItem(id!, { tags: newTags });
      setItem(updated);
    } catch (e) {
      console.error(e);
      setToast({ visible: true, message: 'Failed to update tags', type: 'error' });
    } finally {
      setSavingTags(false);
    }
  };

  const handleNextStep = () => {
    if (!item) return;
    const next = getNextStep(item.status);
    if (!next) return;
    if (next.key === 'sold') {
      setSoldModalVisible(true);
    } else {
      updateStatus(next.key);
    }
  };

  const handleSoldConfirm = async (soldPrice: number) => {
    await updateStatus('sold', { sold_price: soldPrice, date_sold: new Date().toISOString() });
    setToast({ visible: true, message: `Sold for ${formatAmount(soldPrice)}!`, type: 'success' });
  };

  // Loading State
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading item...</Text>
      </View>
    );
  }

  // Not Found State
  if (!item) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <View style={styles.errorIcon}>
          <Feather name="alert-circle" size={28} color={colors.textTertiary} />
        </View>
        <Text style={styles.errorTitle}>Item not found</Text>
        <Text style={styles.errorText}>This item may have been deleted</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusCfg = statusConfig[item.status] || statusConfig.sourced;
  const health = healthConfig[item.health] || healthConfig.fresh;
  const hasPhoto = item.photos?.length > 0;
  const isCompleted = item.status === 'completed';
  const nextStep = getNextStep(item.status);
  const manualTags = item.tags || [];
  const derivedTags = item.derived_tags || [];

  return (
    <>
      <ScrollView
        testID="item-detail-screen"
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space[2], paddingBottom: insets.bottom + space[8] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation */}
        <View style={styles.nav}>
          <TouchableOpacity
            testID="back-btn"
            onPress={() => router.back()}
            style={styles.navBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="edit-item-btn"
            onPress={() => router.push(`/add-item?edit=${id}`)}
            style={styles.navBtn}
            activeOpacity={0.6}
          >
            <Feather name="edit-2" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Photo */}
        <TouchableOpacity style={styles.photoContainer} onPress={handleAddPhoto} activeOpacity={0.8}>
          {uploadingPhoto ? (
            <View style={styles.photoEmpty}>
              <ActivityIndicator size="small" color={colors.brand} />
              <Text style={styles.photoEmptyText}>Uploading...</Text>
            </View>
          ) : hasPhoto ? (
            <>
              <Image source={{ uri: item.photos[0] }} style={styles.photo} />
              <View style={styles.photoAddMore}>
                <Feather name="plus" size={16} color={colors.textInverse} />
              </View>
            </>
          ) : (
            <View style={styles.photoEmpty}>
              <View style={styles.photoAddIcon}>
                <Feather name="camera" size={24} color={colors.brand} />
              </View>
              <Text style={styles.photoEmptyText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title & Status */}
        <Text style={styles.itemTitle}>{item.title}</Text>
        <View style={styles.badges}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Feather name={statusCfg.icon as any} size={12} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
          <View style={[styles.healthBadge, { backgroundColor: health.bg }]}>
            <View style={[styles.healthDot, { backgroundColor: health.color }]} />
            <Text style={[styles.healthText, { color: health.color }]}>{health.label}</Text>
          </View>
        </View>

        {/* Primary Action */}
        {nextStep && !isCompleted && (
          <TouchableOpacity
            testID={`action-${nextStep.key}`}
            style={[styles.primaryAction, { backgroundColor: nextStep.color }]}
            onPress={handleNextStep}
            disabled={updating}
            activeOpacity={0.7}
          >
            <Feather name={nextStep.icon as any} size={20} color={colors.textInverse} />
            <Text style={styles.primaryActionText}>{nextStep.label}</Text>
            {updating && <ActivityIndicator size="small" color={colors.textInverse} style={{ marginLeft: space[2] }} />}
          </TouchableOpacity>
        )}

        {/* Completed Banner */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <Feather name="check-circle" size={20} color={colors.success} />
            <Text style={styles.completedText}>Item Complete</Text>
          </View>
        )}

        {/* Quick Info */}
        <View style={styles.quickInfoRow}>
          {item.brand && (
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>Brand</Text>
              <Text style={styles.quickInfoValue}>{item.brand}</Text>
            </View>
          )}
          {item.category && (
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>Category</Text>
              <Text style={styles.quickInfoValue}>{item.category}</Text>
            </View>
          )}
          {item.size && (
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>Size</Text>
              <Text style={styles.quickInfoValue}>{item.size}</Text>
            </View>
          )}
        </View>

        {/* Platforms */}
        {item.platforms?.length > 0 && (
          <View style={styles.platformsRow}>
            {item.platforms.map((p: string) => (
              <View key={p} style={styles.platformChip}>
                <Text style={styles.platformText}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── WORKFLOW TAGS ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workflow Tags</Text>
            {savingTags && <ActivityIndicator size="small" color={colors.accent} />}
          </View>
          
          {/* Manual Tags */}
          <Text style={styles.tagGroupLabel}>Manual</Text>
          <View style={styles.tagsGrid}>
            {MANUAL_TAGS.map((tag) => (
              <TagChip
                key={tag.key}
                tag={tag}
                isActive={manualTags.includes(tag.key)}
                isDerived={false}
                onPress={() => toggleTag(tag.key)}
              />
            ))}
          </View>

          {/* Derived Tags */}
          {derivedTags.length > 0 && (
            <>
              <Text style={[styles.tagGroupLabel, { marginTop: space[4] }]}>System</Text>
              <View style={styles.tagsGrid}>
                {DERIVED_TAGS.filter(tag => derivedTags.includes(tag.key)).map((tag) => (
                  <TagChip
                    key={tag.key}
                    tag={tag}
                    isActive={true}
                    isDerived={true}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Financials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financials</Text>
          <View style={styles.card}>
            <FinancialRow label="Purchase Price" value={formatAmount(item.purchase_price || 0)} />
            <FinancialRow label="Total Cost Basis" value={formatAmount(item.total_cost_basis || 0)} highlight bold />
            <FinancialRow label="Target List Price" value={formatAmount(item.target_list_price || 0)} />
            {item.sold_price > 0 && (
              <>
                <Divider />
                <FinancialRow label="Sold Price" value={formatAmount(item.sold_price)} />
                <FinancialRow label="Fees" value={`-${formatAmount(item.fees || 0)}`} />
              </>
            )}
            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>Net Profit</Text>
              <Text style={[styles.profitValue, { color: item.net_profit >= 0 ? colors.success : colors.warning }]}>
                {formatAmount(item.net_profit)}
              </Text>
            </View>
            <FinancialRow label="ROI" value={`${item.roi}%`} />
            <FinancialRow label="Margin" value={`${item.margin}%`} />
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Acquired</Text>
                <Text style={styles.timelineValue}>
                  {item.date_acquired ? new Date(item.date_acquired).toLocaleDateString() : '—'}
                </Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: item.date_listed ? colors.success : colors.border }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Listed</Text>
                <Text style={styles.timelineValue}>
                  {item.date_listed ? new Date(item.date_listed).toLocaleDateString() : '—'}
                </Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: item.date_sold ? colors.success : colors.border }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Sold</Text>
                <Text style={styles.timelineValue}>
                  {item.date_sold ? new Date(item.date_sold).toLocaleDateString() : '—'}
                </Text>
              </View>
            </View>
            {item.days_to_sell != null && item.days_to_sell > 0 && (
              <View style={styles.timelineSummary}>
                <Text style={styles.timelineSummaryText}>{item.days_to_sell} days to sell</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {item.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          </View>
        )}

        {/* Secondary Actions */}
        {!isCompleted && (
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              testID="action-archive"
              style={[styles.secondaryBtn, { backgroundColor: colors.warningLight }]}
              onPress={() => updateStatus('archived')}
              activeOpacity={0.6}
            >
              <Feather name="archive" size={16} color={colors.warning} />
              <Text style={[styles.secondaryBtnText, { color: colors.warning }]}>Archive</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <SoldModal
        visible={soldModalVisible}
        onClose={() => setSoldModalVisible(false)}
        item={item ? { id: item.id, title: item.title, target_list_price: item.target_list_price, total_cost_basis: item.total_cost_basis } : null}
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

const tagStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1] + 2,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipInactive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  chipDerived: {
    opacity: 0.8,
  },
  text: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  textInactive: {
    color: colors.textTertiary,
  },
  textDerived: {
    fontStyle: 'italic',
  },
  autoLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
    marginLeft: 2,
  },
});

const finStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space[2] + 2,
  },
  rowHighlight: {
    backgroundColor: colors.surfaceMuted,
    marginHorizontal: -space[4],
    paddingHorizontal: space[4],
    borderRadius: radius.md,
  },
  label: {
    ...typography.bodySmall,
  },
  labelBold: {
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  value: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  valueBold: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.md,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
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

  // Error
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[5],
  },
  errorTitle: {
    ...typography.h3,
    marginBottom: space[2],
  },
  errorText: {
    ...typography.body,
    marginBottom: space[6],
  },
  backBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: space[8],
    paddingVertical: space[3] + 2,
    borderRadius: radius.full,
  },
  backBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },

  // Navigation
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space[4],
  },
  navBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },

  // Photo
  photoContainer: {
    marginBottom: space[4],
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
  },
  photoEmpty: {
    width: '100%',
    height: 160,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoEmptyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  photoAddIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  photoAddMore: {
    position: 'absolute',
    bottom: space[3],
    right: space[3],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },

  // Title & Badges
  itemTitle: {
    ...typography.h2,
    lineHeight: fontSize['2xl'] * 1.3,
    marginBottom: space[3],
  },
  badges: {
    flexDirection: 'row',
    gap: space[2],
    marginBottom: space[5],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1] + 2,
    paddingHorizontal: space[3],
    paddingVertical: space[1] + 2,
    borderRadius: radius.md,
  },
  statusText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[3],
    paddingVertical: space[1] + 2,
    borderRadius: radius.md,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },

  // Primary Action
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2] + 2,
    borderRadius: radius.full,
    paddingVertical: space[4],
    marginBottom: space[5],
    ...shadows.md,
  },
  primaryActionText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },

  // Completed Banner
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2] + 2,
    backgroundColor: colors.successLight,
    borderRadius: radius.lg,
    paddingVertical: space[3] + 2,
    marginBottom: space[5],
  },
  completedText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.success,
  },

  // Quick Info
  quickInfoRow: {
    flexDirection: 'row',
    gap: space[3],
    marginBottom: space[4],
  },
  quickInfoItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space[3],
    paddingHorizontal: space[3] + 2,
    ...shadows.xs,
  },
  quickInfoLabel: {
    ...typography.caption,
    marginBottom: space[1],
  },
  quickInfoValue: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },

  // Platforms
  platformsRow: {
    flexDirection: 'row',
    gap: space[2],
    flexWrap: 'wrap',
    marginBottom: space[6],
  },
  platformChip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space[3] + 2,
    paddingVertical: space[2],
    borderRadius: radius.full,
  },
  platformText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Sections
  section: {
    marginBottom: space[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[3],
  },
  sectionTitle: {
    ...typography.h4,
  },
  tagGroupLabel: {
    ...typography.labelSmall,
    marginBottom: space[2],
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    ...shadows.xs,
  },

  // Profit Row
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    marginTop: space[1],
  },
  profitLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  profitValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl + 2,
    letterSpacing: -0.5,
  },

  // Timeline
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[4],
    ...shadows.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    marginBottom: space[3] + 2,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabel: {
    ...typography.label,
  },
  timelineValue: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  timelineSummary: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: space[2] + 2,
    paddingHorizontal: space[3] + 2,
    marginTop: space[1],
  },
  timelineSummaryText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Notes
  notesText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    lineHeight: fontSize.sm * 1.6,
    paddingVertical: space[2],
  },

  // Secondary Actions
  secondaryActions: {
    flexDirection: 'row',
    gap: space[2] + 2,
    marginBottom: space[4],
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingVertical: space[3] + 2,
  },
  secondaryBtnText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
