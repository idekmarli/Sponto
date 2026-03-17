import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { space, radius, fontFamily, fontSize, spacing, shadows } from '../src/theme';
import { api } from '../src/api';
import { useCurrency, CURRENCIES } from '../src/currency';
import { useTheme, themes, ThemeId } from '../src/ThemeContext';

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
  const { themeId, setTheme, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformFees, setPlatformFees] = useState<Record<string, string>>({});
  const [targetROI, setTargetROI] = useState('');
  const [minProfit, setMinProfit] = useState('');
  const [minMargin, setMinMargin] = useState('');
  const [staleDays, setStaleDays] = useState('');

  // Create dynamic styles based on current theme
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    api.getSettings().then((s) => {
      const fees: Record<string, string> = {};
      Object.entries(s.platform_fees || {}).forEach(([k, v]) => { fees[k] = String(v); });
      setPlatformFees(fees);
      setTargetROI(String(s.target_roi || 50));
      setMinProfit(String(s.min_profit || 10));
      setMinMargin(String(s.min_margin || 30));
      setStaleDays(String(s.stale_days || 30));
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
        stale_days: parseInt(staleDays) || 30,
      });
      Alert.alert('Saved', 'Settings updated successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Section Header Component
  const SectionHeader = ({ icon, title, description, iconColor, iconBg }: {
    icon: string; title: string; description?: string; iconColor?: string; iconBg?: string;
  }) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: iconBg || colors.surfaceMuted }]}>
        <Feather name={icon as any} size={16} color={iconColor || colors.textSecondary} />
      </View>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description && <Text style={styles.sectionDesc}>{description}</Text>}
      </View>
    </View>
  );

  // Setting Row Component
  const SettingRow = ({ label, value, onPress, showArrow = true }: {
    label: string; value?: string; onPress?: () => void; showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showArrow && onPress && <Feather name="chevron-right" size={16} color={colors.textMuted} />}
      </View>
    </TouchableOpacity>
  );

  // Divider Component
  const Divider = () => <View style={styles.divider} />;

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
        <Feather name="arrow-left" size={20} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Business configuration</Text>
      </View>

      {/* ─── THEME ─── */}
      <View style={styles.section}>
        <SectionHeader 
          icon="moon" 
          title="Theme" 
          description="Choose your color theme"
          iconColor={colors.accent}
          iconBg={colors.surfaceMuted}
        />
        <View style={styles.themeGrid}>
          {(Object.keys(themes) as ThemeId[]).map((id) => {
            const t = themes[id];
            const isSelected = themeId === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.themeCard, isSelected && styles.themeCardSelected]}
                onPress={() => setTheme(id)}
                activeOpacity={0.7}
              >
                <View style={styles.themePreview}>
                  {t.preview.map((color, i) => (
                    <View key={i} style={[styles.themePreviewColor, { backgroundColor: color }]} />
                  ))}
                </View>
                <Text style={[styles.themeName, isSelected && styles.themeNameSelected]}>{t.name}</Text>
                {isSelected && (
                  <View style={styles.themeCheck}>
                    <Feather name="check" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── CURRENCY ─── */}
      <View style={styles.section}>
        <SectionHeader 
          icon="globe" 
          title="Currency" 
          description="Select your preferred currency"
          iconColor={colors.textSecondary}
          iconBg={colors.surfaceMuted}
        />
        <View style={styles.card}>
          {Object.values(CURRENCIES).map((curr, i) => (
            <React.Fragment key={curr.code}>
              {i > 0 && <Divider />}
              <TouchableOpacity
                style={styles.currencyRow}
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
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ─── PLATFORMS & FEES ─── */}
      <View style={styles.section}>
        <SectionHeader 
          icon="percent" 
          title="Platforms & Fees" 
          description="Platform fee rates for profit calculation"
          iconColor={colors.accent}
          iconBg={colors.surfaceMuted}
        />
        <View style={styles.card}>
          {Object.entries(platformFees).map(([key, value], i) => (
            <React.Fragment key={key}>
              {i > 0 && <Divider />}
              <View style={styles.feeRow}>
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
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ─── BUSINESS RULES ─── */}
      <View style={styles.section}>
        <SectionHeader 
          icon="sliders" 
          title="Business Rules" 
          description="Targets for sourcing decisions and alerts"
          iconColor={colors.textSecondary}
          iconBg={colors.surfaceMuted}
        />
        <View style={styles.card}>
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
          <Divider />
          <View style={styles.ruleRow}>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleLabel}>Stale After</Text>
              <Text style={styles.ruleDesc}>Days until item is flagged stale</Text>
            </View>
            <View style={styles.ruleInputWrap}>
              <TextInput
                style={styles.ruleInput}
                value={staleDays}
                onChangeText={setStaleDays}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.ruleSuffix}>days</Text>
            </View>
          </View>
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
        <View style={styles.card}>
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

// Dynamic styles factory function
const createStyles = (colors: any) => StyleSheet.create({
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
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
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
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    letterSpacing: -0.8,
    color: colors.textPrimary,
    marginBottom: space[1],
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
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
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  sectionDesc: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },

  // Theme Grid
  themeGrid: {
    flexDirection: 'row',
    gap: space[3],
  },
  themeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[3],
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    ...shadows.sm,
  },
  themeCardSelected: {
    borderColor: colors.brand,
  },
  themePreview: {
    flexDirection: 'row',
    height: 32,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: space[2],
  },
  themePreviewColor: {
    flex: 1,
  },
  themeName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  themeNameSelected: {
    color: colors.textPrimary,
  },
  themeCheck: {
    position: 'absolute',
    top: space[2],
    right: space[2],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Currency
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[4],
    paddingHorizontal: space[4],
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
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
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
  feeLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
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
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
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
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  ruleDesc: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
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
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  ruleSuffix: {
    fontFamily: fontFamily.regular,
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
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  settingValue: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },

  // Legal Note
  legalNote: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
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
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space[6],
  },
});
