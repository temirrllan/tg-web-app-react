import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TonAnalytics } from '@tonconnect/analytics';
import App from './App.jsx';
import './index.css';

// 🔥 ИНИЦИАЛИЗАЦИЯ TON BUILDERS
if (window.Telegram?.WebApp) {
  TonAnalytics.init({
    token: 'eyJhcHBfbmFtZSI6ImhhYml0bHkiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL0NoZWNrSGFiaXRseUJvdCIsImFwcF9kb21haW4iOiJodHRwczovL2FwcC5ldmVudG1hdGUuYXNpYSJ9!WUWbkhe8YHV21043mPO+lCNLvHjxmw5vmjm5Z7qLdck=',
    appName: 'habitly',
  });

  // 🔴 БЕЗ ЭТОГО ANALYTICS НЕ АКТИВИРУЕТСЯ
  TonAnalytics.track('app_open');

  console.log('📊 TON Analytics initialized + app_open sent');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
