import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../src/theme';
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

  const togglePlatform = (p: string) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const saveItem = async (draft = false) => {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a title'); return; }
    setSaving(true);
    try {
      await api.createItem({
        title: title.trim(), brand: brand.trim(), category, size: size.trim(), condition,
        source: source.trim(), purchase_price: parseFloat(purchasePrice) || 0,
        shipping_to_acquire: parseFloat(shippingCost) || 0, prep_cost: parseFloat(prepCost) || 0,
        date_acquired: dateAcquired, target_list_price: parseFloat(targetPrice) || 0,
        platforms: selectedPlatforms, notes: notes.trim(), status: 'sourced', is_draft: draft, photos: [],
      });
      router.back();
    } catch (e) { Alert.alert('Error', 'Failed to save item'); }
    finally { setSaving(false); }
  };

  const totalCost = (parseFloat(purchasePrice) || 0) + (parseFloat(shippingCost) || 0) + (parseFloat(prepCost) || 0);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View testID="add-item-screen" style={[s.container, { paddingTop: insets.top + 8 }]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity testID="close-btn" onPress={() => router.back()} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Item</Text>
          <TouchableOpacity testID="save-draft-btn" onPress={() => saveItem(true)} disabled={saving}><Text style={s.draftText}>Draft</Text></TouchableOpacity>
        </View>

        {/* Steps */}
        <View style={s.steps}>
          {STEPS.map((label, i) => (
            <TouchableOpacity key={label} style={s.stepItem} onPress={() => setStep(i)} activeOpacity={0.7}>
              <View style={[s.stepBar, i <= step && s.stepBarActive]} />
              <Text style={[s.stepLabel, i === step && s.stepLabelActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Item Information</Text>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Title</Text>
                <TextInput testID="input-title" style={s.textInput} value={title} onChangeText={setTitle} placeholder="e.g. Acne Studios Musubi Bag" placeholderTextColor={colors.textTertiary} />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Brand</Text>
                <TextInput testID="input-brand" style={s.textInput} value={brand} onChangeText={setBrand} placeholder="e.g. Acne Studios" placeholderTextColor={colors.textTertiary} />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Category</Text>
                <View style={s.chipRow}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)} activeOpacity={0.6}>
                      <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={s.row}>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Size</Text>
                  <TextInput testID="input-size" style={s.textInput} value={size} onChangeText={setSize} placeholder="M, 38, OS" placeholderTextColor={colors.textTertiary} />
                </View>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Condition</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={s.chipRow}>
                      {CONDITIONS.map(c => (
                        <TouchableOpacity key={c} style={[s.chip, condition === c && s.chipActive]} onPress={() => setCondition(c)} activeOpacity={0.6}>
                          <Text style={[s.chipText, condition === c && s.chipTextActive]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Sourcing Details</Text>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Source</Text>
                <TextInput testID="input-source" style={s.textInput} value={source} onChangeText={setSource} placeholder="Thrift Store, Estate Sale..." placeholderTextColor={colors.textTertiary} />
              </View>
              <View style={s.row}>
                <View style={s.halfField}><Text style={s.fieldLabel}>Purchase Price</Text>
                  <View style={s.priceWrap}><Text style={s.prefix}>$</Text><TextInput testID="input-purchase" style={s.priceInput} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} /></View>
                </View>
                <View style={s.halfField}><Text style={s.fieldLabel}>Shipping</Text>
                  <View style={s.priceWrap}><Text style={s.prefix}>$</Text><TextInput testID="input-ship-cost" style={s.priceInput} value={shippingCost} onChangeText={setShippingCost} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} /></View>
                </View>
              </View>
              <View style={s.field}><Text style={s.fieldLabel}>Prep / Repair Cost</Text>
                <View style={s.priceWrap}><Text style={s.prefix}>$</Text><TextInput testID="input-prep-cost" style={s.priceInput} value={prepCost} onChangeText={setPrepCost} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} /></View>
              </View>
              <View style={s.field}><Text style={s.fieldLabel}>Notes</Text>
                <TextInput testID="input-notes" style={[s.textInput, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]} value={notes} onChangeText={setNotes} placeholder="Any notes..." placeholderTextColor={colors.textTertiary} multiline />
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Listing Setup</Text>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Target List Price</Text>
                <View style={[s.priceWrap, { height: 60 }]}>
                  <Text style={[s.prefix, { fontSize: 22 }]}>$</Text>
                  <TextInput testID="input-target-price" style={[s.priceInput, { fontSize: 28 }]} value={targetPrice} onChangeText={setTargetPrice} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textTertiary} />
                </View>
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Platforms</Text>
                <View style={s.chipRow}>
                  {PLATFORMS.map(p => (
                    <TouchableOpacity key={p} style={[s.chip, selectedPlatforms.includes(p) && s.chipActive]} onPress={() => togglePlatform(p)} activeOpacity={0.6}>
                      <Text style={[s.chipText, selectedPlatforms.includes(p) && s.chipTextActive]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={s.summary}>
                <Text style={s.summaryTitle}>Cost Summary</Text>
                {[
                  { l: 'Purchase', v: purchasePrice || '0' },
                  { l: 'Shipping', v: shippingCost || '0' },
                  { l: 'Prep', v: prepCost || '0' },
                ].map((r, i) => (
                  <View key={i} style={s.summaryRow}><Text style={s.summaryLabel}>{r.l}</Text><Text style={s.summaryValue}>${r.v}</Text></View>
                ))}
                <View style={s.summaryDivider} />
                <View style={s.summaryRow}>
                  <Text style={[s.summaryLabel, { fontFamily: 'Mulish_700Bold' }]}>Total</Text>
                  <Text style={[s.summaryValue, { fontFamily: 'Mulish_700Bold', fontSize: 17 }]}>${totalCost.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom */}
        <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {step > 0 && (
            <TouchableOpacity testID="prev-step-btn" style={s.prevBtn} onPress={() => setStep(s2 => s2 - 1)} activeOpacity={0.6}>
              <Text style={s.prevText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 2 ? (
            <TouchableOpacity testID="next-step-btn" style={[s.nextBtn, step === 0 && { flex: 1 }]} onPress={() => setStep(s2 => s2 + 1)} activeOpacity={0.7}>
              <Text style={s.nextText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity testID="save-item-btn" style={s.nextBtn} onPress={() => saveItem(false)} disabled={saving} activeOpacity={0.7}>
              <Text style={s.nextText}>{saving ? 'Saving...' : 'Save Item'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.containerPadding, marginBottom: 16 },
  closeBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.textPrimary },
  draftText: { fontFamily: 'Mulish_600SemiBold', fontSize: 14, color: colors.accent },
  steps: { flexDirection: 'row', paddingHorizontal: spacing.containerPadding, gap: 12, marginBottom: 24 },
  stepItem: { flex: 1, gap: 6, alignItems: 'center' },
  stepBar: { width: '100%', height: 3, borderRadius: 2, backgroundColor: colors.border },
  stepBarActive: { backgroundColor: colors.textPrimary },
  stepLabel: { fontFamily: 'Mulish_400Regular', fontSize: 11, color: colors.textTertiary, letterSpacing: 0.3 },
  stepLabelActive: { fontFamily: 'Mulish_700Bold', color: colors.textPrimary },
  scroll: { flex: 1 },
  stepContent: { paddingHorizontal: spacing.containerPadding, gap: 18 },
  stepTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  field: { gap: 8 },
  fieldLabel: { fontFamily: 'Mulish_600SemiBold', fontSize: 12, color: colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  textInput: { backgroundColor: colors.surface, borderRadius: borderRadius.m, height: 50, paddingHorizontal: 16, fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textPrimary, ...shadows.subtle },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: borderRadius.pill, backgroundColor: colors.surface, ...shadows.subtle },
  chipActive: { backgroundColor: colors.textPrimary },
  chipText: { fontFamily: 'Mulish_600SemiBold', fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: '#FFFFFF' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1, gap: 8 },
  priceWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.m, height: 50, paddingHorizontal: 14, ...shadows.subtle },
  prefix: { fontFamily: 'Mulish_400Regular', fontSize: 16, color: colors.textTertiary, marginRight: 4 },
  priceInput: { flex: 1, fontFamily: 'Mulish_700Bold', fontSize: 17, color: colors.textPrimary, padding: 0 },
  summary: { backgroundColor: colors.surfaceHighlight, borderRadius: borderRadius.l, padding: 18, gap: 8 },
  summaryTitle: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: colors.textPrimary, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontFamily: 'SpaceMono_400Regular', fontSize: 14, color: colors.textPrimary },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 4 },
  bottom: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.containerPadding, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  prevBtn: { flex: 1, height: 52, borderRadius: borderRadius.pill, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  prevText: { fontFamily: 'Mulish_600SemiBold', fontSize: 15, color: colors.textSecondary },
  nextBtn: { flex: 2, height: 52, borderRadius: borderRadius.pill, backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center' },
  nextText: { fontFamily: 'Mulish_700Bold', fontSize: 15, color: '#FFFFFF' },
});
