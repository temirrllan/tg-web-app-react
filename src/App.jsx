import { useState, useEffect } from 'react';
import { authenticateUser } from './services/auth';
import { useTelegram } from './hooks/useTelegram';
import Onboarding from './components/Onboarding';
import Today from './pages/Today';
import Profile from './pages/Profile';
import Loader from './components/common/Loader';
import './App.css';

function App() {
  const { user: tgUser, webApp, isReady, isLoading } = useTelegram();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
const { tg } = useTelegram();
useEffect(() => {
    if (tg) {
      // Расширяем приложение на весь экран
      tg.expand();
      
      // Включаем кнопку закрытия по умолчанию
      tg.enableClosingConfirmation();
      
      // Готовность приложения
      tg.ready();
    }
  }, [tg]);
  useEffect(() => {
    const initAuth = async () => {
      try {
        // В production обязательно должны быть данные от Telegram
        const isProduction = window.location.hostname !== 'localhost';
        
        if (isProduction && !webApp?.initData) {
          setError('Приложение должно быть открыто через Telegram');
          setLoading(false);
          return;
        }

        console.log('Authenticating with:', { 
          tgUser, 
          hasInitData: !!webApp?.initData,
          environment: isProduction ? 'production' : 'development'
        });

        const response = await authenticateUser(webApp.initData, tgUser);
        
        if (response.success) {
          setUser(response.user);
          if (response.isNewUser) {
            setShowOnboarding(true);
          }
        } else {
          setError('Ошибка аутентификации');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError(err.message || 'Ошибка подключения к серверу');
      } finally {
        setLoading(false);
      }
    };

    // Ждем загрузки Telegram WebApp
    if (!isLoading && isReady) {
      initAuth();
    } else if (!isLoading && !isReady) {
      // Telegram не загрузился
      const isProduction = window.location.hostname !== 'localhost';
      if (isProduction) {
        setError('Пожалуйста, откройте приложение через Telegram бота');
      } else {
        // Development mode
        initAuth();
      }
      setLoading(false);
    }
  }, [webApp, tgUser, isReady, isLoading]);

  // Показываем загрузку
  if (loading || isLoading) {
    return (
      <div className="app-loading">
        <Loader size="large" />
        <p style={{ marginTop: '20px', color: '#666' }}>
          Загрузка Habit Tracker...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        {window.location.hostname === 'localhost' && (
          <button onClick={() => window.location.reload()}>
            Обновить
          </button>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-error">
        <h2>Необходима авторизация</h2>
        <p>Откройте приложение через Telegram бота</p>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding user={user} onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <>
      <Today />
      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}

export default App;