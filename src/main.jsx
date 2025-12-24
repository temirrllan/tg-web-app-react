import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TelegramAnalytics from '@telegram-apps/analytics' // 🆕 ДОБАВИЛИ


// 🆕 ИНИЦИАЛИЗАЦИЯ АНАЛИТИКИ (ПЕРЕД РЕНДЕРИНГОМ!)
TelegramAnalytics.init({
  token: 'eyJhcHBfbmFtZSI6ImhhYml0bHkiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL0NoZWNrSGFiaXRseUJvdCIsImFwcF9kb21haW4iOiJodHRwczovL2FwcC5ldmVudG1hdGUuYXNpYSJ9!WUWbkhe8YHV21043mPO+lCNLvHjxmw5vmjm5Z7qLdck=', // 🔥 ВСТАВЬТЕ ВАШ ТОКЕН
  appName: 'Habitly', // 🔥 ИЛИ ТО НАЗВАНИЕ КОТОРОЕ ВЫ УКАЗАЛИ
});


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
