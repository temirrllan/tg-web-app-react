import React, { useState, useEffect, useContext } from 'react';
import { authenticateUser } from './services/auth';
import { habitService } from './services/habits';
import { useTelegram } from './hooks/useTelegram';
import { LanguageProvider, LanguageContext } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext'; // 🆕 ДОБАВИЛИ
import Onboarding from './components/Onboarding';
import Today from './pages/Today';
import Profile from './pages/Profile';
import Loader from './components/common/Loader';
import './App.css';

function AppContent() {
  const { tg, user: tgUser, webApp, isReady, isLoading } = useTelegram();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const { initializeLanguage, language } = useContext(LanguageContext);

  console.log('🔍 APP STATE:', {
    user: user?.id,
    loading,
    error,
    showOnboarding,
    isReady,
    isLoading
  });

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
        console.log('🔍 === STARTING AUTHENTICATION ===');
        const isProduction = window.location.hostname !== 'localhost';
        
        if (isProduction && !webApp?.initData) {
          setError('Приложение должно быть открыто через Telegram');
          setLoading(false);
          return;
        }

        console.log('📞 Calling authenticateUser...');
        const response = await authenticateUser(webApp?.initData, tgUser);
        
        console.log('📥 AUTH RESPONSE:', {
          success: response.success,
          userId: response.user?.id,
          isNewUser: response.isNewUser,
          isNewUserType: typeof response.isNewUser,
          fullResponse: response
        });
        
        if (response.success) {
          setUser(response.user);
          
          if (response.user.language && initializeLanguage) {
            console.log('🌍 Initializing language:', response.user.language);
            try {
              initializeLanguage(response.user.language);
            } catch (e) {
              console.error('Error initializing language:', e);
            }
          }
          
          // Deep link handling
          const startParam = webApp?.initDataUnsafe?.start_param;
          console.log('🔗 Deep link start_param:', startParam);
          
          if (startParam && startParam.startsWith('join_')) {
            const shareCode = startParam.replace('join_', '');
            console.log('📨 Processing invitation with code:', shareCode);
            
            try {
              const joinResult = await habitService.joinHabit(shareCode);
              console.log('✅ Join habit result:', joinResult);
              
              if (joinResult.success) {
                if (tg?.showAlert) {
                  tg.showAlert('Successfully joined the habit! 🎉');
                } else {
                  alert('Successfully joined the habit! 🎉');
                }
              }
            } catch (err) {
              console.error('❌ Failed to join habit:', err);
              if (tg?.showAlert) {
                tg.showAlert('Failed to join habit. It may no longer exist.');
              } else {
                alert('Failed to join habit. It may no longer exist.');
              }
            }
          }
          
          // URL параметры fallback
          const urlParams = new URLSearchParams(window.location.search);
          const action = urlParams.get('action');
          const code = urlParams.get('code');
          
          if (action === 'join' && code && !startParam) {
            console.log('📨 Processing invitation from URL params:', code);
            
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
          
          // Onboarding check
          console.log('🔍 === ONBOARDING CHECK ===');
          console.log('isNewUser value:', response.isNewUser);
          
          if (response.isNewUser === true) {
            console.log('🆕 NEW USER DETECTED (by flag) - SHOWING ONBOARDING');
            setShowOnboarding(true);
          } else {
            console.log('👤 Checking alternative: habit count');
            try {
              const habitsResponse = await habitService.getAllHabits();
              const habitCount = habitsResponse?.habits?.length || 0;
              console.log('Habit count:', habitCount);
              
              if (habitCount === 0) {
                console.log('🆕 NEW USER DETECTED (by habit count) - SHOWING ONBOARDING');
                setShowOnboarding(true);
              } else {
                console.log('👤 EXISTING USER WITH HABITS - SKIPPING ONBOARDING');
              }
            } catch (habitError) {
              console.error('Failed to check habits:', habitError);
            }
          }
          
        } else {
          console.error('❌ Auth failed:', response);
          setError('Ошибка аутентификации');
        }
      } catch (err) {
        console.error('💥 Auth error:', err);
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
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('🔄 App became visible, checking subscription status...');
        
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const response = await habitService.getUserProfile();
          if (response) {
            const wasPremium = user.is_premium;
            
            setUser(prevUser => ({
              ...prevUser,
              is_premium: response.is_premium,
              subscription_type: response.subscription_type
            }));
            
            if (response.is_premium && !wasPremium) {
              console.log('✅ User became premium!');
              
              if (tg?.showAlert) {
                tg.showAlert('🎉 Premium activated successfully! Enjoy unlimited habits!');
              }
            } else if (!response.is_premium && wasPremium) {
              console.log('⚠️ Premium expired or cancelled');
            } else if (!response.is_premium) {
              console.log('ℹ️ User still not premium');
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
    console.log('⏳ Rendering LOADER');
    return (
      <div className="app-loading">
        <Loader size="large" />
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>
          Загрузка Habit Tracker...
        </p>
      </div>
    );
  }

  if (error) {
    console.log('❌ Rendering ERROR');
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
    console.log('🚫 Rendering NO USER');
    return (
      <div className="app-error">
        <h2>Необходима авторизация</h2>
        <p>Откройте приложение через Telegram бота @CheckHabitlyBot</p>
      </div>
    );
  }

  if (showOnboarding) {
    console.log('🆕 Rendering ONBOARDING');
    return (
      <Onboarding 
        user={user} 
        onComplete={() => {
          console.log('✅ Onboarding completed');
          setShowOnboarding(false);
        }} 
      />
    );
  }

  console.log('📱 Rendering MAIN APP');
  return (
    <>
      <Today />
      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider> {/* 🆕 ОБЕРНУЛИ В ThemeProvider */}
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;