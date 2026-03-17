import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';
import { api } from '../../src/api';

const PLATFORMS = ['eBay', 'Depop', 'Vinted', 'Vestiaire', 'Poshmark', 'Etsy'];

interface CalcResult {
  total_cost_basis: number;
  estimated_fees: number;
  fee_percentage: number;
  net_profit: number;
  roi: number;
  break_even_price: number;
  max_buy_price: number;
  min_acceptable_sale: number;
  verdict: 'buy' | 'risky' | 'skip';
}

export default function SourceScreen() {
  const insets = useSafeAreaInsets();
  const [purchasePrice, setPurchasePrice] = useState('');
  const [expectedSale, setExpectedSale] = useState('');
  const [platform, setPlatform] = useState('eBay');
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
      const res = await api.sourceCalculate({
        purchase_price: parseFloat(purchasePrice) || 0,
        expected_sale_price: parseFloat(expectedSale) || 0,
        platform: platform.toLowerCase(),
        shipping_to_acquire: parseFloat(shippingCost) || 0,
        prep_cost: parseFloat(prepCost) || 0,
        packaging_cost: parseFloat(packagingCost) || 0,
      });
      setResult(res);
    } catch (e) {
      console.error('Source calc error:', e);
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
    setResult(null);
  };

  const verdictConfig = {
    buy: { label: 'Buy', icon: 'check-circle' as const, color: colors.success, bg: '#F0F5EF' },
    risky: { label: 'Risky', icon: 'alert-circle' as const, color: colors.warning, bg: '#FDF5F2' },
    skip: { label: 'Skip', icon: 'x-circle' as const, color: colors.error, bg: '#FDF0F0' },
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
        <Text style={styles.title}>Source Calculator</Text>
        <Text style={styles.subtitle}>Should you buy it?</Text>

        {/* Platform Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Platform</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformScroll}>
            <View style={styles.platformRow}>
              {PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p}
                  testID={`platform-${p.toLowerCase()}`}
                  style={[styles.platformChip, platform === p && styles.platformChipActive]}
                  onPress={() => setPlatform(p)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.platformChipText, platform === p && styles.platformChipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Core Inputs */}
        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Purchase Price</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  testID="input-purchase-price"
                  style={styles.input}
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Expected Sale</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  testID="input-expected-sale"
                  style={styles.input}
                  value={expectedSale}
                  onChangeText={setExpectedSale}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Additional Costs */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Additional Costs</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputThird}>
              <Text style={styles.smallLabel}>Shipping</Text>
              <View style={styles.inputWrapSmall}>
                <Text style={styles.inputPrefixSmall}>$</Text>
                <TextInput
                  testID="input-shipping"
                  style={styles.inputSmall}
                  value={shippingCost}
                  onChangeText={setShippingCost}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
            <View style={styles.inputThird}>
              <Text style={styles.smallLabel}>Prep/Repair</Text>
              <View style={styles.inputWrapSmall}>
                <Text style={styles.inputPrefixSmall}>$</Text>
                <TextInput
                  testID="input-prep"
                  style={styles.inputSmall}
                  value={prepCost}
                  onChangeText={setPrepCost}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
            <View style={styles.inputThird}>
              <Text style={styles.smallLabel}>Packaging</Text>
              <View style={styles.inputWrapSmall}>
                <Text style={styles.inputPrefixSmall}>$</Text>
                <TextInput
                  testID="input-packaging"
                  style={styles.inputSmall}
                  value={packagingCost}
                  onChangeText={setPackagingCost}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          testID="calculate-btn"
          style={[styles.calcBtn, !canCalculate && styles.calcBtnDisabled]}
          onPress={calculate}
          disabled={!canCalculate || calculating}
          activeOpacity={0.8}
        >
          <Text style={styles.calcBtnText}>{calculating ? 'Calculating...' : 'Analyze Deal'}</Text>
        </TouchableOpacity>

        {/* Results */}
        {result && (
          <View testID="source-result" style={styles.resultSection}>
            {/* Verdict */}
            <View style={[styles.verdictCard, { backgroundColor: verdictConfig[result.verdict].bg }]}>
              <Feather name={verdictConfig[result.verdict].icon} size={36} color={verdictConfig[result.verdict].color} />
              <Text style={[styles.verdictLabel, { color: verdictConfig[result.verdict].color }]}>
                {verdictConfig[result.verdict].label}
              </Text>
              <Text style={styles.verdictSub}>
                {result.verdict === 'buy' ? 'This deal meets your targets' :
                 result.verdict === 'risky' ? 'Profitable but below your targets' :
                 'This deal loses money'}
              </Text>
            </View>

            {/* Key Numbers */}
            <View style={styles.resultGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Net Profit</Text>
                <Text style={[styles.resultValue, { color: result.net_profit >= 0 ? colors.success : colors.error }]}>
                  ${result.net_profit.toFixed(2)}
                </Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>ROI</Text>
                <Text style={[styles.resultValue, { color: result.roi >= 0 ? colors.success : colors.error }]}>
                  {result.roi}%
                </Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Total Cost</Text>
                <Text style={styles.resultValue}>${result.total_cost_basis.toFixed(2)}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Est. Fees ({result.fee_percentage}%)</Text>
                <Text style={styles.resultValue}>${result.estimated_fees.toFixed(2)}</Text>
              </View>
            </View>

            {/* Thresholds */}
            <View style={styles.thresholdCard}>
              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Break-even Sale Price</Text>
                <Text style={styles.thresholdValue}>${result.break_even_price.toFixed(2)}</Text>
              </View>
              <View style={styles.thresholdDivider} />
              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Maximum Buy Price</Text>
                <Text style={styles.thresholdValue}>${result.max_buy_price.toFixed(2)}</Text>
              </View>
              <View style={styles.thresholdDivider} />
              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Minimum Acceptable Sale</Text>
                <Text style={styles.thresholdValue}>${result.min_acceptable_sale.toFixed(2)}</Text>
              </View>
            </View>

            {/* Reset */}
            <TouchableOpacity testID="reset-btn" style={styles.resetBtn} onPress={reset} activeOpacity={0.7}>
              <Feather name="refresh-cw" size={16} color={colors.textSecondary} />
              <Text style={styles.resetBtnText}>New Calculation</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.containerPadding },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 32, color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Mulish_400Regular', fontSize: 16, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.l },
  section: { marginBottom: spacing.l },
  label: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.textPrimary, marginBottom: 8 },
  sectionLabel: { fontFamily: 'Mulish_600SemiBold', fontSize: 15, color: colors.textSecondary, marginBottom: 12 },
  smallLabel: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  platformScroll: { marginHorizontal: -spacing.containerPadding, paddingHorizontal: spacing.containerPadding },
  platformRow: { flexDirection: 'row', gap: 8 },
  platformChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  platformChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  platformChipText: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.textSecondary },
  platformChipTextActive: { color: colors.surface },
  inputGroup: { marginBottom: spacing.l },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputHalf: { flex: 1 },
  inputThird: { flex: 1 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border,
    height: 56,
    paddingHorizontal: 16,
  },
  inputWrapSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
    paddingHorizontal: 12,
  },
  inputPrefix: { fontFamily: 'Mulish_600SemiBold', fontSize: 18, color: colors.textTertiary, marginRight: 4 },
  inputPrefixSmall: { fontFamily: 'Mulish_600SemiBold', fontSize: 15, color: colors.textTertiary, marginRight: 4 },
  input: { flex: 1, fontFamily: 'Mulish_700Bold', fontSize: 22, color: colors.textPrimary },
  inputSmall: { flex: 1, fontFamily: 'Mulish_600SemiBold', fontSize: 16, color: colors.textPrimary },
  calcBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.l,
    ...shadows.subtle,
  },
  calcBtnDisabled: { opacity: 0.4 },
  calcBtnText: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.surface },
  resultSection: { gap: spacing.m },
  verdictCard: {
    borderRadius: borderRadius.l,
    padding: spacing.l,
    alignItems: 'center',
    gap: 8,
  },
  verdictLabel: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 36, letterSpacing: -0.5 },
  verdictSub: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resultItem: {
    width: '47%' as any,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  resultLabel: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  resultValue: { fontFamily: 'Mulish_700Bold', fontSize: 22, color: colors.textPrimary },
  thresholdCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  thresholdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  thresholdLabel: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary },
  thresholdValue: { fontFamily: 'SpaceMono_400Regular', fontSize: 16, color: colors.textPrimary },
  thresholdDivider: { height: 1, backgroundColor: colors.divider },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceHighlight,
  },
  resetBtnText: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.textSecondary },
});
