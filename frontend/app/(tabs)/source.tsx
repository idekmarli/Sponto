import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';
import { api } from '../../src/api';

const PLATFORMS = ['eBay', 'Depop', 'Vinted', 'Vestiaire', 'Poshmark', 'Etsy'];
const CATEGORIES = ['Bags', 'Outerwear', 'Knitwear', 'Footwear', 'Accessories', 'Dresses', 'Tops', 'Trousers'];

interface CalcResult {
  total_cost_basis: number;
  estimated_fees: number;
  fee_percentage: number;
  net_profit: number;
  roi: number;
  margin: number;
  break_even_price: number;
  max_buy_price: number;
  min_acceptable_sale: number;
  verdict: 'buy' | 'risky' | 'skip';
  confidence: string;
  profit_per_day: number;
  platform_context: { avg_roi: number; avg_days: number; total_sold: number } | null;
  category_context: { avg_roi: number; avg_days: number; total_sold: number } | null;
}

const VERDICT_CONFIG = {
  buy: {
    label: 'Buy',
    icon: 'check' as const,
    color: colors.success,
    bg: colors.successLight,
    bgDark: '#4A6040',
  },
  risky: {
    label: 'Risky',
    icon: 'alert-circle' as const,
    color: colors.warning,
    bg: colors.warningLight,
    bgDark: '#9A5A3A',
  },
  skip: {
    label: 'Skip',
    icon: 'x' as const,
    color: colors.error,
    bg: colors.errorLight,
    bgDark: '#8A3838',
  },
};

const CONFIDENCE_MESSAGES: Record<string, string> = {
  strong: 'Strong buy — exceeds your targets',
  meets_targets: 'Meets ROI and profit targets',
  close_to_targets: 'Close but below your threshold',
  below_targets: 'Profitable but below targets',
  unprofitable: 'This deal loses money',
  negative_roi: 'Negative return on investment',
};

