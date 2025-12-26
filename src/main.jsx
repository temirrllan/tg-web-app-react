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
    
    // ✅ ПРАВИЛЬНО: init() возвращает экземпляр с методом track()
    const analytics = TelegramAnalytics.init({
      token: 'eyJhcHBfbmFtZSI6ImhhYml0bHkiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL0NoZWNrSGFiaXRseUJvdCIsImFwcF9kb21haW4iOiJodHRwczovL2FwcC5ldmVudG1hdGUuYXNpYSJ9!WUWbkhe8YHV21043mPO+lCNLvHjxmw5vmjm5Z7qLdck=',
      appName: 'habitly_prod',
    });

    // Проверяем, что analytics успешно инициализирован
    if (!analytics || typeof analytics.track !== 'function') {
      throw new Error('Analytics initialization failed: track method not available');
    }

    // 2️⃣ Отправляем событие открытия приложения
    analytics.track('app_open', {
      platform: tg.platform,
      version: tg.version,
      user_id: tg.initDataUnsafe?.user?.id,
    });
    console.log('📊 Telegram Analytics initialized: app_open tracked');

    // ✅ Сохраняем ЭКЗЕМПЛЯР для использования в других местах
    window.TelegramAnalytics = analytics;

  } catch (error) {
    console.error('❌ Analytics init error:', error);
    // Создаем fallback объект для предотвращения ошибок
    window.TelegramAnalytics = {
      track: (eventName, data) => {
        console.log('📊 [Analytics Fallback]', eventName, data);
      }
    };
  }

  // 3️⃣ Инициализация TonConnectUI
  try {
    const tonConnectUI = new TonConnectUI({
      manifestUrl: 'https://app.eventmate.asia/tonconnect-manifest.json',
    });

    // 4️⃣ Подписка на события TonConnect
    tonConnectUI.onStatusChange((walletInfo) => {
      if (walletInfo) {
        // Кошелек подключен
        console.log('📊 TON Wallet connected:', walletInfo);
        window.TelegramAnalytics?.track('ton_wallet_connected', {
          address: walletInfo.account?.address,
          chain: walletInfo.account?.chain,
          publicKey: walletInfo.account?.publicKey,
        });
      } else {
        // Кошелек отключен
        console.log('📊 TON Wallet disconnected');
        window.TelegramAnalytics?.track('ton_wallet_disconnected');
      }
    });

    // Сохраняем для использования в компонентах
    window.tonConnectUI = tonConnectUI;

    console.log('✅ TonConnect initialized');

  } catch (error) {
    console.error('❌ TonConnect init error:', error);
  }

  // 5️⃣ Отслеживание взаимодействий с элементами
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-analytics]');
    if (target && window.TelegramAnalytics) {
      const eventName = target.getAttribute('data-analytics');
      const eventData = target.getAttribute('data-analytics-data');
      
      try {
        window.TelegramAnalytics.track(
          eventName, 
          eventData ? JSON.parse(eventData) : {}
        );
        console.log('📊 Tracked:', eventName);
      } catch (error) {
        console.error('❌ Failed to track event:', error);
      }
    }
  });

  // 6️⃣ Отслеживание ошибок JavaScript
  window.addEventListener('error', (event) => {
    window.TelegramAnalytics?.track('js_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // 7️⃣ Отслеживание unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    window.TelegramAnalytics?.track('unhandled_rejection', {
      reason: event.reason?.toString(),
    });
  });

} else {
  console.warn('⚠️ Telegram WebApp is not available');
}

// 8️⃣ Рендер React приложения
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);