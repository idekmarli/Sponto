import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Notification types
export type NotificationType = 
  | 'weekly_review'
  | 'stale_inventory'
  | 'sold_cleanup'
  | 'needs_listing';

// Premium notification copy
const NOTIFICATION_CONTENT: Record<NotificationType, { title: string; body: string }> = {
  weekly_review: {
    title: '📊 Weekly Review Ready',
    body: 'Your performance insights are ready. See how you did this week.',
  },
  stale_inventory: {
    title: '⏰ Items Need Attention',
    body: 'Some items have been sitting. Consider repricing or relisting.',
  },
  sold_cleanup: {
    title: '✓ Sold Items to Process',
    body: 'You have items marked sold. Update shipping status when ready.',
  },
  needs_listing: {
    title: '📦 Items Ready to List',
    body: 'Photographed items waiting. List them to start selling.',
  },
};

// Storage keys
const STORAGE_KEYS = {
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  WEEKLY_REVIEW_ENABLED: 'notification_weekly_review',
  STALE_REMINDER_ENABLED: 'notification_stale_reminder',
  SOLD_CLEANUP_ENABLED: 'notification_sold_cleanup',
  NEEDS_LISTING_ENABLED: 'notification_needs_listing',
};

// Request permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false; // Not supported on web
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  return true;
}

// Check if notifications are enabled
export async function areNotificationsEnabled(): Promise<boolean> {
  const enabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
  return enabled === 'true';
}

// Enable/disable all notifications
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled.toString());
  
  if (!enabled) {
    // Cancel all scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

// Get notification preference
export async function getNotificationPreference(type: NotificationType): Promise<boolean> {
  const key = getStorageKey(type);
  const value = await AsyncStorage.getItem(key);
  return value !== 'false'; // Default to true
}

// Set notification preference
export async function setNotificationPreference(type: NotificationType, enabled: boolean): Promise<void> {
  const key = getStorageKey(type);
  await AsyncStorage.setItem(key, enabled.toString());
}

function getStorageKey(type: NotificationType): string {
  switch (type) {
    case 'weekly_review': return STORAGE_KEYS.WEEKLY_REVIEW_ENABLED;
    case 'stale_inventory': return STORAGE_KEYS.STALE_REMINDER_ENABLED;
    case 'sold_cleanup': return STORAGE_KEYS.SOLD_CLEANUP_ENABLED;
    case 'needs_listing': return STORAGE_KEYS.NEEDS_LISTING_ENABLED;
  }
}

// Schedule a local notification
export async function scheduleNotification(
  type: NotificationType,
  trigger: Notifications.NotificationTriggerInput
): Promise<string | null> {
  const notificationsEnabled = await areNotificationsEnabled();
  const typeEnabled = await getNotificationPreference(type);
  
  if (!notificationsEnabled || !typeEnabled) {
    return null;
  }

  const content = NOTIFICATION_CONTENT[type];
  
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: { type },
    },
    trigger,
  });

  return identifier;
}

// Schedule weekly review reminder (every Sunday at 10 AM)
export async function scheduleWeeklyReviewReminder(): Promise<void> {
  // Cancel existing weekly review notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === 'weekly_review') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  if (Platform.OS === 'web') return;

  await scheduleNotification('weekly_review', {
    weekday: 1, // Sunday (Expo uses iOS NSCalendar: 1=Sunday, 2=Monday, ...)
    hour: 10,
    minute: 0,
    repeats: true,
  } as any);
}

// Schedule stale inventory check (every 3 days)
export async function scheduleStaleInventoryReminder(): Promise<void> {
  // Cancel existing stale notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === 'stale_inventory') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  if (Platform.OS === 'web') return;

  // Schedule for 3 days from now
  await scheduleNotification('stale_inventory', {
    seconds: 60 * 60 * 24 * 3, // 3 days
    repeats: true,
  });
}

// Send immediate notification (for testing)
export async function sendTestNotification(type: NotificationType): Promise<void> {
  const content = NOTIFICATION_CONTENT[type];
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: { type },
    },
    trigger: { seconds: 2 },
  });
}

// Initialize notifications on app start
export async function initializeNotifications(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  
  if (hasPermission) {
    const enabled = await areNotificationsEnabled();
    
    if (enabled) {
      // Schedule recurring notifications
      await scheduleWeeklyReviewReminder();
      await scheduleStaleInventoryReminder();
    }
  }
}

// Get all notification preferences
export async function getNotificationPreferences(): Promise<Record<NotificationType, boolean>> {
  return {
    weekly_review: await getNotificationPreference('weekly_review'),
    stale_inventory: await getNotificationPreference('stale_inventory'),
    sold_cleanup: await getNotificationPreference('sold_cleanup'),
    needs_listing: await getNotificationPreference('needs_listing'),
  };
}
