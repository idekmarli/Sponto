import React, { useState, useEffect } from 'react';
import { useTheme } from '../src/ThemeContext';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows } from '../src/theme';
import { useCurrency } from '../src/currency';
import { api } from '../src/api';
import { store } from '../src/store';

const PLATFORMS = ['eBay', 'Depop', 'Vinted', 'Vestiaire', 'Poshmark', 'Etsy'];

type AddMode = 'choose' | 'manual';

// ─── Mode Selection ───
function ModeSelectionScreen({ onSelectManual, onSelectScreenshot }: { onSelectManual: () => void; onSelectScreenshot: () => void }) {
  return (
    <View style={styles.modeContainer}>
      <View style={styles.modeHeader}>
        <Text style={styles.modeTitle}>Add New Item</Text>
        <Text style={styles.modeSubtitle}>Choose how you'd like to add your item</Text>
      </View>

      {/* Screenshot Option - Featured */}
      <TouchableOpacity style={styles.modeCardFeatured} onPress={onSelectScreenshot} activeOpacity={0.7}>
        <View style={styles.modeCardFeaturedBadge}>
          <Feather name="zap" size={10} color={colors.textInverse} />
          <Text style={styles.modeCardFeaturedBadgeText}>Smart</Text>
        </View>
        <View style={styles.modeCardIcon}>
          <Feather name="image" size={28} color={colors.brand} />
        </View>
        <Text style={styles.modeCardTitle}>Add from Screenshot</Text>
        <Text style={styles.modeCardDesc}>
          Upload a marketplace screenshot and we'll automatically extract the listing details
        </Text>
        <View style={styles.modeCardFeatures}>
          <View style={styles.modeCardFeature}>
            <Feather name="check" size={12} color={colors.success} />
            <Text style={styles.modeCardFeatureText}>Auto-extracts title, price, size</Text>
          </View>
          <View style={styles.modeCardFeature}>
            <Feather name="check" size={12} color={colors.success} />
            <Text style={styles.modeCardFeatureText}>Detects marketplace platform</Text>
          </View>
          <View style={styles.modeCardFeature}>
            <Feather name="check" size={12} color={colors.success} />
            <Text style={styles.modeCardFeatureText}>Review & edit before saving</Text>
          </View>
        </View>
        <View style={styles.modeCardAction}>
          <Text style={styles.modeCardActionText}>Select Screenshots</Text>
          <Feather name="arrow-right" size={16} color={colors.textInverse} />
        </View>
      </TouchableOpacity>

      {/* Manual Option */}
      <TouchableOpacity style={styles.modeCardSecondary} onPress={onSelectManual} activeOpacity={0.7}>
        <View style={styles.modeCardSecondaryInner}>
          <View style={styles.modeCardIconSmall}>
            <Feather name="edit-3" size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.modeCardSecondaryContent}>
            <Text style={styles.modeCardSecondaryTitle}>Manual Entry</Text>
            <Text style={styles.modeCardSecondaryDesc}>Quick form for basic item details</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Manual Entry Form ───
function ManualEntryForm({ onBack, params }: { onBack: () => void; params: any }) {
  const router = useRouter();
  const { formatAmount, currency } = useCurrency();
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(params.purchasePrice || '');
  const [targetPrice, setTargetPrice] = useState(params.targetPrice || '');
  const [platform, setPlatform] = useState(params.platform || 'eBay');

  useEffect(() => {
    if (!params.platform) {
      store.getLastPlatform().then(setPlatform);
    }
  }, []);

  const totalCost = parseFloat(purchasePrice) || 0;
  const target = parseFloat(targetPrice) || 0;
  const potentialProfit = target - totalCost;
  const canSave = title.trim().length > 0;

  const saveItem = async (addAnother = false) => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await store.setLastPlatform(platform);
      await api.createItem({
        title: title.trim(),
        brand: brand.trim(),
        purchase_price: totalCost,
        target_list_price: target,
        platforms: [platform.toLowerCase()],
        status: 'sourced',
        date_acquired: new Date().toISOString().split('T')[0],
        photos: [],
      });
      
      if (addAnother) {
        setTitle('');
        setBrand('');
        setPurchasePrice('');
        setTargetPrice('');
      } else {
        router.back();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* From Source Calculator Banner */}
        {params.fromSource && (
          <View style={styles.sourceBanner}>
            <Feather name="zap" size={14} color={colors.success} />
            <Text style={styles.sourceBannerText}>Pre-filled from Source Calculator</Text>
          </View>
        )}

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>What is it?</Text>
          <TextInput
            testID="input-title"
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Acne Studios Musubi Bag"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
        </View>

        {/* Brand */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Brand</Text>
            <Text style={styles.optionalText}>optional</Text>
          </View>
          <TextInput
            testID="input-brand"
            style={styles.textInput}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g. Acne Studios"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Purchase</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.pricePrefix}>{currency.symbol}</Text>
                <TextInput
                  testID="input-purchase"
                  style={styles.priceInput}
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Target Sale</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.pricePrefix}>{currency.symbol}</Text>
                <TextInput
                  testID="input-target"
                  style={styles.priceInput}
                  value={targetPrice}
                  onChangeText={setTargetPrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </View>
          {/* Profit Preview */}
          {target > 0 && totalCost > 0 && (
            <View style={[styles.profitRow, { backgroundColor: potentialProfit >= 0 ? colors.successLight : colors.errorLight }]}>
              <Text style={styles.profitLabel}>Est. Profit</Text>
              <Text style={[styles.profitValue, { color: potentialProfit >= 0 ? colors.success : colors.error }]}>
                {potentialProfit >= 0 ? '+' : ''}{formatAmount(potentialProfit)}
              </Text>
            </View>
          )}
        </View>

        {/* Platform */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Primary Platform</Text>
          <View style={styles.platformRow}>
            {PLATFORMS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.platformChip, platform === p && styles.platformChipActive]}
                onPress={() => setPlatform(p)}
                activeOpacity={0.6}
              >
                <Text style={[styles.platformText, platform === p && styles.platformTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          testID="save-another-btn"
          style={[styles.addAnotherBtn, !canSave && styles.btnDisabled]}
          onPress={() => saveItem(true)}
          disabled={!canSave || saving}
          activeOpacity={0.6}
        >
          <Feather name="plus" size={18} color={canSave ? colors.textSecondary : colors.textMuted} />
          <Text style={[styles.addAnotherText, !canSave && styles.textDisabled]}>Save & Add</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="save-btn"
          style={[styles.saveBtn, !canSave && styles.btnDisabled]}
          onPress={() => saveItem(false)}
          disabled={!canSave || saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <>
              <Feather name="check" size={18} color={colors.textInverse} />
              <Text style={styles.saveText}>Save Item</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

// ─── Main Component ───
export default function QuickAddScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ fromSource?: string; purchasePrice?: string; targetPrice?: string; platform?: string }>();
  
  // If coming from source calculator, go straight to manual entry
  const [mode, setMode] = useState<AddMode>(params.fromSource ? 'manual' : 'choose');

  const handleSelectScreenshot = () => {
    router.push('/add-from-screenshot');
  };

  const handleSelectManual = () => {
    setMode('manual');
  };

  const handleBack = () => {
    if (mode === 'manual' && !params.fromSource) {
      setMode('choose');
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View testID="quick-add-screen" style={[styles.container, { paddingTop: insets.top + space[2], paddingBottom: Math.max(insets.bottom, space[4]) }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="close-btn"
            onPress={handleBack}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Feather name={mode === 'manual' && !params.fromSource ? 'arrow-left' : 'x'} size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{mode === 'choose' ? 'Add Item' : 'Quick Add'}</Text>
          {mode === 'manual' ? (
            <TouchableOpacity
              testID="full-form-btn"
              onPress={() => router.replace('/add-item')}
              activeOpacity={0.6}
            >
              <Text style={styles.fullFormText}>Full Form</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {mode === 'choose' && (
          <ModeSelectionScreen 
            onSelectManual={handleSelectManual}
            onSelectScreenshot={handleSelectScreenshot}
          />
        )}

        {mode === 'manual' && (
          <ManualEntryForm onBack={handleBack} params={params} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.screenPadding,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[5],
  },
  closeBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  fullFormText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.accent,
  },

  // Mode Selection
  modeContainer: {
    flex: 1,
  },
  modeHeader: {
    alignItems: 'center',
    marginBottom: space[6],
  },
  modeTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    marginBottom: space[2],
  },
  modeSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  modeCardFeatured: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[5],
    marginBottom: space[4],
    ...shadows.medium,
    position: 'relative',
  },
  modeCardFeaturedBadge: {
    position: 'absolute',
    top: space[4],
    right: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand,
    paddingHorizontal: space[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  modeCardFeaturedBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: colors.textInverse,
    textTransform: 'uppercase',
  },
  modeCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[4],
  },
  modeCardIconSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: space[2],
  },
  modeCardDesc: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: space[4],
  },
  modeCardFeatures: {
    gap: space[2],
    marginBottom: space[5],
  },
  modeCardFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  modeCardFeatureText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  modeCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    height: spacing.buttonHeight,
    ...shadows.sm,
  },
  modeCardActionText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
  modeCardSecondary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  modeCardSecondaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[4],
    gap: space[3],
  },
  modeCardSecondaryContent: {
    flex: 1,
  },
  modeCardSecondaryTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  modeCardSecondaryDesc: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },

  // Scroll
  scroll: { flex: 1 },

  // Source Banner
  sourceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    paddingVertical: space[2] + 2,
    paddingHorizontal: space[3] + 2,
    marginBottom: space[5],
  },
  sourceBannerText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.success,
  },

  // Fields
  field: { marginBottom: space[5] },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  fieldLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: space[2] + 2,
  },
  optionalText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: space[2] + 2,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: spacing.inputHeight,
    paddingHorizontal: space[4],
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    ...shadows.xs,
  },

  // Price Card
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: space[5],
    ...shadows.sm,
  },
  priceRow: {
    flexDirection: 'row',
    padding: spacing.cardPadding,
  },
  priceCol: {
    flex: 1,
    alignItems: 'center',
  },
  priceDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  priceLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: space[2],
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pricePrefix: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xl,
    color: colors.textTertiary,
    marginRight: 2,
  },
  priceInput: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'] + 4,
    color: colors.textPrimary,
    padding: 0,
    minWidth: 60,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  profitLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  profitValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    letterSpacing: -0.3,
  },

  // Platform
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
  platformChip: {
    paddingHorizontal: space[4],
    paddingVertical: space[2] + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    ...shadows.xs,
  },
  platformChipActive: {
    backgroundColor: colors.brand,
  },
  platformText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  platformTextActive: {
    color: colors.textInverse,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: space[3],
    paddingTop: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  addAnotherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1] + 2,
    height: spacing.buttonHeight,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    ...shadows.xs,
  },
  addAnotherText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    height: spacing.buttonHeight,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    ...shadows.md,
  },
  saveText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});
