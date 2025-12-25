import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';


import TelegramAnalytics from '@telegram-apps/analytics';

if (window.Telegram?.WebApp) {
  TelegramAnalytics.init({
    token: 'eyJhcHBfbmFtZSI6ImhhYml0bHkiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL0NoZWNrSGFiaXRseUJvdCIsImFwcF9kb21haW4iOiJodHRwczovL2FwcC5ldmVudG1hdGUuYXNpYSJ9!WUWbkhe8YHV21043mPO+lCNLvHjxmw5vmjm5Z7qLdck=',
    appName: 'habitly',
  });

  TelegramAnalytics.track('app_open');

  const tcUI = new TonConnectUI({});

  tcUI.on('ton-connect-ui-connection-started', () =>
    TelegramAnalytics.track('ton_connect_connection_started')
  );
  tcUI.on('ton-connect-ui-connection-error', (err) =>
    TelegramAnalytics.track('ton_connect_connection_error', { error: err.message })
  );
  tcUI.on('ton-connect-ui-transaction-signing-failed', (err) =>
    TelegramAnalytics.track('ton_connect_transaction_signing_failed', { error: err.message })
  );
}



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
