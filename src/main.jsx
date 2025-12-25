import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import TelegramAnalytics from '@telegram-apps/analytics';
import { TonConnectUI } from '@tonconnect/ui';

// ⚡ Проверяем, что Telegram WebApp доступен
if (window.Telegram?.WebApp) {
  // 1️⃣ Инициализация Telegram Analytics
  TelegramAnalytics.init({
    token: 'eyJhcHBfbmFtZSI6ImhhYml0bHkiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL0NoZWNrSGFiaXRseUJvdCIsImFwcF9kb21haW4iOiJodHRwczovL2FwcC5ldmVudG1hdGUuYXNpYSJ9!WUWbkhe8YHV21043mPO+lCNLvHjxmw5vmjm5Z7qLdck=',
    appName: 'habitly',
  });

  // 2️⃣ Отправляем событие открытия приложения
  TelegramAnalytics.track('app_open');
  console.log('📊 Telegram Analytics: app_open');

  // 3️⃣ Инициализация TonConnectUI
  const tcUI = new TonConnectUI({});

  // 4️⃣ Подписка на все 12 TON Connect событий и отправка их в Analytics
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
      TelegramAnalytics.track(eventName, data ? { data } : {});
      console.log(`📊 Telegram Analytics: ${eventName}`, data || {});
    });
  });
}

// 5️⃣ Рендер React приложения
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
