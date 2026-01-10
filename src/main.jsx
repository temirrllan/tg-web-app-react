import { analytics } from './utils/analytics';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import TelegramAnalyticsModule from '@telegram-apps/analytics';
import { TonConnectUI } from '@tonconnect/ui';

// ⚡ Проверяем, что Telegram WebApp доступен
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  
  // 1️⃣ Инициализация Telegram Analytics (ИСПРАВЛЕНО)
  try {
  const TelegramAnalytics = TelegramAnalyticsModule.default || TelegramAnalyticsModule;
  
  const analyticsInstance = TelegramAnalytics.init({
    token: 'eyJhcHBfbmFtZSI6ImhhYml0bHkiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL0NoZWNrSGFiaXRseUJvdCIsImFwcF9kb21haW4iOiJodHRwczovL2FwcC5ldmVudG1hdGUuYXNpYSJ9!WUWbkhe8YHV21043mPO+lCNLvHjxmw5vmjm5Z7qLdck=',
    appName: 'habitly',
  });

  if (!analyticsInstance || typeof analyticsInstance.track !== 'function') {
    throw new Error('Analytics initialization failed');
  }

  // Инициализируем наш хелпер
  analytics.init(analyticsInstance);

  // Отправляем первое событие
  analytics.track('app_open', {
    platform: tg.platform,
    version: tg.version,
  });

  console.log('📊 Telegram Analytics initialized');

} catch (error) {
  console.error('❌ Analytics init error:', error);
}

  // 3️⃣ Инициализация TonConnectUI
  try {
  const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://app.eventmate.asia/tonconnect-manifest.json',
  });

  tonConnectUI.onStatusChange((walletInfo) => {
    if (walletInfo) {
      analytics.track('ton_wallet_connected', {
        address: walletInfo.account?.address,
        chain: walletInfo.account?.chain,
      });
    } else {
      analytics.track('ton_wallet_disconnected');
    }
  });

  window.tonConnectUI = tonConnectUI;
  console.log('✅ TonConnect initialized');

} catch (error) {
  console.error('❌ TonConnect init error:', error);
}

  // 5️⃣ Отслеживание взаимодействий с элементами
  document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-analytics]');
  if (target) {
    const eventName = target.getAttribute('data-analytics');
    const eventData = target.getAttribute('data-analytics-data');
    
    try {
      analytics.track(
        eventName, 
        eventData ? JSON.parse(eventData) : {}
      );
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  }
});

  // 6️⃣ Отслеживание ошибок JavaScript
  window.addEventListener('error', (event) => {
  analytics.trackError(new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

  // 7️⃣ Отслеживание unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
  analytics.trackError(new Error('Unhandled Promise Rejection'), {
    reason: event.reason?.toString(),
  });
});

} else {
  console.warn('⚠️ Telegram WebApp is not available');
}
window.addEventListener('beforeunload', () => {
  const sessionDuration = Math.floor((Date.now() - window.sessionStartTime) / 1000);
  analytics.track('app_close', {
    session_duration: sessionDuration,
  });
});
window.sessionStartTime = Date.now();
// 8️⃣ Рендер React приложения
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);