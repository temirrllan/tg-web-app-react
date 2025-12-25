import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import * as TelegramAnalytics from '@telegram-apps/analytics';
import { TonConnectUI } from '@tonconnect/ui';

// ⚡ Проверяем, что Telegram WebApp доступен
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  
  console.log('TelegramAnalytics exports:', TelegramAnalytics);
  
  // 1️⃣ Инициализация Telegram Analytics
  try {
    TelegramAnalytics.init({
      token: 'eyJhcHBfbmFtZSI6ImhhYml0bHkiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL0NoZWNrSGFiaXRseUJvdCIsImFwcF9kb21haW4iOiJodHRwczovL2FwcC5ldmVudG1hdGUuYXNpYSJ9!WUWbkhe8YHV21043mPO+lCNLvHjxmw5vmjm5Z7qLdck=',
      appName: 'habitly',
    });

    // 2️⃣ Отправляем событие открытия приложения
    TelegramAnalytics.track('app_open', {
      platform: tg.platform,
      version: tg.version,
    });
    console.log('📊 Telegram Analytics: app_open');
  } catch (error) {
    console.error('Analytics init error:', error);
  }

  // 3️⃣ Инициализация TonConnectUI
  const tcUI = new TonConnectUI({
    manifestUrl: 'https://app.eventmate.asia/tonconnect-manifest.json',
  });

  // 4️⃣ Подписка на TON Connect события
  const tonEvents = [
    'connection-completed',
    'connection-error',
    'disconnection',
  ];

  tonEvents.forEach((eventName) => {
    try {
      tcUI.on(eventName, (data) => {
        if (TelegramAnalytics.track) {
          TelegramAnalytics.track(`ton_connect_${eventName}`, data);
        }
        console.log(`📊 TON Connect: ${eventName}`, data);
      });
    } catch (error) {
      console.error(`Failed to subscribe to ${eventName}:`, error);
    }
  });
}

// 5️⃣ Рендер React приложения
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);