import { useState, useEffect } from 'react';
import { authenticateUser } from './services/auth';
import { useTelegram } from './hooks/useTelegram';
import Onboarding from './components/Onboarding';
import Today from './pages/Today';
import Profile from './pages/Profile';
import Loader from './components/common/Loader';
import './App.css';

function App() {
  const { user: tgUser, webApp, isReady } = useTelegram();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Ждем пока Telegram WebApp будет готов
        if (!isReady) {
          console.log('Waiting for Telegram WebApp...');
          return;
        }

        console.log('Authenticating with:', { tgUser, initData: webApp.initData });

        const initData = webApp.initData || 'test_init_data';
        const response = await authenticateUser(initData, tgUser);
        
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

    if (isReady) {
      initAuth();
    } else {
      // Устанавливаем таймер для повторной проверки
      const timer = setTimeout(() => {
        if (!isReady) {
          setError('Не удалось загрузить Telegram WebApp. Попробуйте обновить страницу.');
          setLoading(false);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [webApp, tgUser, isReady]);

  // Показываем загрузку пока ждем Telegram
  if (loading || !isReady) {
    return (
      <div className="app-loading">
        <Loader size="large" />
        <p style={{ marginTop: '20px', color: '#666' }}>
          Загрузка Telegram Web App...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Обновить
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-error">
        <h2>Пользователь не авторизован</h2>
        <p>Попробуйте перезапустить приложение</p>
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