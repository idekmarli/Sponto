import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabIconName = 'home' | 'archive' | 'target' | 'layers' | 'bar-chart-2';

const TAB_CONFIG: { name: string; title: string; icon: TabIconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'inventory', title: 'Inventory', icon: 'archive' },
  { name: 'source', title: 'Source', icon: 'target' },
  { name: 'pipeline', title: 'Pipeline', icon: 'layers' },
  { name: 'insights', title: 'Insights', icon: 'bar-chart-2' },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View testID="custom-tab-bar" style={[styles.tabBarOuter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route: any, index: number) => {
          const config = TAB_CONFIG[index];
          if (!config) return null;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              testID={`tab-${config.name}`}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={[styles.tabIconWrap, isFocused && styles.tabIconActive]}>
                <Feather
                  name={config.icon}
                  size={19}
                  color={isFocused ? colors.textPrimary : colors.textTertiary}
                />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {config.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="source" />
      <Tabs.Screen name="pipeline" />
      <Tabs.Screen name="insights" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 3,
  },
  tabIconWrap: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: colors.surfaceHighlight,
  },
  tabLabel: {
    fontFamily: 'Mulish_400Regular',
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontFamily: 'Mulish_700Bold',
    color: colors.textPrimary,
  },
});
