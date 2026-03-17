import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, iconSize } from '../theme';

// ============================================================================
// BADGE COMPONENT
// ============================================================================
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: string;
}

const badgeColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.surfaceMuted, text: colors.textSecondary },
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  error: { bg: colors.errorLight, text: colors.error },
  info: { bg: colors.infoLight, text: colors.info },
  brand: { bg: colors.brand, text: colors.textInverse },
};

export function Badge({ label, variant = 'default', size = 'md', dot, icon }: BadgeProps) {
  const colorConfig = badgeColors[variant];
  const isSmall = size === 'sm';

  return (
    <View style={[
      badgeStyles.base,
      { backgroundColor: colorConfig.bg },
      isSmall && badgeStyles.small,
    ]}>
      {dot && <View style={[badgeStyles.dot, { backgroundColor: colorConfig.text }]} />}
      {icon && <Feather name={icon as any} size={isSmall ? 10 : 12} color={colorConfig.text} />}
      <Text style={[
        badgeStyles.text,
        { color: colorConfig.text },
        isSmall && badgeStyles.textSmall,
      ]}>
        {label}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[3],
    paddingVertical: space[1] + 2,
    borderRadius: radius.full,
  },
  small: {
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
  },
  textSmall: {
    fontSize: fontSize.xs,
  },
});

// ============================================================================
// CHIP COMPONENT (Selectable)
// ============================================================================
interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected }: ChipProps) {
  return (
    <View style={[
      chipStyles.base,
      selected ? chipStyles.selected : chipStyles.default,
    ]}>
      <Text style={[
        chipStyles.text,
        selected && chipStyles.textSelected,
      ]}>
        {label}
      </Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  base: {
    paddingHorizontal: space[4],
    paddingVertical: space[2] + 2,
    borderRadius: radius.full,
  },
  default: {
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.brand,
  },
  text: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  textSelected: {
    color: colors.textInverse,
  },
});

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================
interface StatCardProps {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'highlight' | 'warning';
}

export function StatCard({ label, value, trend, trendValue, variant = 'default' }: StatCardProps) {
  const trendColor = trend === 'up' ? colors.success : trend === 'down' ? colors.error : colors.textTertiary;
  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : null;

  return (
    <View style={[
      statStyles.card,
      variant === 'highlight' && statStyles.cardHighlight,
      variant === 'warning' && statStyles.cardWarning,
    ]}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[
        statStyles.value,
        variant === 'warning' && { color: colors.warning },
      ]}>
        {value}
      </Text>
      {trend && trendValue && (
        <View style={statStyles.trendRow}>
          {trendIcon && <Feather name={trendIcon as any} size={12} color={trendColor} />}
          <Text style={[statStyles.trendText, { color: trendColor }]}>{trendValue}</Text>
        </View>
      )}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: space[4],
    paddingHorizontal: space[3],
    minWidth: 100,
  },
  cardHighlight: {
    backgroundColor: colors.surfaceMuted,
  },
  cardWarning: {
    backgroundColor: colors.warningLight,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space[1],
  },
  value: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    marginTop: space[1],
  },
  trendText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
});

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================
interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success';
}

export function EmptyState({ icon, title, description, variant = 'default' }: EmptyStateProps) {
  const iconBg = variant === 'success' ? colors.successLight : colors.surfaceMuted;
  const iconColor = variant === 'success' ? colors.success : colors.textTertiary;

  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.iconContainer, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={iconSize.lg} color={iconColor} />
      </View>
      <Text style={emptyStyles.title}>{title}</Text>
      {description && <Text style={emptyStyles.description}>{description}</Text>}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: space[12],
    paddingHorizontal: space[5],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[5],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: space[2],
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.md * 1.5,
    maxWidth: 280,
  },
});

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={sectionStyles.header}>
      <View style={sectionStyles.headerLeft}>
        <Text style={sectionStyles.title}>{title}</Text>
        {subtitle && <Text style={sectionStyles.subtitle}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[3],
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
});

// ============================================================================
// DIVIDER COMPONENT
// ============================================================================
export function Divider() {
  return <View style={dividerStyles.line} />;
}

const dividerStyles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
});