export default function SourceScreen() {
  const insets = useSafeAreaInsets();
  const [purchasePrice, setPurchasePrice] = useState('');
  const [expectedSale, setExpectedSale] = useState('');
  const [platform, setPlatform] = useState('eBay');
  const [category, setCategory] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [prepCost, setPrepCost] = useState('');
  const [packagingCost, setPackagingCost] = useState('');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const canCalculate = purchasePrice && expectedSale && platform;

  const calculate = async () => {
    if (!canCalculate) return;
    setCalculating(true);
    try {
      setResult(await api.sourceCalculate({
        purchase_price: parseFloat(purchasePrice) || 0,
        expected_sale_price: parseFloat(expectedSale) || 0,
        platform: platform.toLowerCase(),
        category,
        shipping_to_acquire: parseFloat(shippingCost) || 0,
        prep_cost: parseFloat(prepCost) || 0,
        packaging_cost: parseFloat(packagingCost) || 0,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setCalculating(false);
    }
  };

  const reset = () => {
    setPurchasePrice('');
    setExpectedSale('');
    setShippingCost('');
    setPrepCost('');
    setPackagingCost('');
    setCategory('');
    setResult(null);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        testID="source-screen"
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Source</Text>
          <Text style={styles.subtitle}>Should you buy it?</Text>
        </View>

        {/* Platform Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Platform</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <View style={styles.chipRow}>
              {PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p}
                  testID={`platform-${p.toLowerCase()}`}
                  style={[styles.chip, platform === p && styles.chipActive]}
                  onPress={() => setPlatform(p)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.chipText, platform === p && styles.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Category Selection (Optional) */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.labelOptional}>optional</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(category === c ? '' : c)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Core Price Inputs */}
        <View style={styles.priceInputCard}>
          <View style={styles.priceInputRow}>
            <View style={styles.priceInputCol}>
              <Text style={styles.priceInputLabel}>Purchase Price</Text>
              <View style={styles.priceInputField}>
                <Text style={styles.pricePrefix}>$</Text>
                <TextInput
                  testID="input-purchase-price"
                  style={styles.priceInput}
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
            <View style={styles.priceInputDivider} />
            <View style={styles.priceInputCol}>
              <Text style={styles.priceInputLabel}>Expected Sale</Text>
              <View style={styles.priceInputField}>
                <Text style={styles.pricePrefix}>$</Text>
                <TextInput
                  testID="input-expected-sale"
                  style={styles.priceInput}
                  value={expectedSale}
                  onChangeText={setExpectedSale}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Additional Costs */}
        <View style={styles.section}>
          <Text style={styles.smallLabel}>Additional Costs</Text>
          <View style={styles.costRow}>
            {[
              { label: 'Shipping', value: shippingCost, set: setShippingCost, testId: 'input-shipping' },
              { label: 'Prep', value: prepCost, set: setPrepCost, testId: 'input-prep' },
              { label: 'Packaging', value: packagingCost, set: setPackagingCost, testId: 'input-packaging' },
            ].map((field) => (
              <View key={field.testId} style={styles.costCol}>
                <Text style={styles.costLabel}>{field.label}</Text>
                <View style={styles.costInputWrap}>
                  <Text style={styles.costPrefix}>$</Text>
                  <TextInput
                    testID={field.testId}
                    style={styles.costInput}
                    value={field.value}
                    onChangeText={field.set}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          testID="calculate-btn"
          style={[styles.calcButton, !canCalculate && styles.calcButtonDisabled]}
          onPress={calculate}
          disabled={!canCalculate || calculating}
          activeOpacity={0.8}
        >
          <Text style={styles.calcButtonText}>
            {calculating ? 'Analyzing...' : 'Analyze Deal'}
          </Text>
        </TouchableOpacity>

        {/* Results */}
        {result && (
          <View testID="source-result" style={styles.resultArea}>
            {/* Hero Verdict Card */}
            <View style={[styles.verdictCard, { backgroundColor: VERDICT_CONFIG[result.verdict].bgDark }]}>
              <View style={styles.verdictIconWrap}>
                <Feather name={VERDICT_CONFIG[result.verdict].icon} size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.verdictLabel}>{VERDICT_CONFIG[result.verdict].label}</Text>
              <Text style={styles.verdictMessage}>
                {CONFIDENCE_MESSAGES[result.confidence] || result.confidence}
              </Text>
            </View>

            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricBoxLabel}>Net Profit</Text>
                <Text style={[styles.metricBoxValue, { color: result.net_profit >= 0 ? colors.success : colors.error }]}>
                  ${result.net_profit.toFixed(2)}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricBoxLabel}>ROI</Text>
                <Text style={[styles.metricBoxValue, { color: result.roi >= 0 ? colors.success : colors.error }]}>
                  {result.roi}%
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricBoxLabel}>Margin</Text>
                <Text style={styles.metricBoxValue}>{result.margin}%</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricBoxLabel}>Profit/Day</Text>
                <Text style={styles.metricBoxValue}>${result.profit_per_day}</Text>
              </View>
            </View>

            {/* Historical Context */}
            {(result.platform_context || result.category_context) && (
              <View style={styles.contextCard}>
                <Text style={styles.contextTitle}>Historical Context</Text>
                {result.platform_context && (
                  <View style={styles.contextRow}>
                    <Text style={styles.contextLabel}>{platform}</Text>
                    <View style={styles.contextStats}>
                      <Text style={styles.contextStat}>{result.platform_context.avg_roi}% ROI</Text>
                      <Text style={styles.contextDot}>·</Text>
                      <Text style={styles.contextStat}>{result.platform_context.avg_days}d avg</Text>
                      <Text style={styles.contextDot}>·</Text>
                      <Text style={styles.contextStat}>{result.platform_context.total_sold} sold</Text>
                    </View>
                  </View>
                )}
                {result.category_context && category && (
                  <View style={styles.contextRow}>
                    <Text style={styles.contextLabel}>{category}</Text>
                    <View style={styles.contextStats}>
                      <Text style={styles.contextStat}>{result.category_context.avg_roi}% ROI</Text>
                      <Text style={styles.contextDot}>·</Text>
                      <Text style={styles.contextStat}>{result.category_context.avg_days}d avg</Text>
                      <Text style={styles.contextDot}>·</Text>
                      <Text style={styles.contextStat}>{result.category_context.total_sold} sold</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Thresholds */}
            <View style={styles.thresholdCard}>
              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Break-even Sale</Text>
                <Text style={styles.thresholdValue}>${result.break_even_price.toFixed(2)}</Text>
              </View>
              <View style={styles.thresholdDivider} />
              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Max Buy Price</Text>
                <Text style={styles.thresholdValue}>${result.max_buy_price.toFixed(2)}</Text>
              </View>
              <View style={styles.thresholdDivider} />
              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Min Acceptable Sale</Text>
                <Text style={styles.thresholdValue}>${result.min_acceptable_sale.toFixed(2)}</Text>
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              testID="reset-btn"
              style={styles.resetButton}
              onPress={reset}
              activeOpacity={0.6}
            >
              <Feather name="refresh-cw" size={14} color={colors.textSecondary} />
              <Text style={styles.resetButtonText}>New Calculation</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
  content: {
    paddingHorizontal: spacing.containerPadding,
  },

  // Header
  header: {
    marginBottom: spacing.sectionGap,
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
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Sections
  section: {
    marginBottom: spacing.l,
  },
  label: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  labelOptional: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  smallLabel: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Horizontal Scroll
  horizontalScroll: {
    marginHorizontal: -spacing.containerPadding,
    paddingHorizontal: spacing.containerPadding,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
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

  // Price Input Card
  priceInputCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.cardPaddingLarge,
    marginBottom: spacing.l,
    ...shadows.card,
  },
  priceInputRow: {
    flexDirection: 'row',
  },
  priceInputCol: {
    flex: 1,
  },
  priceInputDivider: {
    width: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.ml,
  },
  priceInputLabel: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  priceInputField: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pricePrefix: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 24,
    color: colors.textTertiary,
    marginRight: 2,
  },
  priceInput: {
    flex: 1,
    fontFamily: 'Mulish_700Bold',
    fontSize: 32,
    color: colors.textPrimary,
    padding: 0,
    letterSpacing: -0.5,
  },

  // Cost Row
  costRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  costCol: {
    flex: 1,
  },
  costLabel: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  costInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    height: 48,
    paddingHorizontal: 14,
    ...shadows.subtle,
  },
  costPrefix: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textTertiary,
    marginRight: 4,
  },
  costInput: {
    flex: 1,
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
  },

  // Calculate Button
  calcButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.pill,
    height: spacing.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sectionGap,
    ...shadows.medium,
  },
  calcButtonDisabled: {
    opacity: 0.35,
  },
  calcButtonText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Result Area
  resultArea: {
    gap: 14,
  },

  // Verdict Card - Hero
  verdictCard: {
    borderRadius: borderRadius.xl,
    paddingVertical: 40,
    alignItems: 'center',
    ...shadows.strong,
  },
  verdictIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  verdictLabel: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 48,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  verdictMessage: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: spacing.cardPadding,
    ...shadows.subtle,
  },
  metricBoxLabel: {
    fontFamily: 'Mulish_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  metricBoxValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  // Context Card
  contextCard: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
    gap: 12,
  },
  contextTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 12,
    color: colors.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contextRow: {
    gap: 4,
  },
  contextLabel: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  contextStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  contextStat: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  contextDot: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 13,
    color: colors.textTertiary,
    marginHorizontal: 6,
  },

  // Threshold Card
  thresholdCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    paddingHorizontal: spacing.cardPadding,
    ...shadows.subtle,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  thresholdDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  thresholdLabel: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  thresholdValue: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
  },

  // Reset Button
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceHighlight,
  },
  resetButtonText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
