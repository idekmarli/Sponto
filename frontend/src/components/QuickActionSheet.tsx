import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, radius, fontFamily, fontSize, shadows, iconSize } from '../theme';

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
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
          <View style={styles.handle} />

          {(title || subtitle) && (
            <View style={styles.header}>
              {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>}
            </View>
          )}

          <View style={styles.actions}>
            {actions.map((action, i) => (
              <TouchableOpacity
                key={action.key}
                testID={`action-${action.key}`}
                style={[styles.actionBtn, i > 0 && styles.actionBtnBorder]}
                onPress={() => { onAction(action.key); onClose(); }}
                activeOpacity={0.6}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.destructive ? colors.errorLight : colors.surfaceMuted }]}>
                  <Feather name={action.icon as any} size={iconSize.md} color={action.destructive ? colors.error : (action.color || colors.textPrimary)} />
                </View>
                <Text style={[styles.actionLabel, action.destructive && { color: colors.error }]}>{action.label}</Text>
                <Feather name="chevron-right" size={iconSize.md} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.6}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: space[2], paddingHorizontal: space[5] },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space[4] },
  header: { marginBottom: space[4], paddingHorizontal: space[1] },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textPrimary, marginBottom: space[1] },
  subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.md, color: colors.textSecondary, lineHeight: fontSize.md * 1.4 },
  actions: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, overflow: 'hidden', marginBottom: space[3] },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: space[4], paddingHorizontal: space[4], gap: space[3] },
  actionBtnBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  actionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.textPrimary },
  cancelBtn: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, paddingVertical: space[4], alignItems: 'center' },
  cancelText: { fontFamily: fontFamily.semibold, fontSize: fontSize.lg, color: colors.textSecondary },
});
