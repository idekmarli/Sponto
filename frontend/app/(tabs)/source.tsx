import React, { useState } from 'react';
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
    } catch (e) { console.error('Source calc error:', e); }
    finally { setCalculating(false); }
  };

  const reset = () => {
    setPurchasePrice(''); setExpectedSale(''); setShippingCost('');
    setPrepCost(''); setPackagingCost(''); setResult(null);
  };

  const verdictConfig = {
    buy: { label: 'Buy', icon: 'check' as const, color: colors.success, bg: '#EFF3EE', tagline: 'This deal meets your targets' },
    risky: { label: 'Risky', icon: 'alert-circle' as const, color: colors.warning, bg: '#F7EFEB', tagline: 'Profitable but below targets' },
    skip: { label: 'Skip', icon: 'x' as const, color: colors.error, bg: '#F5EAEA', tagline: 'This deal loses money' },
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        testID="source-screen"
        style={s.container}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={s.title}>Source</Text>
        <Text style={s.subtitle}>Should you buy it?</Text>

        {/* Platform */}
        <View style={s.section}>
          <Text style={s.label}>Platform</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.platformScroll}>
            <View style={s.platformRow}>
              {PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p}
                  testID={`platform-${p.toLowerCase()}`}
                  style={[s.platformChip, platform === p && s.platformChipActive]}
                  onPress={() => setPlatform(p)}
                  activeOpacity={0.6}
                >
                  <Text style={[s.platformText, platform === p && s.platformTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Core Inputs */}
        <View style={s.coreInputs}>
          <View style={s.inputCol}>
            <Text style={s.inputLabel}>Purchase Price</Text>
            <View style={s.bigInputWrap}>
              <Text style={s.bigPrefix}>$</Text>
              <TextInput testID="input-purchase-price" style={s.bigInput} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} />
            </View>
          </View>
          <View style={s.inputDivider} />
          <View style={s.inputCol}>
            <Text style={s.inputLabel}>Expected Sale</Text>
            <View style={s.bigInputWrap}>
              <Text style={s.bigPrefix}>$</Text>
              <TextInput testID="input-expected-sale" style={s.bigInput} value={expectedSale} onChangeText={setExpectedSale} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} />
            </View>
          </View>
        </View>

        {/* Additional Costs */}
        <View style={s.section}>
          <Text style={s.subLabel}>Additional Costs</Text>
          <View style={s.smallInputRow}>
            {[
              { label: 'Shipping', val: shippingCost, set: setShippingCost, tid: 'input-shipping' },
              { label: 'Prep/Repair', val: prepCost, set: setPrepCost, tid: 'input-prep' },
              { label: 'Packaging', val: packagingCost, set: setPackagingCost, tid: 'input-packaging' },
            ].map((f) => (
              <View key={f.tid} style={s.smallInputCol}>
                <Text style={s.smallLabel}>{f.label}</Text>
                <View style={s.smallInputWrap}>
                  <Text style={s.smallPrefix}>$</Text>
                  <TextInput testID={f.tid} style={s.smallInput} value={f.val} onChangeText={f.set} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          testID="calculate-btn"
          style={[s.calcBtn, !canCalculate && s.calcBtnDisabled]}
          onPress={calculate}
          disabled={!canCalculate || calculating}
          activeOpacity={0.7}
        >
          <Text style={s.calcBtnText}>{calculating ? 'Analyzing...' : 'Analyze Deal'}</Text>
        </TouchableOpacity>

        {/* Results */}
        {result && (
          <View testID="source-result" style={s.resultArea}>
            {/* Verdict */}
            <View style={[s.verdictCard, { backgroundColor: verdictConfig[result.verdict].bg }]}>
              <View style={[s.verdictIcon, { backgroundColor: verdictConfig[result.verdict].color }]}>
                <Feather name={verdictConfig[result.verdict].icon} size={28} color="#FFFFFF" />
              </View>
              <Text style={[s.verdictLabel, { color: verdictConfig[result.verdict].color }]}>
                {verdictConfig[result.verdict].label}
              </Text>
              <Text style={s.verdictTagline}>{verdictConfig[result.verdict].tagline}</Text>
            </View>

            {/* Key Numbers */}
            <View style={s.resultRow}>
              <View style={s.resultCard}>
                <Text style={s.resultCardLabel}>Net Profit</Text>
                <Text style={[s.resultCardValue, { color: result.net_profit >= 0 ? colors.success : colors.error }]}>
                  ${result.net_profit.toFixed(2)}
                </Text>
              </View>
              <View style={s.resultCard}>
                <Text style={s.resultCardLabel}>ROI</Text>
                <Text style={[s.resultCardValue, { color: result.roi >= 0 ? colors.success : colors.error }]}>
                  {result.roi}%
                </Text>
              </View>
            </View>
            <View style={s.resultRow}>
              <View style={s.resultCard}>
                <Text style={s.resultCardLabel}>Total Cost</Text>
                <Text style={s.resultCardValue}>${result.total_cost_basis.toFixed(2)}</Text>
              </View>
              <View style={s.resultCard}>
                <Text style={s.resultCardLabel}>Est. Fees</Text>
                <Text style={s.resultCardValue}>${result.estimated_fees.toFixed(2)}</Text>
              </View>
            </View>

            {/* Thresholds */}
            <View style={s.thresholdCard}>
              {[
                { label: 'Break-even Sale', value: result.break_even_price },
                { label: 'Max Buy Price', value: result.max_buy_price },
                { label: 'Min Acceptable Sale', value: result.min_acceptable_sale },
              ].map((t, i) => (
                <View key={i}>
                  <View style={s.thresholdRow}>
                    <Text style={s.thresholdLabel}>{t.label}</Text>
                    <Text style={s.thresholdValue}>${t.value.toFixed(2)}</Text>
                  </View>
                  {i < 2 && <View style={s.thresholdDivider} />}
                </View>
              ))}
            </View>

            {/* Reset */}
            <TouchableOpacity testID="reset-btn" style={s.resetBtn} onPress={reset} activeOpacity={0.6}>
              <Feather name="refresh-cw" size={14} color={colors.textSecondary} />
              <Text style={s.resetBtnText}>New Calculation</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.containerPadding },

  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 34, color: colors.textPrimary, letterSpacing: -0.8 },
  subtitle: { fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.sectionGap },

  section: { marginBottom: spacing.l },
  label: { fontFamily: 'Mulish_600SemiBold', fontSize: 13, color: colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 10 },
  subLabel: { fontFamily: 'Mulish_600SemiBold', fontSize: 12, color: colors.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  smallLabel: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textSecondary, marginBottom: 6 },

  platformScroll: { marginHorizontal: -spacing.containerPadding, paddingHorizontal: spacing.containerPadding },
  platformRow: { flexDirection: 'row', gap: 8 },
  platformChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: borderRadius.pill, backgroundColor: colors.surface, ...shadows.subtle },
  platformChipActive: { backgroundColor: colors.textPrimary },
  platformText: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.textSecondary },
  platformTextActive: { color: '#FFFFFF' },

  coreInputs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: 20,
    marginBottom: spacing.l,
    ...shadows.card,
  },
  inputCol: { flex: 1 },
  inputDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginHorizontal: 16 },
  inputLabel: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textSecondary, marginBottom: 8, letterSpacing: 0.2 },
  bigInputWrap: { flexDirection: 'row', alignItems: 'baseline' },
  bigPrefix: { fontFamily: 'Mulish_400Regular', fontSize: 22, color: colors.textTertiary, marginRight: 2 },
  bigInput: { flex: 1, fontFamily: 'Mulish_700Bold', fontSize: 28, color: colors.textPrimary, padding: 0, letterSpacing: -0.5 },

  smallInputRow: { flexDirection: 'row', gap: 10 },
  smallInputCol: { flex: 1 },
  smallInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.m, height: 46, paddingHorizontal: 12, ...shadows.subtle },
  smallPrefix: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textTertiary, marginRight: 4 },
  smallInput: { flex: 1, fontFamily: 'Mulish_600SemiBold', fontSize: 15, color: colors.textPrimary, padding: 0 },

  calcBtn: { backgroundColor: colors.textPrimary, borderRadius: borderRadius.pill, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sectionGap, ...shadows.medium },
  calcBtnDisabled: { opacity: 0.3 },
  calcBtnText: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: '#FFFFFF', letterSpacing: 0.3 },

  resultArea: { gap: 12 },
  verdictCard: { borderRadius: borderRadius.xl, paddingVertical: 36, alignItems: 'center', gap: 12, ...shadows.card },
  verdictIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  verdictLabel: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 42, letterSpacing: -1 },
  verdictTagline: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary },

  resultRow: { flexDirection: 'row', gap: 10 },
  resultCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.m, padding: 16, ...shadows.subtle },
  resultCardLabel: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textSecondary, letterSpacing: 0.2, marginBottom: 6 },
  resultCardValue: { fontFamily: 'Mulish_700Bold', fontSize: 24, color: colors.textPrimary, letterSpacing: -0.5 },

  thresholdCard: { backgroundColor: colors.surface, borderRadius: borderRadius.l, paddingHorizontal: 18, ...shadows.subtle },
  thresholdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  thresholdLabel: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary },
  thresholdValue: { fontFamily: 'SpaceMono_400Regular', fontSize: 15, color: colors.textPrimary },
  thresholdDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },

  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: borderRadius.pill, backgroundColor: colors.surfaceHighlight },
  resetBtnText: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.textSecondary },
});
