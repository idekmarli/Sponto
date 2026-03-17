import React from 'react';
import { useTheme } from '../ThemeContext';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows } from '../theme';

interface DeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemCount?: number;
  loading?: boolean;
}

export function DeleteConfirmModal({ 
  visible, 
  onClose, 
  onConfirm, 
  title = 'Delete Item',
  message,
  itemCount = 1,
  loading = false
}: DeleteConfirmModalProps) {
  const displayMessage = message || (itemCount > 1 
    ? `Are you sure you want to delete ${itemCount} items? This action cannot be undone.`
    : 'Are you sure you want to delete this item? This action cannot be undone.');

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <Feather name="alert-triangle" size={32} color={colors.error} />
          </View>
          
          {/* Title */}
          <Text style={styles.title}>{title}</Text>
          
          {/* Message */}
          <Text style={styles.message}>{displayMessage}</Text>
          
          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deleteBtn, loading && styles.deleteBtnDisabled]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <Text style={styles.deleteBtnText}>Deleting...</Text>
              ) : (
                <>
                  <Feather name="trash-2" size={16} color={colors.textInverse} />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[6],
    alignItems: 'center',
    ...shadows.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[4],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: space[2],
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.md * 1.5,
    marginBottom: space[6],
  },
  actions: {
    flexDirection: 'row',
    gap: space[3],
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  deleteBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    ...shadows.sm,
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
});
