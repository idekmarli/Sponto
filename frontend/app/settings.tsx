import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../src/theme';
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
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable state
  const [platformFees, setPlatformFees] = useState<Record<string, string>>({});
  const [targetROI, setTargetROI] = useState('');
  const [minProfit, setMinProfit] = useState('');
  const [defaultPackaging, setDefaultPackaging] = useState('');
  const [defaultShipping, setDefaultShipping] = useState('');

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
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

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
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
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Configure your business assumptions</Text>

      {/* Platform Fees */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform Fees</Text>
        <View style={styles.card}>
          {Object.keys(PLATFORM_NAMES).map((key, i) => (
            <View key={key}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>{PLATFORM_NAMES[key]}</Text>
                <View style={styles.feeInput}>
                  <TextInput
                    testID={`fee-${key}`}
                    style={styles.feeField}
                    value={platformFees[key] || ''}
                    onChangeText={(v) => setPlatformFees(prev => ({ ...prev, [key]: v }))}
                    keyboardType="numeric"
                  />
                  <Text style={styles.feeSuffix}>%</Text>
                </View>
              </View>
              {i < Object.keys(PLATFORM_NAMES).length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>

      {/* Business Targets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Targets</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Target ROI</Text>
              <Text style={styles.settingDesc}>Minimum ROI for a "Buy" verdict</Text>
            </View>
            <View style={styles.feeInput}>
              <TextInput
                testID="target-roi"
                style={styles.feeField}
                value={targetROI}
                onChangeText={setTargetROI}
                keyboardType="numeric"
              />
              <Text style={styles.feeSuffix}>%</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Minimum Profit</Text>
              <Text style={styles.settingDesc}>Minimum net profit for a "Buy" verdict</Text>
            </View>
            <View style={styles.feeInput}>
              <Text style={styles.feePrefix}>$</Text>
              <TextInput
                testID="min-profit"
                style={styles.feeField}
                value={minProfit}
                onChangeText={setMinProfit}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Defaults */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Costs</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Packaging Cost</Text>
              <Text style={styles.settingDesc}>Default per-item packaging</Text>
            </View>
            <View style={styles.feeInput}>
              <Text style={styles.feePrefix}>$</Text>
              <TextInput
                testID="default-packaging"
                style={styles.feeField}
                value={defaultPackaging}
                onChangeText={setDefaultPackaging}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Shipping Cost</Text>
              <Text style={styles.settingDesc}>Default shipping assumption</Text>
            </View>
            <View style={styles.feeInput}>
              <Text style={styles.feePrefix}>$</Text>
              <TextInput
                testID="default-shipping"
                style={styles.feeField}
                value={defaultShipping}
                onChangeText={setDefaultShipping}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity testID="save-settings-btn" style={styles.saveBtn} onPress={saveSettings} disabled={saving} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>Resellr OS</Text>
        <Text style={styles.appVersion}>Version 1.0</Text>
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.containerPadding },
  header: { marginBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Mulish_400Regular', fontSize: 15, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.l },
  section: { marginBottom: spacing.l },
  sectionTitle: { fontFamily: 'Mulish_700Bold', fontSize: 18, color: colors.textPrimary, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.l,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  feeLabel: { fontFamily: 'Mulish_600SemiBold', fontSize: 15, color: colors.textPrimary },
  feeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.m,
    paddingHorizontal: 10,
    height: 38,
    minWidth: 70,
  },
  feeField: { fontFamily: 'SpaceMono_400Regular', fontSize: 15, color: colors.textPrimary, textAlign: 'right', minWidth: 40 },
  feeSuffix: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary, marginLeft: 2 },
  feePrefix: { fontFamily: 'Mulish_400Regular', fontSize: 14, color: colors.textSecondary, marginRight: 2 },
  divider: { height: 1, backgroundColor: colors.divider },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { fontFamily: 'Mulish_600SemiBold', fontSize: 15, color: colors.textPrimary },
  settingDesc: { fontFamily: 'Mulish_400Regular', fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  saveBtnText: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: colors.surface },
  appInfo: { alignItems: 'center', paddingVertical: spacing.l },
  appName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: colors.textTertiary },
  appVersion: { fontFamily: 'Mulish_400Regular', fontSize: 13, color: colors.textTertiary, marginTop: 4 },
});
