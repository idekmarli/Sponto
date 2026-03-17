/**
 * Simple, privacy-conscious analytics service
 * 
 * This tracks anonymous events locally to help understand app usage patterns.
 * No personal data is collected or transmitted to external services.
 * All data stays on the device.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Event types
export type AnalyticsEvent = 
  | 'app_open'
  | 'onboarding_complete'
  | 'item_added'
  | 'item_sold'
  | 'item_deleted'
  | 'source_calculated'
  | 'theme_changed'
  | 'csv_exported'
  | 'screenshot_analyzed'
  | 'settings_saved';

interface EventData {
  event: AnalyticsEvent;
  timestamp: number;
  metadata?: Record<string, string | number | boolean>;
}

interface AnalyticsStats {
  totalEvents: number;
  eventCounts: Record<AnalyticsEvent, number>;
  firstUse: number;
  lastUse: number;
  sessionCount: number;
}

const STORAGE_KEY = '@resellr_analytics';
const SESSION_KEY = '@resellr_session_count';

class Analytics {
  private enabled: boolean = true;
  private events: EventData[] = [];
  private sessionStarted: boolean = false;

  // Initialize analytics
  async init(): Promise<void> {
    try {
      // Increment session count
      const sessionCount = await AsyncStorage.getItem(SESSION_KEY);
      const newCount = sessionCount ? parseInt(sessionCount) + 1 : 1;
      await AsyncStorage.setItem(SESSION_KEY, newCount.toString());
      
      this.sessionStarted = true;
      this.track('app_open');
    } catch (error) {
      console.warn('Analytics init failed:', error);
    }
  }

  // Track an event
  async track(event: AnalyticsEvent, metadata?: Record<string, string | number | boolean>): Promise<void> {
    if (!this.enabled) return;

    const eventData: EventData = {
      event,
      timestamp: Date.now(),
      metadata,
    };

    this.events.push(eventData);

    // Persist to storage (batch every 5 events)
    if (this.events.length >= 5) {
      await this.flush();
    }
  }

  // Flush events to storage
  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      const existingEvents: EventData[] = existing ? JSON.parse(existing) : [];
      
      // Keep last 1000 events
      const allEvents = [...existingEvents, ...this.events].slice(-1000);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allEvents));
      this.events = [];
    } catch (error) {
      console.warn('Analytics flush failed:', error);
    }
  }

  // Get analytics summary (for insights/debugging)
  async getStats(): Promise<AnalyticsStats | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const sessionCount = await AsyncStorage.getItem(SESSION_KEY);
      
      if (!data) return null;
      
      const events: EventData[] = JSON.parse(data);
      
      const eventCounts: Record<string, number> = {};
      events.forEach(e => {
        eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
      });

      return {
        totalEvents: events.length,
        eventCounts: eventCounts as Record<AnalyticsEvent, number>,
        firstUse: events[0]?.timestamp || Date.now(),
        lastUse: events[events.length - 1]?.timestamp || Date.now(),
        sessionCount: parseInt(sessionCount || '0'),
      };
    } catch (error) {
      console.warn('Analytics getStats failed:', error);
      return null;
    }
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Clear all analytics data
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(SESSION_KEY);
    this.events = [];
  }
}

// Singleton instance
export const analytics = new Analytics();

// Convenience function
export function trackEvent(event: AnalyticsEvent, metadata?: Record<string, string | number | boolean>): void {
  analytics.track(event, metadata);
}

export default analytics;
