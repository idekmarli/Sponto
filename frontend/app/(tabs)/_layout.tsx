import React, { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, space, radius, fontFamily, fontSize, shadows, iconSize } from '../../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/ThemeContext';

type TabIconName = 'home' | 'archive' | 'target' | 'layers' | 'bar-chart-2';

const TAB_CONFIG: { name: string; title: string; icon: TabIconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'inventory', title: 'Inventory', icon: 'archive' },
  { name: 'source', title: 'Source', icon: 'target' },
  { name: 'pipeline', title: 'Pipeline', icon: 'layers' },
  { name: 'insights', title: 'Insights', icon: 'bar-chart-2' },
];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.surface, borderTopColor: colors.border },
    iconContainerActive: { backgroundColor: colors.surfaceMuted },
    label: { color: colors.textTertiary },
    labelActive: { color: colors.textPrimary },
  }), [colors]);

  return (
    <View testID="custom-tab-bar" style={[styles.tabBarContainer, dynamicStyles.container, { paddingBottom: Math.max(insets.bottom, space[2]) }]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route: any, index: number) => {
          const config = TAB_CONFIG[index];
          if (!config) return null;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} testID={`tab-${config.name}`} onPress={onPress} style={styles.tabItem} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <View style={[styles.tabIconContainer, isFocused && dynamicStyles.iconContainerActive]}>
                <Feather name={config.icon} size={iconSize.md} color={isFocused ? colors.textPrimary : colors.textTertiary} />
              </View>
              <Text style={[styles.tabLabel, isFocused ? dynamicStyles.labelActive : dynamicStyles.label]}>{config.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="source" />
      <Tabs.Screen name="pipeline" />
      <Tabs.Screen name="insights" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space[2] },
  tabBarInner: { flexDirection: 'row', paddingHorizontal: space[2] },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: space[1], gap: space[1] },
  tabIconContainer: { width: 48, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, letterSpacing: 0.1 },
});
