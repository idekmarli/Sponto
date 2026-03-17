import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface SoldModalProps {
  visible: boolean;
  onClose: () => void;
  item: { id: string; title: string; target_list_price: number; total_cost_basis: number } | null;
  onConfirm: (soldPrice: number) => Promise<void>;
}

export function SoldModal({ visible, onClose, item, onConfirm }: SoldModalProps) {
  const insets = useSafeAreaInsets();
  const [soldPrice, setSoldPrice] = useState('');
  const [saving, setSaving] = useState(false);

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
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.successIcon}>
              <Feather name="dollar-sign" size={24} color={colors.success} />
            </View>
            <Text style={styles.title}>Mark as Sold</Text>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          </View>

          {/* Price Input */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Sold Price</Text>
            <View style={styles.priceInputRow}>
              <Text style={styles.pricePrefix}>$</Text>
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

          {/* Profit Preview */}
          {price > 0 && (
            <View style={[styles.profitPreview, { backgroundColor: profitPositive ? colors.successLight : colors.errorLight }]}>
              <Text style={styles.profitLabel}>Net Profit</Text>
              <Text style={[styles.profitValue, { color: profitPositive ? colors.success : colors.error }]}>
                {profitPositive ? '+' : ''}${profit.toFixed(2)}
              </Text>
            </View>
          )}

          {/* Actions */}
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmText}>Confirm Sale</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: 8,
    paddingHorizontal: spacing.containerPadding,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemTitle: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceCard: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.l,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 28,
    color: colors.textTertiary,
    marginRight: 4,
  },
  priceInput: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius.l,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  profitLabel: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  profitValue: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 15,
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: colors.success,
    borderRadius: borderRadius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.medium,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
