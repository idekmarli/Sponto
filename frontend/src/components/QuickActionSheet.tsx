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
  action?: any;
  onComplete?: (message: string) => void;
}

// Generate actions based on the action type
function getActionsForType(type?: string): QuickAction[] {
  if (!type) return [];
  
  switch (type) {
    case 'sold_pending':
      return [
        { key: 'mark_shipped', label: 'Mark as Shipped', icon: 'truck', color: colors.success },
        { key: 'complete', label: 'Mark Complete', icon: 'check-circle', color: colors.success },
      ];
    case 'shipped_pending':
      return [
        { key: 'complete', label: 'Mark Complete', icon: 'check-circle', color: colors.success },
      ];
    case 'stale_reprice':
    case 'critical_stale':
      return [
        { key: 'reprice', label: 'Mark as Repriced', icon: 'edit-3', color: colors.brand },
        { key: 'crosslist', label: 'Mark as Crosslisted', icon: 'copy', color: colors.brand },
        { key: 'archive', label: 'Archive Item', icon: 'archive', destructive: true },
      ];
    case 'needs_listing':
      return [
        { key: 'mark_listed', label: 'Mark as Listed', icon: 'tag', color: colors.success },
      ];
    default:
      return [
        { key: 'view', label: 'View Item', icon: 'eye' },
      ];
  }
}

export function QuickActionSheet({ visible, onClose, action, onComplete }: QuickActionSheetProps) {
  const insets = useSafeAreaInsets();

  const handleAction = (key: string) => {
    if (onComplete) {
      onComplete(`Action "${key}" completed`);
    }
    onClose();
  };

  if (!visible) return null;

  const actionType = action?.type;
  const actionItems = getActionsForType(actionType);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
          <View style={styles.handle} />

          {action && (
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>{action.title || 'Action'}</Text>
              {action.message && <Text style={styles.subtitle} numberOfLines={2}>{action.message}</Text>}
            </View>
          )}

          <View style={styles.actions}>
            {actionItems.map((act, i) => (
              <TouchableOpacity
                key={act.key}
                testID={`action-${act.key}`}
                style={[styles.actionBtn, i > 0 && styles.actionBtnBorder]}
                onPress={() => handleAction(act.key)}
                activeOpacity={0.6}
              >
                <View style={[styles.actionIcon, { backgroundColor: act.destructive ? colors.errorLight : colors.surfaceMuted }]}>
                  <Feather name={act.icon as any} size={iconSize.md} color={act.destructive ? colors.error : (act.color || colors.textPrimary)} />
                </View>
                <Text style={[styles.actionLabel, act.destructive && { color: colors.error }]}>{act.label}</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space[3],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: space[4],
  },
  header: {
    paddingHorizontal: space[5],
    marginBottom: space[4],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: space[1],
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[4],
    paddingHorizontal: space[5],
    gap: space[3],
  },
  actionBtnBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  cancelBtn: {
    marginHorizontal: space[4],
    marginTop: space[3],
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
