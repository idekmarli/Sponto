import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, radius, fontFamily, fontSize, shadows, iconSize } from '../theme';
import { useCurrency } from '../currency';
import { Celebration } from './Celebration';

interface SoldModalProps {
  visible: boolean;
  onClose: () => void;
  item: { id: string; title: string; target_list_price: number; total_cost_basis: number } | null;
  onConfirm: (soldPrice: number) => Promise<void>;
}

export function SoldModal({ visible, onClose, item, onConfirm }: SoldModalProps) {
  const insets = useSafeAreaInsets();
  const { currency, formatAmount } = useCurrency();
  const [soldPrice, setSoldPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationProfit, setCelebrationProfit] = useState(0);

  React.useEffect(() => {
    if (visible && item) {
      setSoldPrice(String(item.target_list_price || ''));
    }
  }, [visible, item]);

  const price = parseFloat(soldPrice) || 0;
  const profit = price - (item?.total_cost_basis || 0);
  const profitPositive = profit >= 0;

  const handleConfirm = async () => {
    if (price <= 0 || saving) return;
    setSaving(true);
    try {
      await onConfirm(price);
      setCelebrationProfit(profit);
      setShowCelebration(true);
    } catch (e) {
      console.error(e);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    onClose();
  };

  if (!item) return null;

  return (
    <>
      <Modal visible={visible && !showCelebration} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.successIcon}>
                <Feather name="check" size={iconSize.lg} color={colors.success} />
              </View>
              <Text style={styles.title}>Mark as Sold</Text>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            </View>

            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Sold Price</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.pricePrefix}>{currency.symbol}</Text>
                <TextInput
                  testID="sold-price-input"
                  style={styles.priceInput}
                  value={soldPrice}
                  onChangeText={setSoldPrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  selectTextOnFocus
                />
              </View>
            </View>

            {price > 0 && (
              <View style={[styles.profitPreview, { backgroundColor: profitPositive ? colors.successLight : colors.errorLight }]}>
                <Text style={styles.profitLabel}>Net Profit</Text>
                <Text style={[styles.profitValue, { color: profitPositive ? colors.success : colors.error }]}>
                  {profitPositive ? '+' : ''}{formatAmount(profit)}
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.6}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="confirm-sold-btn"
                style={[styles.confirmBtn, price <= 0 && styles.confirmBtnDisabled]}
                onPress={handleConfirm}
                disabled={price <= 0 || saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <>
                    <Feather name="check" size={iconSize.md} color={colors.textInverse} />
                    <Text style={styles.confirmText}>Confirm Sale</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Celebration
        visible={showCelebration}
        message="Sale Complete!"
        subMessage={celebrationProfit >= 0 ? `+${formatAmount(celebrationProfit)} profit` : `${formatAmount(celebrationProfit)} loss`}
        onComplete={handleCelebrationComplete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: space[2], paddingHorizontal: space[5] },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[5] },
  header: { alignItems: 'center', marginBottom: space[6] },
  successIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: space[3] },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.xl, color: colors.textPrimary, marginBottom: space[1] },
  itemTitle: { fontFamily: fontFamily.regular, fontSize: fontSize.md, color: colors.textSecondary },
  priceCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: space[5], alignItems: 'center', marginBottom: space[3] },
  priceLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: space[2] },
  priceInputRow: { flexDirection: 'row', alignItems: 'baseline' },
  pricePrefix: { fontFamily: fontFamily.regular, fontSize: fontSize['2xl'], color: colors.textTertiary, marginRight: space[1] },
  priceInput: { fontFamily: fontFamily.bold, fontSize: fontSize['5xl'], color: colors.textPrimary, padding: 0, minWidth: 100, textAlign: 'center', letterSpacing: -1 },
  profitPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: radius.lg, paddingVertical: space[4], paddingHorizontal: space[4], marginBottom: space[5] },
  profitLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.textSecondary },
  profitValue: { fontFamily: fontFamily.bold, fontSize: fontSize.xl, letterSpacing: -0.3 },
  actions: { flexDirection: 'row', gap: space[3] },
  cancelBtn: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.full, paddingVertical: space[4], alignItems: 'center' },
  cancelText: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.textSecondary },
  confirmBtn: { flex: 2, flexDirection: 'row', backgroundColor: colors.success, borderRadius: radius.full, paddingVertical: space[4], alignItems: 'center', justifyContent: 'center', gap: space[2], ...shadows.md },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmText: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.textInverse },
});
