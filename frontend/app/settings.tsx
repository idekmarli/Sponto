import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, spacing, shadows, typography, cardStyles, iconSize } from '../src/theme';
import { api } from '../src/api';
import { useCurrency, CURRENCIES } from '../src/currency';
import { Divider } from '../src/components/UI';

const PLATFORM_NAMES: Record<string, string> = {
  ebay: 'eBay',
  depop: 'Depop',
  vinted: 'Vinted',
  vestiaire: 'Vestiaire',
  poshmark: 'Poshmark',
  etsy: 'Etsy',
  custom: 'Custom',
};

// Pro Badge Component
function ProBadge() {
  return (
    <View style={styles.proBadge}>
      <Text style={styles.proBadgeText}>Pro</Text>
    </View>
  );
}

// Section Header
function SectionHeader({ icon, title, description, iconColor = colors.accent, iconBg = colors.surfaceWarm }: {
  icon: string; title: string; description?: string; iconColor?: string; iconBg?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={iconSize.sm} color={iconColor} />
      </View>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description && <Text style={styles.sectionDesc}>{description}</Text>}
      </View>
    </View>
  );
}

// Setting Row
function SettingRow({ label, value, onPress, showArrow = true, rightElement }: {
  label: string; value?: string; onPress?: () => void; showArrow?: boolean; rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      {rightElement || (
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          {showArrow && onPress && <Feather name="chevron-right" size={16} color={colors.textMuted} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

// Coming Soon Row
function ComingSoonRow({ label, description }: { label: string; description?: string }) {
  return (
    <View style={styles.comingSoonRow}>
      <View style={styles.comingSoonLeft}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.comingSoonDesc}>{description}</Text>}
      </View>
      <View style={styles.comingSoonBadge}>
        <Text style={styles.comingSoonText}>Coming Soon</Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformFees, setPlatformFees] = useState<Record<string, string>>({});
  const [targetROI, setTargetROI] = useState('');
  const [minProfit, setMinProfit] = useState('');
  const [minMargin, setMinMargin] = useState('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    api.getSettings().then((s) => {
      const fees: Record<string, string> = {};
      Object.entries(s.platform_fees || {}).forEach(([k, v]) => { fees[k] = String(v); });
      setPlatformFees(fees);
      setTargetROI(String(s.target_roi || 50));
      setMinProfit(String(s.min_profit || 10));
      setMinMargin(String(s.min_margin || 30));
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
        min_margin: parseFloat(minMargin) || 30,
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space[2], paddingBottom: insets.bottom + space[8] }]}
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

      {/* ─── CURRENCY ─── */}
      <View style={styles.section}>
        <SectionHeader 
          icon="dollar-sign" 
          title="Currency" 
          description="Select your preferred currency"
          iconColor={colors.info}
          iconBg={colors.infoLight}
        />
        <View style={cardStyles.base}>
          {Object.values(CURRENCIES).map((curr, i) => (
            <TouchableOpacity
              key={curr.code}
              style={[styles.currencyRow, i > 0 && styles.currencyRowBorder]}
              onPress={() => setCurrency(curr.code)}
              activeOpacity={0.6}
            >
              <View style={styles.currencyInfo}>
                <Text style={styles.currencySymbol}>{curr.symbol}</Text>
                <Text style={styles.currencyName}>{curr.name}</Text>
              </View>
              {currency.code === curr.code && (
                <View style={styles.checkmark}>
                  <Feather name="check" size={16} color={colors.success} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ─── PLATFORMS & FEES ─── */}
      <View style={styles.section}>
        <SectionHeader 
          icon="percent" 
          title="Platforms & Fees" 
          description="Platform fee rates for profit calculation"
        />
        <View style={cardStyles.base}>
          {Object.entries(platformFees).map(([key, value], i) => (
            <View key={key} style={[styles.feeRow, i > 0 && styles.feeRowBorder]}>
              <Text style={styles.feeLabel}>{PLATFORM_NAMES[key] || key}</Text>
              <View style={styles.feeInputWrap}>
                <TextInput
                  style={styles.feeInput}
                  value={value}
                  onChangeText={(v) => setPlatformFees(prev => ({ ...prev, [key]: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.feePercent}>%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ─── BUSINESS RULES ─── */}
      <View style={styles.section}>
        <SectionHeader 
          icon="sliders" 
          title="Business Rules" 
          description="Targets for sourcing decisions and alerts"
        />
        <View style={cardStyles.base}>
          <View style={styles.ruleRow}>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleLabel}>Target ROI</Text>
              <Text style={styles.ruleDesc}>Minimum ROI for "Buy" verdict</Text>
            </View>
            <View style={styles.ruleInputWrap}>
              <TextInput
                style={styles.ruleInput}
                value={targetROI}
                onChangeText={setTargetROI}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.rulePercent}>%</Text>
            </View>
          </View>
          <Divider />
          <View style={styles.ruleRow}>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleLabel}>Min Profit</Text>
              <Text style={styles.ruleDesc}>Minimum profit per item</Text>
            </View>
            <View style={styles.ruleInputWrap}>
              <Text style={styles.rulePrefix}>{currency.symbol}</Text>
              <TextInput
                style={styles.ruleInput}
                value={minProfit}
                onChangeText={setMinProfit}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
          <Divider />
          <View style={styles.ruleRow}>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleLabel}>Min Margin</Text>
              <Text style={styles.ruleDesc}>Below this shows margin risk</Text>
            </View>
            <View style={styles.ruleInputWrap}>
              <TextInput
                style={styles.ruleInput}
                value={minMargin}
                onChangeText={setMinMargin}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.rulePercent}>%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── CONNECTED ACCOUNTS (PRO) ─── */}
      <View style={styles.section}>
        <View style={styles.proSectionHeader}>
          <SectionHeader 
            icon="link" 
            title="Connected Accounts" 
            iconColor={colors.pro}
            iconBg={colors.proLight}
          />
          <ProBadge />
        </View>
        <Text style={styles.proDescription}>
          Sync supported marketplaces with secure official connections only.
        </Text>
        <View style={[cardStyles.pro, styles.proCard]}>
          <ComingSoonRow label="eBay" description="Official API integration" />
          <Divider />
          <ComingSoonRow label="Depop" description="Pending partner access" />
          <Divider />
          <ComingSoonRow label="Vinted" description="Future integration" />
        </View>
        <Text style={styles.proNote}>
          We never store marketplace passwords. All connections use secure OAuth flows.
        </Text>
      </View>

      {/* ─── EXPORTS (PRO) ─── */}
      <View style={styles.section}>
        <View style={styles.proSectionHeader}>
          <SectionHeader 
            icon="download" 
            title="Exports" 
            iconColor={colors.pro}
            iconBg={colors.proLight}
          />
          <ProBadge />
        </View>
        <Text style={styles.proDescription}>
          Export your sales, inventory, and business records for bookkeeping and review.
        </Text>
        <View style={[cardStyles.pro, styles.proCard]}>
          <ComingSoonRow label="Export Sales" description="CSV or Excel" />
          <Divider />
          <ComingSoonRow label="Export Inventory" description="Current stock valuation" />
          <Divider />
          <ComingSoonRow label="Export Expenses" description="Cost tracking" />
          <Divider />
          <ComingSoonRow label="Monthly Report" description="Business summary" />
        </View>
      </View>

      {/* ─── PRIVACY & LEGAL ─── */}
      <View style={styles.section}>
        <SectionHeader 
          icon="shield" 
          title="Privacy & Legal" 
          iconColor={colors.textTertiary}
          iconBg={colors.surfaceMuted}
        />
        <View style={cardStyles.base}>
          <SettingRow 
            label="Privacy Policy" 
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy will be available here.')}
          />
          <Divider />
          <SettingRow 
            label="Legal Notice / Imprint" 
            onPress={() => Alert.alert('Legal Notice', 'Legal notice and imprint will be available here.')}
          />
          <Divider />
          <SettingRow 
            label="Export My Data" 
            value="Coming Soon"
            showArrow={false}
          />
          <Divider />
          <SettingRow 
            label="Delete My Data" 
            value="Coming Soon"
            showArrow={false}
          />
        </View>
        <Text style={styles.legalNote}>
          Resellr OS is designed with privacy by default. Your data is stored locally on your device.
        </Text>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        testID="save-settings-btn"
        style={styles.saveButton}
        onPress={saveSettings}
        disabled={saving}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <>
            <Feather name="check" size={18} color={colors.textInverse} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.version}>Resellr OS v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: space[4],
  },

  // Header
  backBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[4],
    ...shadows.xs,
  },
  header: {
    marginBottom: space[8],
  },
  title: {
    ...typography.h1,
    marginBottom: space[1],
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Section
  section: {
    marginBottom: space[8],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    marginBottom: space[3],
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h4,
  },
  sectionDesc: {
    ...typography.caption,
    marginTop: 2,
  },

  // Currency
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[4],
    paddingHorizontal: space[4],
  },
  currencyRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  currencySymbol: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    width: 32,
  },
  currencyName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Fee Row
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[3] + 2,
    paddingHorizontal: space[4],
  },
  feeRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  feeLabel: {
    ...typography.label,
    color: colors.textPrimary,
  },
  feeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  feeInput: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    textAlign: 'right',
    width: 48,
    padding: 0,
  },
  feePercent: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // Rule Row
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[4],
    paddingHorizontal: space[4],
  },
  ruleInfo: {
    flex: 1,
  },
  ruleLabel: {
    ...typography.label,
    color: colors.textPrimary,
  },
  ruleDesc: {
    ...typography.caption,
    marginTop: 2,
  },
  ruleInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: space[3],
    height: 40,
    gap: space[1],
  },
  rulePrefix: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  ruleInput: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    minWidth: 40,
    padding: 0,
  },
  rulePercent: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // Pro Section
  proSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  proBadge: {
    backgroundColor: colors.pro,
    paddingHorizontal: space[2] + 2,
    paddingVertical: space[1],
    borderRadius: radius.sm,
  },
  proBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },
  proDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: space[2],
    marginBottom: space[3],
  },
  proCard: {
    overflow: 'hidden',
  },
  proNote: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: space[3],
    fontStyle: 'italic',
  },

  // Coming Soon Row
  comingSoonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[4],
    paddingHorizontal: space[4],
  },
  comingSoonLeft: {
    flex: 1,
  },
  comingSoonDesc: {
    ...typography.caption,
    marginTop: 2,
  },
  comingSoonBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space[2] + 2,
    paddingVertical: space[1],
    borderRadius: radius.sm,
  },
  comingSoonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[4],
    paddingHorizontal: space[4],
  },
  settingLabel: {
    ...typography.label,
    color: colors.textPrimary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  settingValue: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // Legal Note
  legalNote: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: space[3],
    fontStyle: 'italic',
  },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    backgroundColor: colors.brand,
    borderRadius: radius.full,
    height: spacing.buttonHeight,
    marginTop: space[4],
    ...shadows.md,
  },
  saveButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },

  // Version
  version: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space[6],
  },
});
