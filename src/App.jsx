import { useState, useEffect } from 'react';
import './App.css';
import Onboarding from './components/Onboarding';
import { authenticateUser } from './services/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Проверяем, что мы в Telegram WebApp
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          
          const initData = tg.initData;
          const user = tg.initDataUnsafe?.user;
          
          if (user) {
            // Аутентифицируем пользователя
            const response = await authenticateUser(initData, user);
            
            if (response.success) {
              setUser(response.user);
            } else {
              setError('Ошибка аутентификации');
            }
          } else {
            setError('Данные пользователя не найдены');
          }
        } else {
          setError('Приложение должно быть открыто в Telegram');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">Ошибка: {error}</div>;
  }

  if (!user) {
    return <div className="error">Пользователь не авторизован</div>;
  }

  return <Onboarding user={user} />;
}

export default App;