import React, { useState, useEffect, useContext } from 'react';
import { authenticateUser } from './services/auth';
import { habitService } from './services/habits';
import { useTelegram } from './hooks/useTelegram';
import { LanguageProvider, LanguageContext } from './context/LanguageContext';
import { NavigationProvider } from './context/NavigationContext.jsx';
import Onboarding from './components/Onboarding';
import Today from './pages/Today';
import Profile from './pages/Profile';
import Loader from './components/common/Loader';
import './App.css';

// 🔧 Безопасный логгер (чтобы видеть ошибки прямо в Telegram)
const safeLog = (title, msg) => {
  try {
    console.log(`🧩 ${title}:`, msg);
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.showPopup({
        title,
        message: typeof msg === 'string' ? msg.slice(0, 1000) : JSON.stringify(msg, null, 2),
        buttons: [{ type: 'ok', text: 'OK' }],
      });
    }
  } catch {}
};

// 🔹 Основной контент приложения
function AppContent() {
  const { tg, user: tgUser, webApp, isReady, isLoading } = useTelegram();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const { initializeLanguage, language } = useContext(LanguageContext);

  // 🟢 Инициализация Telegram WebApp
  useEffect(() => {
    try {
      if (tg) {
        tg.expand();
        tg.ready();
        tg.BackButton?.hide();
      }
    } catch (e) {
      safeLog('TG Init Error', e.message);
    }
  }, [tg]);

  // 🟢 Авторизация пользователя
  useEffect(() => {
    const initAuth = async () => {
      try {
        const isProduction = window.location.hostname !== 'localhost';
        if (isProduction && !webApp?.initData) {
          setError('Приложение должно быть открыто через Telegram');
          setLoading(false);
          return;
        }

        const response = await authenticateUser(webApp?.initData, tgUser);
        if (!response?.success) {
          setError('Ошибка аутентификации');
          return;
        }

        setUser(response.user);

        if (response.user.language && initializeLanguage) {
          initializeLanguage(response.user.language);
        }

        // Если есть приглашение в привычку
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const code = params.get('code');

        if (action === 'join' && code) {
          try {
            const joinRes = await habitService.joinHabit(code);
            if (joinRes.success) {
              tg?.showAlert?.('Successfully joined the habit! 🎉');
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (e) {
            tg?.showAlert?.('Failed to join habit. It may no longer exist.');
          }
        }

        if (response.isNewUser) setShowOnboarding(true);
      } catch (err) {
        safeLog('Auth error', err.message);
        setError(err.message || 'Ошибка подключения к серверу');
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && isReady) {
      initAuth();
    } else if (!isLoading && !isReady) {
      const isProduction = window.location.hostname !== 'localhost';
      if (isProduction) {
        setError('Пожалуйста, откройте приложение через Telegram бота');
      } else {
        initAuth();
      }
      setLoading(false);
    }
  }, [webApp, tgUser, isReady, isLoading, tg, initializeLanguage]);

  // 🟢 Проверка подписки при возврате в приложение
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        try {
          await new Promise((r) => setTimeout(r, 2000));
          const profile = await habitService.getUserProfile();
          if (profile) {
            const wasPremium = user.is_premium;
            setUser((u) => ({
              ...u,
              is_premium: profile.is_premium,
              subscription_type: profile.subscription_type,
            }));

            if (profile.is_premium && !wasPremium) {
              tg?.showAlert?.('🎉 Premium activated successfully!');
            }
          }
        } catch (e) {
          safeLog('Profile refresh error', e.message);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, tg]);

  // 🟠 Экраны состояний
  if (loading || isLoading) {
    return (
      <div className="app-loading">
        <Loader size="large" />
        <p style={{ marginTop: 20, color: '#666' }}>Загрузка Habit Tracker...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        {window.location.hostname === 'localhost' && (
          <button onClick={() => window.location.reload()}>Обновить</button>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-error">
        <h2>Необходима авторизация</h2>
        <p>Откройте приложение через Telegram бота @CheckHabitlyBot</p>
      </div>
    );
  }

  // 🟢 Основной UI
  return (
    <>
      {showOnboarding ? (
        <Onboarding user={user} onComplete={() => setShowOnboarding(false)} />
      ) : (
        <>
          <Today />
          {showProfile && <Profile onClose={() => setShowProfile(false)} />}
        </>
      )}
    </>
  );
}

// 🔹 Главный компонент App (обёртки провайдеров)
function App() {
  try {
    return (
      <NavigationProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </NavigationProvider>
    );
  } catch (err) {
    safeLog('App crash', err.message);
    return (
      <div className="app-error">
        <h2>Ошибка приложения</h2>
        <p>{err.message}</p>
      </div>
    );
  }
}

export default App;
