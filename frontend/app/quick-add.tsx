import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../src/theme';
import { api } from '../src/api';
import { store } from '../src/store';

const PLATFORMS = ['eBay', 'Depop', 'Vinted', 'Vestiaire', 'Poshmark', 'Etsy'];

// Quick Add - Single screen, minimal fields for fast entry
export default function QuickAddScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ fromSource?: string; purchasePrice?: string; targetPrice?: string; platform?: string }>();
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(params.purchasePrice || '');
  const [targetPrice, setTargetPrice] = useState(params.targetPrice || '');
  const [platform, setPlatform] = useState(params.platform || 'eBay');

  // Load last used platform
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
        // Reset form for another entry
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View testID="quick-add-screen" style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) }]}>
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
          <Text style={styles.headerTitle}>Quick Add</Text>
          <TouchableOpacity
            testID="full-form-btn"
            onPress={() => router.replace('/add-item')}
            activeOpacity={0.6}
          >
            <Text style={styles.fullFormText}>Full Form</Text>
          </TouchableOpacity>
        </View>

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

          {/* Brand (Optional) */}
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
                  <Text style={styles.pricePrefix}>$</Text>
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
                  <Text style={styles.pricePrefix}>$</Text>
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
                  {potentialProfit >= 0 ? '+' : ''}${potentialProfit.toFixed(0)}
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
            <Text style={[styles.addAnotherText, !canSave && styles.textDisabled]}>Save & Add Another</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="save-btn"
            style={[styles.saveBtn, !canSave && styles.btnDisabled]}
            onPress={() => saveItem(false)}
            disabled={!canSave || saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="check" size={18} color="#FFFFFF" />
                <Text style={styles.saveText}>Save Item</Text>
              </>
            )}
          </TouchableOpacity>
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
    paddingHorizontal: spacing.containerPadding,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  fullFormText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.accent,
  },

  // Scroll
  scroll: { flex: 1 },

  // Source Banner
  sourceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.m,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  sourceBannerText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 13,
    color: colors.success,
  },

  // Fields
  field: { marginBottom: 20 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  optionalText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 10,
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

  // Price Card
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    overflow: 'hidden',
    marginBottom: 20,
    ...shadows.card,
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
    fontFamily: 'Mulish_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pricePrefix: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 20,
    color: colors.textTertiary,
    marginRight: 2,
  },
  priceInput: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 28,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  profitLabel: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  profitValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },

  // Platform
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  platformChipActive: {
    backgroundColor: colors.textPrimary,
  },
  platformText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  platformTextActive: {
    color: '#FFFFFF',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  addAnotherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: spacing.buttonHeight,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  addAnotherText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: spacing.buttonHeight,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.textPrimary,
    ...shadows.medium,
  },
  saveText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});
