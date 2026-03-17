import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../src/theme';
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
      <View testID="add-item-screen" style={[styles.container, { paddingTop: insets.top + 8 }]}>
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
                      <Text style={styles.costPrefix}>$</Text>
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
                      <Text style={styles.costPrefix}>$</Text>
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
                      <Text style={styles.costPrefix}>$</Text>
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
                  <Text style={styles.costTotalValue}>${totalCost.toFixed(2)}</Text>
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
                  <Text style={styles.targetPricePrefix}>$</Text>
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
                      ${potentialProfit.toFixed(2)}
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
                  <Text style={styles.summaryValue}>${totalCost.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Target Price</Text>
                  <Text style={styles.summaryValue}>${parseFloat(targetPrice) || 0}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelBold}>Est. Profit</Text>
                  <Text style={[styles.summaryValueBold, { color: potentialProfit >= 0 ? colors.success : colors.error }]}>
                    ${potentialProfit.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              testID="save-item-btn"
              style={styles.saveBtn}
              onPress={() => saveItem(false)}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Feather name="check" size={18} color="#FFFFFF" />
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Item'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerPadding,
    marginBottom: 20,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  headerTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 17,
    color: colors.textPrimary,
  },
  draftText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 15,
    color: colors.accent,
  },

  // Steps
  stepsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.containerPadding,
    gap: 12,
    marginBottom: 28,
  },
  stepItem: {
    flex: 1,
    gap: 8,
  },
  stepBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  stepBarActive: {
    backgroundColor: colors.textPrimary,
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stepLabel: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 12,
    color: colors.textTertiary,
  },
  stepLabelActive: {
    fontFamily: 'Mulish_700Bold',
    color: colors.textPrimary,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  stepContent: {
    paddingHorizontal: spacing.containerPadding,
    gap: 20,
  },
  stepTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  stepDesc: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: -12,
    marginBottom: 4,
  },

  // Fields
  field: {
    gap: 10,
  },
  fieldLabel: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    height: spacing.inputHeight,
    paddingHorizontal: 16,
    fontFamily: 'Mulish_500Medium',
    fontSize: 15,
    color: colors.textPrimary,
    ...shadows.subtle,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  chipActive: {
    backgroundColor: colors.textPrimary,
  },
  chipText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // Row
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
    gap: 10,
  },

  // Cost Card
  costCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
    ...shadows.card,
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
    marginHorizontal: 8,
  },
  costLabel: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  costInputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  costPrefix: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 18,
    color: colors.textTertiary,
    marginRight: 2,
  },
  costInput: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 24,
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
    marginTop: 16,
    paddingTop: 14,
  },
  costTotalLabel: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  costTotalValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // Target Price Card
  targetPriceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.cardPaddingLarge,
    alignItems: 'center',
    ...shadows.card,
  },
  targetPriceLabel: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  targetPriceInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  targetPricePrefix: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 28,
    color: colors.textTertiary,
    marginRight: 4,
  },
  targetPriceInput: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 48,
    color: colors.textPrimary,
    padding: 0,
    minWidth: 100,
    textAlign: 'center',
    letterSpacing: -1,
  },
  profitPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  profitPreviewLabel: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  profitPreviewValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
  },
  summaryTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  summaryLabelBold: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  summaryValueBold: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },

  // Bottom
  bottom: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.containerPadding,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  prevBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: spacing.buttonHeight,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  prevText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 15,
    color: colors.textSecondary,
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: spacing.buttonHeight,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.textPrimary,
    ...shadows.medium,
  },
  nextText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: spacing.buttonHeight,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.success,
    ...shadows.medium,
  },
  saveText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
