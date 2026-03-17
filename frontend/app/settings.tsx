import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../src/theme';
import { api } from '../src/api';

const PLATFORM_NAMES: Record<string, string> = {
  ebay: 'eBay',
  depop: 'Depop',
  vinted: 'Vinted',
  vestiaire: 'Vestiaire',
  poshmark: 'Poshmark',
  etsy: 'Etsy',
  custom: 'Custom',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformFees, setPlatformFees] = useState<Record<string, string>>({});
  const [targetROI, setTargetROI] = useState('');
  const [minProfit, setMinProfit] = useState('');
  const [defaultPackaging, setDefaultPackaging] = useState('');
  const [defaultShipping, setDefaultShipping] = useState('');

  useEffect(() => {
    api.getSettings().then((s) => {
      const fees: Record<string, string> = {};
      Object.entries(s.platform_fees || {}).forEach(([k, v]) => { fees[k] = String(v); });
      setPlatformFees(fees);
      setTargetROI(String(s.target_roi || 50));
      setMinProfit(String(s.min_profit || 10));
      setDefaultPackaging(String(s.default_packaging_cost || 2));
      setDefaultShipping(String(s.default_shipping || 5));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const fees: Record<string, number> = {};
      Object.entries(platformFees).forEach(([k, v]) => { fees[k] = parseFloat(v) || 0; });
      await api.updateSettings({
        platform_fees: fees,
        target_roi: parseFloat(targetROI) || 50,
        min_profit: parseFloat(minProfit) || 10,
        default_packaging_cost: parseFloat(defaultPackaging) || 2,
        default_shipping: parseFloat(defaultShipping) || 5,
      });
      Alert.alert('Saved', 'Settings updated successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      testID="settings-screen"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <TouchableOpacity
        testID="back-btn"
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.6}
      >
        <Feather name="arrow-left" size={20} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Business configuration</Text>
      </View>

      {/* Platform Fees */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Feather name="percent" size={16} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Platform Fees</Text>
            <Text style={styles.sectionDesc}>Set fee % for each marketplace</Text>
          </View>
        </View>
        <View style={styles.card}>
          {Object.keys(PLATFORM_NAMES).map((key, i) => (
            <View key={key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{PLATFORM_NAMES[key]}</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    testID={`fee-${key}`}
                    style={styles.input}
                    value={platformFees[key] || ''}
                    onChangeText={(v) => setPlatformFees(prev => ({ ...prev, [key]: v }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.inputSuffix}>%</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Business Targets */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: colors.successLight }]}>
            <Feather name="target" size={16} color={colors.success} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Business Targets</Text>
            <Text style={styles.sectionDesc}>Thresholds for sourcing decisions</Text>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Target ROI</Text>
              <Text style={styles.settingHint}>Minimum for "Buy" verdict</Text>
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                testID="target-roi"
                style={styles.input}
                value={targetROI}
                onChangeText={setTargetROI}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Minimum Profit</Text>
              <Text style={styles.settingHint}>Minimum for "Buy" verdict</Text>
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                testID="min-profit"
                style={styles.input}
                value={minProfit}
                onChangeText={setMinProfit}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Default Costs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: colors.warningLight }]}>
            <Feather name="dollar-sign" size={16} color={colors.warning} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Default Costs</Text>
            <Text style={styles.sectionDesc}>Pre-filled values for new items</Text>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Packaging</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                testID="default-packaging"
                style={styles.input}
                value={defaultPackaging}
                onChangeText={setDefaultPackaging}
                keyboardType="numeric"
                placeholder="2"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Shipping</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                testID="default-shipping"
                style={styles.input}
                value={defaultShipping}
                onChangeText={setDefaultShipping}
                keyboardType="numeric"
                placeholder="5"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        testID="save-settings-btn"
        style={styles.saveButton}
        onPress={saveSettings}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>Resellr OS</Text>
        <Text style={styles.appVersion}>Version 1.0</Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.containerPadding,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading
  loadingText: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 16,
  },

  // Header
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadows.subtle,
  },
  header: {
    marginBottom: spacing.sectionGap,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
  },

  // Sections
  section: {
    marginBottom: spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F1ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionDesc: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    paddingHorizontal: spacing.cardPadding,
    ...shadows.subtle,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  settingHint: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.m,
    paddingHorizontal: 12,
    height: 40,
    minWidth: 80,
  },
  input: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'right',
    minWidth: 40,
    padding: 0,
  },
  inputPrefix: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textTertiary,
    marginRight: 2,
  },
  inputSuffix: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 14,
    color: colors.textTertiary,
    marginLeft: 2,
  },

  // Save Button
  saveButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.pill,
    height: spacing.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  saveButtonText: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.l,
  },
  appName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: colors.textTertiary,
  },
  appVersion: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
});
