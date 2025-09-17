import { useState, useEffect } from 'react';
import { authenticateUser } from './services/auth';
import { habitService } from './services/habits';
import { useTelegram } from './hooks/useTelegram';
import Onboarding from './components/Onboarding';
import Today from './pages/Today';
import Profile from './pages/Profile';
import Loader from './components/common/Loader';
import './App.css';

function App() {
  const { tg, user: tgUser, webApp, isReady, isLoading } = useTelegram();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (tg) {
      tg.expand();
      tg.ready();
      
      if (tg.BackButton) {
        tg.BackButton.hide();
      }
    }
  }, [tg]);

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
        
        if (response.success) {
          // Сохраняем пользователя с is_premium
          setUser(response.user);
          
          // Логируем для отладки
          console.log('✅ User authenticated:', {
            id: response.user.id,
            telegram_id: response.user.telegram_id,
            is_premium: response.user.is_premium,
            type: typeof response.user.is_premium
          });
          
          // Проверяем параметр join в URL
          const urlParams = new URLSearchParams(window.location.search);
          const action = urlParams.get('action');
          const code = urlParams.get('code');
          
          if (action === 'join' && code) {
            try {
              const joinResult = await habitService.joinHabit(code);
              if (joinResult.success) {
                if (tg?.showAlert) {
                  tg.showAlert('Successfully joined the habit! 🎉');
                }
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            } catch (err) {
              console.error('Failed to join habit:', err);
              if (tg?.showAlert) {
                tg.showAlert('Failed to join habit. It may no longer exist.');
              }
            }
          }
          
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
  }, [webApp, tgUser, isReady, isLoading, tg]);

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
        <p>Откройте приложение через Telegram бота @trackeryourhabitbot</p>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding user={user} onComplete={() => setShowOnboarding(false)} />;
  }

  // Передаем пользователя в Today
  return (
    <>
      <Today currentUser={user} />
      {showProfile && (
        <Profile user={user} onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}

export default App;