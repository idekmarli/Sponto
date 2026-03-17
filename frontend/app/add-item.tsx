import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../src/theme';
import { api } from '../src/api';

const STEPS = ['Info', 'Sourcing', 'Listing'];
const CATEGORIES = ['Bags', 'Outerwear', 'Knitwear', 'Footwear', 'Accessories', 'Dresses', 'Tops', 'Trousers'];
const CONDITIONS = ['New with Tags', 'Excellent', 'Very Good', 'Good', 'Fair'];
const PLATFORMS = ['ebay', 'depop', 'vinted', 'vestiaire', 'poshmark', 'etsy'];

export default function AddItemScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState('');
  const [source, setSource] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [prepCost, setPrepCost] = useState('');
  const [dateAcquired, setDateAcquired] = useState(new Date().toISOString().split('T')[0]);
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
        status: draft ? 'sourced' : 'sourced',
        is_draft: draft,
        photos: [],
      });
      router.back();
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, i) => (
        <TouchableOpacity key={s} style={styles.stepItem} onPress={() => setStep(i)} activeOpacity={0.7}>
          <View style={[styles.stepDot, i <= step && styles.stepDotActive]} />
          <Text style={[styles.stepText, i === step && styles.stepTextActive]}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Item Information</Text>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Title *</Text>
        <TextInput
          testID="input-title"
          style={styles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Acne Studios Musubi Bag"
          placeholderTextColor={colors.textTertiary}
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
          placeholderTextColor={colors.textTertiary}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)} activeOpacity={0.7}>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.rowFields}>
        <View style={styles.halfField}>
          <Text style={styles.fieldLabel}>Size</Text>
          <TextInput testID="input-size" style={styles.textInput} value={size} onChangeText={setSize} placeholder="e.g. M, 38, OS" placeholderTextColor={colors.textTertiary} />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.fieldLabel}>Condition</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CONDITIONS.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, condition === c && styles.chipActive]} onPress={() => setCondition(c)} activeOpacity={0.7}>
                  <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Sourcing Details</Text>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Source</Text>
        <TextInput testID="input-source" style={styles.textInput} value={source} onChangeText={setSource} placeholder="e.g. Thrift Store, Estate Sale" placeholderTextColor={colors.textTertiary} />
      </View>
      <View style={styles.rowFields}>
        <View style={styles.halfField}>
          <Text style={styles.fieldLabel}>Purchase Price</Text>
          <View style={styles.priceInput}>
            <Text style={styles.pricePrefix}>$</Text>
            <TextInput testID="input-purchase" style={styles.priceField} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} />
          </View>
        </View>
        <View style={styles.halfField}>
          <Text style={styles.fieldLabel}>Shipping to Acquire</Text>
          <View style={styles.priceInput}>
            <Text style={styles.pricePrefix}>$</Text>
            <TextInput testID="input-ship-cost" style={styles.priceField} value={shippingCost} onChangeText={setShippingCost} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} />
          </View>
        </View>
      </View>
      <View style={styles.rowFields}>
        <View style={styles.halfField}>
          <Text style={styles.fieldLabel}>Prep / Repair Cost</Text>
          <View style={styles.priceInput}>
            <Text style={styles.pricePrefix}>$</Text>
            <TextInput testID="input-prep-cost" style={styles.priceField} value={prepCost} onChangeText={setPrepCost} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} />
          </View>
        </View>
        <View style={styles.halfField}>
          <Text style={styles.fieldLabel}>Date Acquired</Text>
          <TextInput testID="input-date" style={styles.textInput} value={dateAcquired} onChangeText={setDateAcquired} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          testID="input-notes"
          style={[styles.textInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any notes about this item..."
          placeholderTextColor={colors.textTertiary}
          multiline
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Listing Setup</Text>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Target List Price</Text>
        <View style={[styles.priceInput, { height: 56 }]}>
          <Text style={[styles.pricePrefix, { fontSize: 20 }]}>$</Text>
          <TextInput testID="input-target-price" style={[styles.priceField, { fontSize: 24 }]} value={targetPrice} onChangeText={setTargetPrice} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} />
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Intended Platforms</Text>
        <View style={styles.chipRow}>
          {PLATFORMS.map(p => (
            <TouchableOpacity key={p} style={[styles.chip, selectedPlatforms.includes(p) && styles.chipActive]} onPress={() => togglePlatform(p)} activeOpacity={0.7}>
              <Text style={[styles.chipText, selectedPlatforms.includes(p) && styles.chipTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Cost Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Purchase</Text>
          <Text style={styles.summaryValue}>${purchasePrice || '0'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={styles.summaryValue}>${shippingCost || '0'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Prep</Text>
          <Text style={styles.summaryValue}>${prepCost || '0'}</Text>
        </View>
        <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 8, marginTop: 4 }]}>
          <Text style={[styles.summaryLabel, { fontFamily: 'Mulish_700Bold' }]}>Total Cost</Text>
          <Text style={[styles.summaryValue, { fontFamily: 'Mulish_700Bold' }]}>
            ${((parseFloat(purchasePrice) || 0) + (parseFloat(shippingCost) || 0) + (parseFloat(prepCost) || 0)).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View testID="add-item-screen" style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="close-btn" onPress={() => router.back()} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Item</Text>
          <TouchableOpacity testID="save-draft-btn" onPress={() => saveItem(true)} disabled={saving} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.draftText}>Draft</Text>
          </TouchableOpacity>
        </View>

        {renderStepIndicator()}

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {step > 0 && (
            <TouchableOpacity testID="prev-step-btn" style={styles.prevBtn} onPress={() => setStep(s => s - 1)} activeOpacity={0.7}>
              <Text style={styles.prevBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 2 ? (
            <TouchableOpacity testID="next-step-btn" style={[styles.nextBtn, step === 0 && { flex: 1 }]} onPress={() => setStep(s => s + 1)} activeOpacity={0.7}>
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity testID="save-item-btn" style={styles.saveBtn} onPress={() => saveItem(false)} disabled={saving} activeOpacity={0.7}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Item'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.containerPadding, marginBottom: 16 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Mulish_700Bold', fontSize: 17, color: colors.textPrimary },
  draftText: { fontFamily: 'Mulish_600SemiBold', fontSize: 15, color: colors.accent },
  stepIndicator: { flexDirection: 'row', paddingHorizontal: spacing.containerPadding, gap: 16, marginBottom: 20 },
  stepItem: { flex: 1, alignItems: 'center', gap: 6 },
  stepDot: { width: '100%', height: 3, borderRadius: 2, backgroundColor: colors.border },
  stepDotActive: { backgroundColor: colors.primary },
  stepText: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textTertiary },
  stepTextActive: { fontFamily: 'Mulish_600SemiBold', color: colors.textPrimary },
  scrollContent: { flex: 1 },
  stepContent: { paddingHorizontal: spacing.containerPadding, gap: 16 },
  stepTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: colors.textPrimary, marginBottom: 4 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.textSecondary },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border,
    height: 50,
    paddingHorizontal: 16,
    fontFamily: 'Mulish_400Regular',
    fontSize: 16,
    color: colors.textPrimary,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: 'Mulish_600SemiBold', fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.surface },
  rowFields: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1, gap: 6 },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border,
    height: 50,
    paddingHorizontal: 14,
  },
  pricePrefix: { fontFamily: 'Mulish_600SemiBold', fontSize: 16, color: colors.textTertiary, marginRight: 4 },
  priceField: { flex: 1, fontFamily: 'Mulish_600SemiBold', fontSize: 16, color: colors.textPrimary },
  summaryCard: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
    gap: 8,
    marginTop: 8,
  },
  summaryTitle: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.textPrimary, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontFamily: 'SpaceMono_400Regular', fontSize: 14, color: colors.textPrimary },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.containerPadding,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
  prevBtn: { flex: 1, height: 52, borderRadius: borderRadius.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  prevBtnText: { fontFamily: 'Mulish_600SemiBold', fontSize: 16, color: colors.textSecondary },
  nextBtn: { flex: 2, height: 52, borderRadius: borderRadius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.surface },
  saveBtn: { flex: 2, height: 52, borderRadius: borderRadius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.surface },
});
