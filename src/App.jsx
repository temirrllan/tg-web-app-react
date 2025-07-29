import { useState, useEffect } from 'react';
import { authenticateUser } from './services/auth';
import { useTelegram } from './hooks/useTelegram';
import Onboarding from './components/Onboarding';
import Today from './pages/Today';
import Profile from './pages/Profile';
import Loader from './components/common/Loader';
import './App.css';

function App() {
  const { user: tgUser, webApp } = useTelegram();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (webApp && tgUser) {
          const initData = webApp.initData;
          const response = await authenticateUser(initData, tgUser);
          
          if (response.success) {
            setUser(response.user);
            // Показываем onboarding только новым пользователям
            if (response.isNewUser) {
              setShowOnboarding(true);
            }
          } else {
            setError('Ошибка аутентификации');
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
  }, [webApp, tgUser]);

  if (loading) {
    return (
      <div className="app-loading">
        <Loader size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-error">
        <h2>Пользователь не авторизован</h2>
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