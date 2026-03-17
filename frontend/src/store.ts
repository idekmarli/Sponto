import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  onboarded: 'resellr_onboarded',
  lastPlatform: 'resellr_last_platform',
  lastCategory: 'resellr_last_category',
  currency: 'resellr_currency',
} as const;

export const store = {
  // Onboarding
  async hasOnboarded(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.onboarded);
    return val === 'true';
  },
  async setOnboarded(): Promise<void> {
    await AsyncStorage.setItem(KEYS.onboarded, 'true');
  },
  async resetOnboarding(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.onboarded);
  },

  // Last used platform
  async getLastPlatform(): Promise<string> {
    return (await AsyncStorage.getItem(KEYS.lastPlatform)) || 'eBay';
  },
  async setLastPlatform(platform: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.lastPlatform, platform);
  },

  // Last used category
  async getLastCategory(): Promise<string> {
    return (await AsyncStorage.getItem(KEYS.lastCategory)) || '';
  },
  async setLastCategory(category: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.lastCategory, category);
  },
};
