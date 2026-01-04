/**
 * 📊 Утилита для трекинга событий Telegram Analytics
 */

class Analytics {
  constructor() {
    this.isEnabled = false;
    this.queue = [];
    this.instance = null;
    this.sessionStartTime = Date.now();
  }

  init(analyticsInstance) {
    this.instance = analyticsInstance;
    this.isEnabled = !!analyticsInstance && typeof analyticsInstance.track === 'function';
    
    if (this.isEnabled) {
      console.log('✅ Analytics initialized successfully');
      this.flushQueue();
    }
  }

  getBaseProperties() {
    const tg = window.Telegram?.WebApp;
    return {
      timestamp: new Date().toISOString(),
      user_id: tg?.initDataUnsafe?.user?.id,
      platform: tg?.platform,
      app_version: tg?.version,
      language: tg?.initDataUnsafe?.user?.language_code,
    };
  }

  track(eventName, properties = {}) {
    const enrichedProperties = {
      ...this.getBaseProperties(),
      ...properties,
    };

    if (this.isEnabled && this.instance) {
      try {
        this.instance.track(eventName, enrichedProperties);
        console.log(`📊 Analytics: ${eventName}`, enrichedProperties);
      } catch (error) {
        console.error(`❌ Analytics error for ${eventName}:`, error);
      }
    } else {
      this.queue.push({ eventName, properties: enrichedProperties });
      console.log(`📊 [Queued] ${eventName}`, enrichedProperties);
    }
  }

  flushQueue() {
    console.log(`📊 Flushing ${this.queue.length} queued events`);
    while (this.queue.length > 0) {
      const { eventName, properties } = this.queue.shift();
      if (this.instance) {
        try {
          this.instance.track(eventName, properties);
        } catch (error) {
          console.error(`❌ Error flushing ${eventName}:`, error);
        }
      }
    }
  }

  trackPageSession(pageName, metadata = {}) {
    const startTime = Date.now();
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      if (duration > 5) {
        this.track('page_session_ended', {
          page: pageName,
          duration_seconds: duration,
          ...metadata,
        });
      }
    };
  }

  trackError(error, context = {}) {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500),
      error_type: error.name,
      ...context,
    });
  }

  trackConversion(conversionType, value = null, metadata = {}) {
    this.track('conversion', {
      conversion_type: conversionType,
      value,
      ...metadata,
    });
  }

  trackFunnelStep(funnelName, step, metadata = {}) {
    this.track('funnel_step', {
      funnel: funnelName,
      step,
      ...metadata,
    });
  }
}

export const analytics = new Analytics();

if (typeof window !== 'undefined') {
  window.analytics = analytics;
}

// Константы событий
export const EVENTS = {
  APP: {
    OPEN: 'app_open',
    CLOSE: 'app_close',
  },
  NAVIGATION: {
    PAGE_VIEW: 'page_view',
    DATE_CHANGED: 'date_changed',
  },
  HABITS: {
    CREATED: 'habit_created',
    EDITED: 'habit_edited',
    DELETED: 'habit_deleted',
    MARKED: 'habit_marked',
    UNMARKED: 'habit_unmarked',
    CLICKED: 'habit_clicked',
  },
  FORMS: {
    CREATE_OPENED: 'create_form_opened',
    CREATE_CLOSED: 'create_form_closed',
    EDIT_OPENED: 'edit_form_opened',
    EDIT_CLOSED: 'edit_form_closed',
  },
  SUBSCRIPTION: {
    LIMIT_REACHED: 'subscription_limit_reached',
    MODAL_OPENED: 'subscription_modal_opened',
    MODAL_CLOSED: 'subscription_modal_closed',
    PLAN_SELECTED: 'subscription_plan_selected',
    ACTIVATED: 'subscription_activated',
    PAYMENT_STARTED: 'payment_started',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',
  },
  INTERACTIONS: {
    FAB_CLICKED: 'fab_clicked',
    PULL_TO_REFRESH: 'pull_to_refresh',
    SWIPE_HINT_SHOWN: 'swipe_hint_shown',
    FAB_HINT_SHOWN: 'fab_hint_shown',
    PROFILE_OPENED: 'profile_opened',
  },
  TON: {
    WALLET_CONNECTED: 'ton_wallet_connected',
    WALLET_DISCONNECTED: 'ton_wallet_disconnected',
    TRANSACTION_STARTED: 'ton_transaction_started',
    TRANSACTION_SUCCESS: 'ton_transaction_success',
    TRANSACTION_FAILED: 'ton_transaction_failed',
  },
  ACHIEVEMENTS: {
    ALL_COMPLETED: 'all_habits_completed',
    STREAK_ACHIEVED: 'streak_achieved',
  },
};

export default analytics;