import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows, typography, buttonStyles } from '../../src/theme';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';
import { store } from '../../src/store';

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
  buy: { label: 'BUY', icon: 'check', color: colors.success, bgDark: '#2D4A2D' },
  risky: { label: 'RISKY', icon: 'alert-triangle', color: colors.warning, bgDark: '#5C3A1D' },
  skip: { label: 'SKIP', icon: 'x', color: colors.error, bgDark: '#4A2020' },
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
  const router = useRouter();
  const { formatAmount, currency } = useCurrency();
  const [purchasePrice, setPurchasePrice] = useState('');
  const [expectedSale, setExpectedSale] = useState('');
  const [platform, setPlatform] = useState('eBay');
  const [category, setCategory] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showCosts, setShowCosts] = useState(false);

  useEffect(() => {
    store.getLastPlatform().then(setPlatform);
    store.getLastCategory().then(setCategory);
  }, []);

  const canCalculate = purchasePrice && expectedSale && platform;

  const calculate = async () => {
    if (!canCalculate) return;
    setCalculating(true);
    try {
      await store.setLastPlatform(platform);
      if (category) await store.setLastCategory(category);
      
      setResult(await api.sourceCalculate({
        purchase_price: parseFloat(purchasePrice) || 0,
        expected_sale_price: parseFloat(expectedSale) || 0,
        platform: platform.toLowerCase(),
        category,
        shipping_to_acquire: parseFloat(shippingCost) || 0,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setCalculating(false);
    }
  };

  const addToInventory = () => {
    router.push({
      pathname: '/quick-add',
      params: {
        fromSource: 'true',
        purchasePrice: purchasePrice,
        targetPrice: expectedSale,
        platform: platform,
      }
    });
  };

  const reset = () => {
    setPurchasePrice('');
    setExpectedSale('');
    setShippingCost('');
    setResult(null);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        testID="source-screen"
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space[4], paddingBottom: insets.bottom + space[8] }]}
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

        {/* Category Selection */}
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

        {/* Price Inputs Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Purchase Price</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.pricePrefix}>{currency.symbol}</Text>
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
            <View style={styles.priceDivider} />
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Expected Sale</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.pricePrefix}>{currency.symbol}</Text>
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

        {/* Additional Costs Toggle */}
        <TouchableOpacity 
          style={styles.costsToggle} 
          onPress={() => setShowCosts(!showCosts)}
          activeOpacity={0.6}
        >
          <Text style={styles.costsToggleText}>Additional Costs</Text>
          <Feather name={showCosts ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {showCosts && (
          <View style={styles.costsCard}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Shipping to Acquire</Text>
              <View style={styles.costInputWrap}>
                <Text style={styles.costPrefix}>{currency.symbol}</Text>
                <TextInput
                  testID="input-shipping"
                  style={styles.costInput}
                  value={shippingCost}
                  onChangeText={setShippingCost}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </View>
        )}

        {/* Calculate Button */}
        <TouchableOpacity
          testID="calculate-btn"
          style={[buttonStyles.primary, !canCalculate && styles.calcButtonDisabled]}
          onPress={calculate}
          disabled={!canCalculate || calculating}
          activeOpacity={0.8}
        >
          <Feather name="zap" size={18} color={colors.textInverse} />
          <Text style={buttonStyles.primaryText}>
            {calculating ? 'Analyzing...' : 'Analyze Deal'}
          </Text>
        </TouchableOpacity>

        {/* Results */}
        {result && (
          <View testID="source-result" style={styles.resultArea}>
            {/* ─── HERO VERDICT CARD ─── */}
            <View style={[styles.verdictCard, { backgroundColor: VERDICT_CONFIG[result.verdict].bgDark }]}>
              <View style={styles.verdictTop}>
                <View style={styles.verdictIconWrap}>
                  <Feather name={VERDICT_CONFIG[result.verdict].icon as any} size={28} color={colors.textInverse} />
                </View>
                <Text style={styles.verdictLabel}>{VERDICT_CONFIG[result.verdict].label}</Text>
              </View>
              <Text style={styles.verdictMessage}>
                {CONFIDENCE_MESSAGES[result.confidence] || result.confidence}
              </Text>
              
              {/* Key Numbers in Verdict */}
              <View style={styles.verdictNumbers}>
                <View style={styles.verdictStat}>
                  <Text style={styles.verdictStatValue}>{formatAmount(result.net_profit)}</Text>
                  <Text style={styles.verdictStatLabel}>Profit</Text>
                </View>
                <View style={styles.verdictStatDivider} />
                <View style={styles.verdictStat}>
                  <Text style={styles.verdictStatValue}>{result.roi}%</Text>
                  <Text style={styles.verdictStatLabel}>ROI</Text>
                </View>
                <View style={styles.verdictStatDivider} />
                <View style={styles.verdictStat}>
                  <Text style={styles.verdictStatValue}>{result.margin}%</Text>
                  <Text style={styles.verdictStatLabel}>Margin</Text>
                </View>
              </View>
            </View>

            {/* Thresholds Card */}
            <View style={styles.thresholdCard}>
              <View style={styles.thresholdItem}>
                <Text style={styles.thresholdLabel}>Max Buy</Text>
                <Text style={styles.thresholdValue}>{formatAmount(result.max_buy_price)}</Text>
              </View>
              <View style={styles.thresholdDivider} />
              <View style={styles.thresholdItem}>
                <Text style={styles.thresholdLabel}>Break Even</Text>
                <Text style={styles.thresholdValue}>{formatAmount(result.break_even_price)}</Text>
              </View>
              <View style={styles.thresholdDivider} />
              <View style={styles.thresholdItem}>
                <Text style={styles.thresholdLabel}>Min Sale</Text>
                <Text style={styles.thresholdValue}>{formatAmount(result.min_acceptable_sale)}</Text>
              </View>
            </View>

            {/* Historical Context */}
            {(result.platform_context || result.category_context) && (
              <View style={styles.contextCard}>
                <Text style={styles.contextTitle}>Your History</Text>
                {result.platform_context && (
                  <View style={styles.contextRow}>
                    <Text style={styles.contextLabel}>{platform}</Text>
                    <Text style={styles.contextStats}>
                      {result.platform_context.avg_roi}% avg · {result.platform_context.avg_days}d avg · {result.platform_context.total_sold} sold
                    </Text>
                  </View>
                )}
                {result.category_context && category && (
                  <View style={styles.contextRow}>
                    <Text style={styles.contextLabel}>{category}</Text>
                    <Text style={styles.contextStats}>
                      {result.category_context.avg_roi}% avg · {result.category_context.avg_days}d avg · {result.category_context.total_sold} sold
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.resultActions}>
              {result.verdict === 'buy' && (
                <TouchableOpacity
                  testID="add-to-inventory-btn"
                  style={buttonStyles.success}
                  onPress={addToInventory}
                  activeOpacity={0.7}
                >
                  <Feather name="plus" size={18} color={colors.textInverse} />
                  <Text style={buttonStyles.successText}>Add to Inventory</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                testID="reset-btn"
                style={[buttonStyles.secondary, result.verdict !== 'buy' && { flex: 1 }]}
                onPress={reset}
                activeOpacity={0.6}
              >
                <Feather name="refresh-cw" size={16} color={colors.textPrimary} />
                <Text style={buttonStyles.secondaryText}>New Calculation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },

  // Header
  header: {
    marginBottom: space[6],
  },
  title: {
    ...typography.h1,
    marginBottom: space[1],
  },
  subtitle: {
    ...typography.bodyLarge,
  },

  // Sections
  section: {
    marginBottom: space[6],
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: space[3],
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginBottom: space[3],
  },
  labelOptional: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // Chips
  horizontalScroll: {
    marginHorizontal: -spacing.screenPadding,
    paddingHorizontal: spacing.screenPadding,
  },
  chipRow: {
    flexDirection: 'row',
    gap: space[2],
  },
  chip: {
    paddingHorizontal: space[4],
    paddingVertical: space[2] + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
  },

  // Price Card
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[5],
    marginBottom: space[4],
    ...shadows.medium,
  },
  priceRow: {
    flexDirection: 'row',
  },
  priceCol: {
    flex: 1,
  },
  priceDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: space[5],
  },
  priceLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space[2],
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pricePrefix: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize['2xl'],
    color: colors.textTertiary,
    marginRight: 2,
  },
  priceInput: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    color: colors.textPrimary,
    padding: 0,
    letterSpacing: -0.5,
  },

  // Costs Toggle
  costsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    marginBottom: space[4],
    ...shadows.xs,
  },
  costsToggleText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  costsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    marginBottom: space[4],
    ...shadows.sm,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  costInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: space[3],
    height: 40,
  },
  costPrefix: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginRight: space[1],
  },
  costInput: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    padding: 0,
    minWidth: 50,
    textAlign: 'right',
  },

  // Calculate Button
  calcButtonDisabled: {
    opacity: 0.4,
  },

  // Result Area
  resultArea: {
    gap: space[3],
    marginTop: space[6],
  },

  // Verdict Card - Hero
  verdictCard: {
    borderRadius: radius.xl,
    paddingVertical: space[8],
    paddingHorizontal: space[6],
    alignItems: 'center',
    ...shadows.strong,
  },
  verdictTop: {
    alignItems: 'center',
    marginBottom: space[3],
  },
  verdictIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[3],
  },
  verdictLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['4xl'] + 8,
    color: colors.textInverse,
    letterSpacing: 2,
  },
  verdictMessage: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: space[6],
  },
  verdictNumbers: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    paddingVertical: space[4],
  },
  verdictStat: {
    flex: 1,
    alignItems: 'center',
  },
  verdictStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  verdictStatValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textInverse,
    letterSpacing: -0.5,
  },
  verdictStatLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  // Threshold Card
  thresholdCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  thresholdItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space[4],
  },
  thresholdDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  thresholdLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: space[1],
  },
  thresholdValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // Context Card
  contextCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[2],
  },
  contextTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: space[1],
  },
  contextRow: {
    gap: 2,
  },
  contextLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  contextStats: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Result Actions
  resultActions: {
    flexDirection: 'row',
    gap: space[3],
    marginTop: space[2],
  },
});
