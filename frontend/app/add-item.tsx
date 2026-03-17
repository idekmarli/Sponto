import React, { useState } from 'react';
import { useTheme } from '../src/ThemeContext';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows } from '../src/theme';
import { useCurrency } from '../src/currency';
import { api } from '../src/api';

const STEPS = [
  { key: 'info', label: 'Info', icon: 'info' },
  { key: 'sourcing', label: 'Sourcing', icon: 'shopping-bag' },
  { key: 'listing', label: 'Listing', icon: 'tag' },
];

const CATEGORIES = ['Bags', 'Outerwear', 'Knitwear', 'Footwear', 'Accessories', 'Dresses', 'Tops', 'Trousers'];
const CONDITIONS = ['New with Tags', 'Excellent', 'Very Good', 'Good', 'Fair'];
const PLATFORMS = ['ebay', 'depop', 'vinted', 'vestiaire', 'poshmark', 'etsy'];

export default function AddItemScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { formatAmount, currency } = useCurrency();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState('');
  const [source, setSource] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [prepCost, setPrepCost] = useState('');
  const [dateAcquired] = useState(new Date().toISOString().split('T')[0]);
  const [targetPrice, setTargetPrice] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const saveItem = async (draft = false) => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title');
      return;
    }
    setSaving(true);
    try {
      await api.createItem({
        title: title.trim(),
        brand: brand.trim(),
        category,
        size: size.trim(),
        condition,
        source: source.trim(),
        purchase_price: parseFloat(purchasePrice) || 0,
        shipping_to_acquire: parseFloat(shippingCost) || 0,
        prep_cost: parseFloat(prepCost) || 0,
        date_acquired: dateAcquired,
        target_list_price: parseFloat(targetPrice) || 0,
        platforms: selectedPlatforms,
        notes: notes.trim(),
        status: 'sourced',
        is_draft: draft,
        photos: [],
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const totalCost = (parseFloat(purchasePrice) || 0) + (parseFloat(shippingCost) || 0) + (parseFloat(prepCost) || 0);
  const potentialProfit = (parseFloat(targetPrice) || 0) - totalCost;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View testID="add-item-screen" style={[styles.container, { paddingTop: insets.top + space[2] }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="close-btn"
            onPress={() => router.back()}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Feather name="x" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Item</Text>
          <TouchableOpacity
            testID="save-draft-btn"
            onPress={() => saveItem(true)}
            disabled={saving}
            activeOpacity={0.6}
          >
            <Text style={styles.draftText}>Draft</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {STEPS.map((s, i) => (
            <TouchableOpacity
              key={s.key}
              style={styles.stepItem}
              onPress={() => setStep(i)}
              activeOpacity={0.7}
            >
              <View style={[styles.stepBar, i <= step && styles.stepBarActive]} />
              <View style={styles.stepLabelRow}>
                <Feather name={s.icon as any} size={12} color={i === step ? colors.textPrimary : colors.textTertiary} />
                <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Step 1: Info */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Item Information</Text>
              <Text style={styles.stepDesc}>Basic details about your item</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  testID="input-title"
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Acne Studios Musubi Bag"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Brand</Text>
                <TextInput
                  testID="input-brand"
                  style={styles.textInput}
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="e.g. Acne Studios"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.chipRow}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, category === c && styles.chipActive]}
                      onPress={() => setCategory(c)}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Size</Text>
                  <TextInput
                    testID="input-size"
                    style={styles.textInput}
                    value={size}
                    onChangeText={setSize}
                    placeholder="M, 38, OS"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Condition</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {CONDITIONS.map(c => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.chip, condition === c && styles.chipActive]}
                          onPress={() => setCondition(c)}
                          activeOpacity={0.6}
                        >
                          <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          )}

          {/* Step 2: Sourcing */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Sourcing Details</Text>
              <Text style={styles.stepDesc}>Where and how much you paid</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Source</Text>
                <TextInput
                  testID="input-source"
                  style={styles.textInput}
                  value={source}
                  onChangeText={setSource}
                  placeholder="Thrift Store, Estate Sale..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.costCard}>
                <View style={styles.costRow}>
                  <View style={styles.costCol}>
                    <Text style={styles.costLabel}>Purchase</Text>
                    <View style={styles.costInputWrap}>
                      <Text style={styles.costPrefix}>{currency.symbol}</Text>
                      <TextInput
                        testID="input-purchase"
                        style={styles.costInput}
                        value={purchasePrice}
                        onChangeText={setPurchasePrice}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                  <View style={styles.costDivider} />
                  <View style={styles.costCol}>
                    <Text style={styles.costLabel}>Shipping</Text>
                    <View style={styles.costInputWrap}>
                      <Text style={styles.costPrefix}>{currency.symbol}</Text>
                      <TextInput
                        testID="input-ship-cost"
                        style={styles.costInput}
                        value={shippingCost}
                        onChangeText={setShippingCost}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                  <View style={styles.costDivider} />
                  <View style={styles.costCol}>
                    <Text style={styles.costLabel}>Prep</Text>
                    <View style={styles.costInputWrap}>
                      <Text style={styles.costPrefix}>{currency.symbol}</Text>
                      <TextInput
                        testID="input-prep-cost"
                        style={styles.costInput}
                        value={prepCost}
                        onChangeText={setPrepCost}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.costTotalRow}>
                  <Text style={styles.costTotalLabel}>Total Cost</Text>
                  <Text style={styles.costTotalValue}>{formatAmount(totalCost)}</Text>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  testID="input-notes"
                  style={[styles.textInput, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any notes about this item..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
              </View>
            </View>
          )}

          {/* Step 3: Listing */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Listing Setup</Text>
              <Text style={styles.stepDesc}>Pricing and platform selection</Text>

              <View style={styles.targetPriceCard}>
                <Text style={styles.targetPriceLabel}>Target List Price</Text>
                <View style={styles.targetPriceInputRow}>
                  <Text style={styles.targetPricePrefix}>{currency.symbol}</Text>
                  <TextInput
                    testID="input-target-price"
                    style={styles.targetPriceInput}
                    value={targetPrice}
                    onChangeText={setTargetPrice}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                {targetPrice && (
                  <View style={styles.profitPreview}>
                    <Text style={styles.profitPreviewLabel}>Est. Profit</Text>
                    <Text style={[styles.profitPreviewValue, { color: potentialProfit >= 0 ? colors.success : colors.error }]}>
                      {formatAmount(potentialProfit)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Platforms</Text>
                <View style={styles.chipRow}>
                  {PLATFORMS.map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.chip, selectedPlatforms.includes(p) && styles.chipActive]}
                      onPress={() => togglePlatform(p)}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.chipText, selectedPlatforms.includes(p) && styles.chipTextActive]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Cost</Text>
                  <Text style={styles.summaryValue}>{formatAmount(totalCost)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Target Price</Text>
                  <Text style={styles.summaryValue}>{formatAmount(parseFloat(targetPrice) || 0)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelBold}>Est. Profit</Text>
                  <Text style={[styles.summaryValueBold, { color: potentialProfit >= 0 ? colors.success : colors.error }]}>
                    {formatAmount(potentialProfit)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: space[5] }} />
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
          {step > 0 && (
            <TouchableOpacity
              testID="prev-step-btn"
              style={styles.prevBtn}
              onPress={() => setStep(s => s - 1)}
              activeOpacity={0.6}
            >
              <Feather name="arrow-left" size={18} color={colors.textSecondary} />
              <Text style={styles.prevText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 2 ? (
            <TouchableOpacity
              testID="next-step-btn"
              style={[styles.nextBtn, step === 0 && { flex: 1 }]}
              onPress={() => setStep(s => s + 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.nextText}>Next</Text>
              <Feather name="arrow-right" size={18} color={colors.textInverse} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              testID="save-item-btn"
              style={styles.saveBtn}
              onPress={() => saveItem(false)}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Feather name="check" size={18} color={colors.textInverse} />
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Item'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
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
  draftText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.accent,
  },

  // Steps
  stepsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: space[3],
    marginBottom: space[7],
  },
  stepItem: {
    flex: 1,
    gap: space[2],
  },
  stepBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  stepBarActive: {
    backgroundColor: colors.brand,
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1] + 2,
  },
  stepLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  stepLabelActive: {
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },

  // Scroll
  scroll: { flex: 1 },
  stepContent: {
    paddingHorizontal: spacing.screenPadding,
    gap: space[5],
  },
  stepTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'] + 2,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  stepDesc: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: -space[3],
    marginBottom: space[1],
  },

  // Fields
  field: {
    gap: space[2] + 2,
  },
  fieldLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
  textArea: {
    height: 100,
    paddingTop: space[3] + 2,
    textAlignVertical: 'top',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
  chip: {
    paddingHorizontal: space[4],
    paddingVertical: space[2] + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    ...shadows.xs,
  },
  chipActive: {
    backgroundColor: colors.brand,
  },
  chipText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
  },

  // Row
  row: {
    flexDirection: 'row',
    gap: space[3],
  },
  halfField: {
    flex: 1,
    gap: space[2] + 2,
  },

  // Cost Card
  costCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
    ...shadows.sm,
  },
  costRow: {
    flexDirection: 'row',
  },
  costCol: {
    flex: 1,
    alignItems: 'center',
  },
  costDivider: {
    width: 1,
    backgroundColor: colors.divider,
    marginHorizontal: space[2],
  },
  costLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: space[2],
  },
  costInputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  costPrefix: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    color: colors.textTertiary,
    marginRight: 2,
  },
  costInput: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    padding: 0,
    minWidth: 40,
    textAlign: 'center',
  },
  costTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    marginTop: space[4],
    paddingTop: space[3] + 2,
  },
  costTotalLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  costTotalValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // Target Price Card
  targetPriceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.cardPaddingLarge,
    alignItems: 'center',
    ...shadows.sm,
  },
  targetPriceLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: space[2],
  },
  targetPriceInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  targetPricePrefix: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize['2xl'] + 4,
    color: colors.textTertiary,
    marginRight: space[1],
  },
  targetPriceInput: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['4xl'] + 8,
    color: colors.textPrimary,
    padding: 0,
    minWidth: 100,
    textAlign: 'center',
    letterSpacing: -1,
  },
  profitPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[3] + 2,
    paddingTop: space[3] + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  profitPreviewLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  profitPreviewValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    letterSpacing: -0.3,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
  },
  summaryTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: space[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space[1] + 2,
  },
  summaryLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: space[2],
  },
  summaryLabelBold: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  summaryValueBold: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    letterSpacing: -0.3,
  },

  // Bottom
  bottom: {
    flexDirection: 'row',
    gap: space[3],
    paddingHorizontal: spacing.screenPadding,
    paddingTop: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  prevBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    height: spacing.buttonHeight,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    ...shadows.xs,
  },
  prevText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    height: spacing.buttonHeight,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    ...shadows.md,
  },
  nextText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    height: spacing.buttonHeight,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    ...shadows.md,
  },
  saveText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
});
