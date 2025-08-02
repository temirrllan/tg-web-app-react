import { useState, useEffect } from 'react';
import { authenticateUser } from './services/auth';
import { useTelegram } from './hooks/useTelegram';
import Onboarding from './components/Onboarding';
import Today from './pages/Today';
import Profile from './pages/Profile';
import Loader from './components/common/Loader';
import './App.css';
import { useLocalization } from './hooks/useLocalization';

function App() {
  const { user: tgUser, webApp, isReady } = useTelegram();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  // Передаем язык Telegram пользователя в локализацию
  const { language, dictionary, switchLanguage } = useLocalization(tgUser?.language_code);
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!isReady) return;

        const initData = webApp.initData || '';
        if (!initData) throw new Error('No Telegram initData available');

        const response = await authenticateUser(initData, tgUser);

        if (response.success) {
          setUser(response.user);
          if (response.isNewUser) {
            setShowOnboarding(true);
          }
        } else {
          setError('Authentication failed');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError(err.message || 'Server connection error');
      } finally {
        setLoading(false);
      }
    };

    if (isReady) {
      initAuth();
    } else {
      const timer = setTimeout(() => {
        if (!isReady) {
          setError('Failed to load Telegram WebApp. Please refresh the page.');
          setLoading(false);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [webApp, tgUser, isReady]);

  if (loading || !isReady) {
    return (
      <div className="app-loading">
        <Loader size="large" />
        <p style={{ marginTop: '20px', color: '#666' }}>
          Loading Telegram Web App...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-error">
        <h2>{dictionary['userNotAuthorized'] || 'User not authorized'}</h2>
        <p>{dictionary['tryRestart'] || 'Try restarting the app'}</p>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding user={user} onComplete={() => setShowOnboarding(false)} dictionary={dictionary} />;
  }

  return (
    <>
      <Today dictionary={dictionary} />
      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} dictionary={dictionary} switchLanguage={switchLanguage} />
      )}
    </>
  );
}

export default App;
