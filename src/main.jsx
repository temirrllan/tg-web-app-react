import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { init as initAnalytics } from '@telegram-apps/analytics';
import { TonConnectUI } from '@tonconnect/ui';

// ⚡ Проверяем, что Telegram WebApp доступен
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  
  // 1️⃣ Инициализация Telegram Analytics (правильный способ)
  const analytics = initAnalytics({
    token: 'eyJhcHBfbmFtZSI6ImhhYml0bHkiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL0NoZWNrSGFiaXRseUJvdCIsImFwcF9kb21haW4iOiJodHRwczovL2FwcC5ldmVudG1hdGUuYXNpYSJ9!WUWbkhe8YHV21043mPO+lCNLvHjxmw5vmjm5Z7qLdck=',
    appName: 'habitly',
  });

  // 2️⃣ Отправляем событие открытия приложения
  analytics.track('app_open', {
    platform: tg.platform,
    version: tg.version,
  });
  console.log('📊 Telegram Analytics: app_open');

  // 3️⃣ Инициализация TonConnectUI
  const tcUI = new TonConnectUI({
    manifestUrl: 'https://app.eventmate.asia/tonconnect-manifest.json', // ⚠️ Создайте этот файл!
  });

  // 4️⃣ Подписка на все TON Connect события
  const tonEvents = [
    'ton-connect-ui-connection-started',
    'ton-connect-ui-connection-error',
    'ton-connect-ui-transaction-signing-failed',
    'ton-connect-custom-event',
    'ton-connect-connection-completed',
    'ton-connect-connection-error',
    'ton-connect-connection-restoring-completed',
    'ton-connect-connection-restoring-error',
    'ton-connect-transaction-sent-for-signature',
    'ton-connect-transaction-signed',
    'ton-connect-transaction-signing-failed',
    'ton-connect-disconnection',
  ];

  tonEvents.forEach((eventName) => {
    tcUI.on(eventName, (data) => {
      analytics.track(eventName, data ? { data } : {});
      console.log(`📊 Telegram Analytics: ${eventName}`, data || {});
    });
  });

  // 5️⃣ Дополнительные события для маркетплейса
  // Отслеживание навигации
  window.addEventListener('popstate', () => {
    analytics.track('page_view', {
      path: window.location.pathname,
    });
  });

  // Отслеживание кликов по основным элементам
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-analytics]');
    if (target) {
      const eventName = target.getAttribute('data-analytics');
      analytics.track(eventName);
    }
  });
}

// 6️⃣ Рендер React приложения
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);