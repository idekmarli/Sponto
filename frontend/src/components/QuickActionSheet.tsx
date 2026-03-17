import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../theme';

export interface QuickAction {
  key: string;
  label: string;
  icon: string;
  color?: string;
  destructive?: boolean;
}

interface QuickActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: QuickAction[];
  onAction: (key: string) => void;
}

export function QuickActionSheet({ visible, onClose, title, subtitle, actions, onAction }: QuickActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          {(title || subtitle) && (
            <View style={styles.header}>
              {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {actions.map((action, i) => (
              <TouchableOpacity
                key={action.key}
                testID={`action-${action.key}`}
                style={[styles.actionBtn, i > 0 && styles.actionBtnBorder]}
                onPress={() => { onAction(action.key); onClose(); }}
                activeOpacity={0.6}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.destructive ? colors.errorLight : colors.surfaceHighlight }]}>
                  <Feather
                    name={action.icon as any}
                    size={18}
                    color={action.destructive ? colors.error : (action.color || colors.textPrimary)}
                  />
                </View>
                <Text style={[styles.actionLabel, action.destructive && { color: colors.error }]}>
                  {action.label}
                </Text>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.6}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
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
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.l,
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  actionBtnBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  cancelBtn: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.l,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 16,
    color: colors.textSecondary,
  },
});
