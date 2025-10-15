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
  console.log('🔍 APP DEBUG: Telegram language_code:', tgUser?.language_code);
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
        console.log('🔍 APP DEBUG: Starting authentication');
        console.log('🔍 APP DEBUG: Telegram WebApp data:', {
          hasInitData: !!webApp?.initData,
          user: tgUser,
          language_code: tgUser?.language_code
        });
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
          if (response.user.language) {
            console.log('🔍 APP DEBUG: Initializing language from user data:', response.user.language);
            initializeLanguage(response.user.language);
          }else {
            console.log('⚠️ APP DEBUG: No language in user data, using default');
            initializeLanguage('en'); // Явно ставим английский если нет языка
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
                // Очищаем параметры из URL
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
// После useEffect с initAuth добавьте:

useEffect(() => {
  // Обработчик возврата в приложение (после оплаты)
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && user) {
      console.log('🔄 App became visible, checking subscription status...');
      
      try {
        // Увеличенная задержка для обработки webhook
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Перезагружаем данные пользователя
        const response = await habitService.getUserProfile();
        if (response) {
          const wasPremium = user.is_premium;
          
          console.log('📊 Subscription check:', {
            wasPremium,
            nowPremium: response.is_premium,
            subscriptionType: response.subscription_type
          });
          
          setUser(prevUser => ({
            ...prevUser,
            is_premium: response.is_premium,
            subscription_type: response.subscription_type,
            subscription_expires_at: response.subscription_expires_at
          }));
          
          // Если пользователь СТАЛ premium (раньше не был)
          if (response.is_premium && !wasPremium) {
            console.log('✅ User became premium!');
            
            if (tg?.showAlert) {
              tg.showAlert('🎉 Premium activated successfully! Enjoy unlimited habits!');
            }
            
            // Закрываем страницу подписки если она открыта
            if (showSubscriptionPage) {
              setShowSubscriptionPage(false);
              setSelectedSubscriptionPlan(null);
            }
            
            // Обновляем статус подписки во всех компонентах
            await checkUserSubscription();
            
          } else if (!response.is_premium && wasPremium) {
            console.log('⚠️ Premium expired or cancelled');
            
            if (tg?.showAlert) {
              tg.showAlert('ℹ️ Your premium subscription has ended.');
            }
          } else if (response.is_premium && wasPremium) {
            console.log('ℹ️ User already has premium (no changes)');
          } else {
            console.log('ℹ️ User still not premium (payment may have failed or was cancelled)');
          }
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  // Слушатель изменения видимости
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Также слушаем focus события для надёжности
  window.addEventListener('focus', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleVisibilityChange);
  };
}, [user, tg, showSubscriptionPage]);
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
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;