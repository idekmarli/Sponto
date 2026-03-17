import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDED_KEY = 'resellr_onboarded';
const LAST_PLATFORM_KEY = 'resellr_last_platform';
const LAST_CATEGORY_KEY = 'resellr_last_category';

export const store = {
  // Onboarding
  async hasOnboarded(): Promise<boolean> {
    const val = await AsyncStorage.getItem(ONBOARDED_KEY);
    return val === 'true';
  },
  async setOnboarded(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
  },
  async resetOnboarding(): Promise<void> {
    await AsyncStorage.removeItem(ONBOARDED_KEY);
  },

  // Last used platform (for source calculator)
  async getLastPlatform(): Promise<string> {
    return (await AsyncStorage.getItem(LAST_PLATFORM_KEY)) || 'eBay';
  },
  async setLastPlatform(platform: string): Promise<void> {
    await AsyncStorage.setItem(LAST_PLATFORM_KEY, platform);
  },

  // Last used category
  async getLastCategory(): Promise<string> {
    return (await AsyncStorage.getItem(LAST_CATEGORY_KEY)) || '';
  },
  async setLastCategory(category: string): Promise<void> {
    await AsyncStorage.setItem(LAST_CATEGORY_KEY, category);
  },
};
