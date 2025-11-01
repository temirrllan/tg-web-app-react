import React, { useState, useEffect, useContext } from 'react';
import { authenticateUser } from './services/auth';
import { habitService } from './services/habits';
import { useTelegram } from './hooks/useTelegram';
import { LanguageProvider, LanguageContext } from './context/LanguageContext';
import Onboarding from './components/Onboarding';
import Today from './pages/Today';
import Profile from './pages/Profile';
import Loader from './components/common/Loader';
import './App.css';
import { NavigationProvider } from './context/NavigationContext';

// Внутренний компонент для использования контекста языка
function AppContent() {
  const { tg, user: tgUser, webApp, isReady, isLoading } = useTelegram();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Получаем функцию инициализации языка из контекста
  const { initializeLanguage, language } = useContext(LanguageContext);

  console.log('🔍 APP DEBUG: Current language in context:', language);
  console.log('🔍 APP DEBUG: Telegram user:', tgUser);

  useEffect(() => {
    if (tg) {
      try {
        tg.expand();
        tg.ready();
        
        if (tg.BackButton) {
          tg.BackButton.hide();
        }
      } catch (e) {
        console.error('Error initializing Telegram WebApp:', e);
      }
    }
  }, [tg]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔍 APP DEBUG: Starting authentication');
        const isProduction = window.location.hostname !== 'localhost';
        
        if (isProduction && !webApp?.initData) {
          setError('Приложение должно быть открыто через Telegram');
          setLoading(false);
          return;
        }

        const response = await authenticateUser(webApp?.initData, tgUser);
        
        if (response.success) {
          setUser(response.user);
          
          // ВАЖНО: Инициализируем язык из данных пользователя
          if (response.user.language && initializeLanguage) {
            console.log('🔍 APP DEBUG: Initializing language from user data:', response.user.language);
            try {
              initializeLanguage(response.user.language);
            } catch (e) {
              console.error('Error initializing language:', e);
            }
          } else {
            console.log('⚠️ APP DEBUG: No language in user data or initializeLanguage not available');
          }
          
          // Проверяем, есть ли параметр join в URL
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
  }, [webApp, tgUser, isReady, isLoading, tg, initializeLanguage]);

  useEffect(() => {
    // Обработчик возврата в приложение (после оплаты)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('🔄 App became visible, checking subscription status...');
        
        try {
          // Небольшая задержка для обработки webhook
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Перезагружаем данные пользователя
          const response = await habitService.getUserProfile();
          if (response) {
            const wasPremium = user.is_premium;
            
            setUser(prevUser => ({
              ...prevUser,
              is_premium: response.is_premium,
              subscription_type: response.subscription_type
            }));
            
            // Если пользователь СТАЛ premium (раньше не был)
            if (response.is_premium && !wasPremium) {
              console.log('✅ User became premium!');
              
              if (tg?.showAlert) {
                tg.showAlert('🎉 Premium activated successfully! Enjoy unlimited habits!');
              }
            } else if (!response.is_premium && wasPremium) {
              console.log('⚠️ Premium expired or cancelled');
            } else if (!response.is_premium) {
              console.log('ℹ️ User still not premium (payment may have failed or was cancelled)');
            }
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, tg]);

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
        <p>Откройте приложение через Telegram бота @CheckHabitlyBot</p>
      </div>
    );
  }

  return (
    <>
      {showOnboarding ? (
        <Onboarding user={user} onComplete={() => setShowOnboarding(false)} />
      ) : (
        <>
          <Today />
          {showProfile && (
            <Profile onClose={() => setShowProfile(false)} />
          )}
        </>
      )}
    </>
  );
}

// Главный компонент App с LanguageProvider
function App() {
  return (
    <NavigationProvider>
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
    </NavigationProvider>
  );
}

export default App;