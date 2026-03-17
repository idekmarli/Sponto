import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, cardStyles, shadows, iconSize } from '../src/theme';
import { api } from '../src/api';
import { useCurrency, CURRENCIES } from '../src/currency';
import { SectionHeader, Divider } from '../src/components/UI';

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
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformFees, setPlatformFees] = useState<Record<string, string>>({});
  const [targetROI, setTargetROI] = useState('');
  const [minProfit, setMinProfit] = useState('');

  useEffect(() => {
    api.getSettings().then((s) => {
      const fees: Record<string, string> = {};
      Object.entries(s.platform_fees || {}).forEach(([k, v]) => { fees[k] = String(v); });
      setPlatformFees(fees);
      setTargetROI(String(s.target_roi || 50));
      setMinProfit(String(s.min_profit || 10));
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
      });
      Alert.alert('Saved', 'Settings updated successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space[2] }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
        <Feather name="arrow-left" size={iconSize.md} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Business configuration</Text>
      </View>

      {/* Currency Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: colors.infoLight }]}>
            <Feather name="dollar-sign" size={iconSize.sm} color={colors.info} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Currency</Text>
            <Text style={styles.sectionDesc}>Select your preferred currency</Text>
          </View>
        </View>
        <View style={cardStyles.base}>
          {Object.values(CURRENCIES).map((curr, i) => (
            <TouchableOpacity
              key={curr.code}
              style={[styles.currencyRow, i > 0 && styles.rowBorder]}
              onPress={() => setCurrency(curr.code)}
              activeOpacity={0.6}
            >
              <View style={styles.currencyInfo}>
                <Text style={styles.currencySymbol}>{curr.symbol}</Text>
                <Text style={styles.currencyName}>{curr.name}</Text>
              </View>
              {currency.code === curr.code && (
                <View style={styles.checkIcon}>
                  <Feather name="check" size={iconSize.md} color={colors.success} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Platform Fees */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: '#F5F3EF' }]}>
            <Feather name="percent" size={iconSize.sm} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Platform Fees</Text>
            <Text style={styles.sectionDesc}>Set fee % for each marketplace</Text>
          </View>
        </View>
        <View style={cardStyles.base}>
          {Object.keys(PLATFORM_NAMES).map((key, i) => (
            <View key={key}>
              {i > 0 && <Divider />}
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
            <Feather name="target" size={iconSize.sm} color={colors.success} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Business Targets</Text>
            <Text style={styles.sectionDesc}>Thresholds for sourcing decisions</Text>
          </View>
        </View>
        <View style={cardStyles.base}>
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
          <Divider />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Minimum Profit</Text>
              <Text style={styles.settingHint}>Minimum for "Buy" verdict</Text>
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.inputPrefix}>{currency.symbol}</Text>
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

      <View style={{ height: space[8] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.screenPadding },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: fontFamily.regular, fontSize: fontSize.md, color: colors.textTertiary, marginTop: space[4] },

  backBtn: { width: spacing.touchTarget, height: spacing.touchTarget, borderRadius: spacing.touchTarget / 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: space[4], ...shadows.xs },
  header: { marginBottom: spacing.sectionGap },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize['3xl'], color: colors.textPrimary, letterSpacing: -0.8, marginBottom: space[1] },
  subtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.md, color: colors.textSecondary },

  section: { marginBottom: space[6] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginBottom: space[3] },
  sectionIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textPrimary },
  sectionDesc: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 1 },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space[4], paddingHorizontal: space[4] },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  settingInfo: { flex: 1, marginRight: space[4] },
  settingLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.textPrimary },
  settingHint: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },

  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, paddingHorizontal: space[3], height: 40, minWidth: 80 },
  input: { fontFamily: fontFamily.mono, fontSize: fontSize.md, color: colors.textPrimary, textAlign: 'right', minWidth: 40, padding: 0 },
  inputPrefix: { fontFamily: fontFamily.regular, fontSize: fontSize.md, color: colors.textTertiary, marginRight: space[1] },
  inputSuffix: { fontFamily: fontFamily.regular, fontSize: fontSize.md, color: colors.textTertiary, marginLeft: space[1] },

  currencyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space[4], paddingHorizontal: space[4] },
  currencyInfo: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  currencySymbol: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textPrimary, width: 32 },
  currencyName: { fontFamily: fontFamily.medium, fontSize: fontSize.md, color: colors.textPrimary },
  checkIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.successLight, alignItems: 'center', justifyContent: 'center' },

  saveButton: { backgroundColor: colors.brand, borderRadius: radius.full, height: spacing.buttonHeight, alignItems: 'center', justifyContent: 'center', marginTop: space[4], marginBottom: space[8], ...shadows.md },
  saveButtonText: { fontFamily: fontFamily.semibold, fontSize: fontSize.lg, color: colors.textInverse },

  appInfo: { alignItems: 'center', paddingVertical: space[6] },
  appName: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.textTertiary },
  appVersion: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, marginTop: space[1] },
});
