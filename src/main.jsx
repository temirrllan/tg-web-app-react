import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import TelegramAnalyticsModule from '@telegram-apps/analytics';
import { TonConnectUI } from '@tonconnect/ui';

// ⚡ Проверяем, что Telegram WebApp доступен
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  
  // 1️⃣ Инициализация Telegram Analytics (правильный способ)
  try {
    const TelegramAnalytics = TelegramAnalyticsModule.default || TelegramAnalyticsModule;
    
    TelegramAnalytics.init({
      token: 'eyJhcHBfbmFtZSI6ImhhYml0bHkiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL0NoZWNrSGFiaXRseUJvdCIsImFwcF9kb21haW4iOiJodHRwczovL2FwcC5ldmVudG1hdGUuYXNpYSJ9!WUWbkhe8YHV21043mPO+lCNLvHjxmw5vmjm5Z7qLdck=',
      appName: 'habitly',
    });

    // 2️⃣ Отправляем событие открытия приложения
    TelegramAnalytics.track('app_open', {
      platform: tg.platform,
      version: tg.version,
      user_id: tg.initDataUnsafe?.user?.id,
    });
    console.log('📊 Telegram Analytics: app_open');

    // Сохраняем для использования в других местах
    window.TelegramAnalytics = TelegramAnalytics;

  } catch (error) {
    console.error('Analytics init error:', error);
  }

  // 3️⃣ Инициализация TonConnectUI (правильный способ)
  try {
    const tonConnectUI = new TonConnectUI({
      manifestUrl: 'https://app.eventmate.asia/tonconnect-manifest.json',
    });

    // 4️⃣ Правильный способ подписки на события TonConnect
    // Используем onStatusChange вместо .on()
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
    console.error('TonConnect init error:', error);
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
        console.error('Failed to track event:', error);
      }
    }
  });
}

// 6️⃣ Рендер React приложения
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);