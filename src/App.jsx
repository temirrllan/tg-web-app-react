// src/App.jsx - С ПОДДЕРЖКОЙ НАВИГАЦИИ ПАКЕТОВ И ДОСТИЖЕНИЙ

import React, { useState, useEffect, useContext } from 'react';
import { authenticateUser } from './services/auth';
import { habitService } from './services/habits';
import { useTelegram } from './hooks/useTelegram';
import { LanguageProvider, LanguageContext } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Onboarding from './components/Onboarding';
import Today from './pages/Today';
import Profile from './pages/Profile';
import PackStore from './pages/PackStore';
import PackDetail from './pages/PackDetail';
import Achievements from './pages/Achievements';
import Loader from './components/common/Loader';
import './App.css';

function AppContent() {
  const { tg, user: tgUser, webApp, isReady, isLoading } = useTelegram();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // 🆕 Навигация между страницами
  const [currentPage, setCurrentPage] = useState('today'); // 'today' | 'packs' | 'pack-detail' | 'achievements' | 'profile'
  const [selectedPackSlug, setSelectedPackSlug] = useState(null);
  
  const [shouldShowFabHint, setShouldShowFabHint] = useState(false);
  
  const { initializeLanguage, language } = useContext(LanguageContext);

  console.log('🔍 APP STATE:', {
    user: user?.id,
    loading,
    error,
    showOnboarding,
    isReady,
    isLoading,
    currentPage
  });

  useEffect(() => {
    if (tg) {
      try {
        tg.expand();
        tg.ready();
        
        analytics.track('app_initialized', {
          platform: tg.platform,
          version: tg.version,
        });
        
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
          isNewUserType: typeof response.isNewUser
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
          
          console.log('🔍 === ONBOARDING CHECK ===');
          console.log('isNewUser value:', response.isNewUser);
          console.log('isNewUser type:', typeof response.isNewUser);
          
          if (response.isNewUser === true) {
            console.log('🆕 NEW USER - SHOWING ONBOARDING + WILL SHOW FAB HINT');
            analytics.track('onboarding_started', {
              user_id: response.user.id,
              language: response.user.language,
            });
            
            console.log('🧹 Clearing old hints from localStorage for new user');
            localStorage.removeItem('hasSeenFabHint');
            localStorage.removeItem('hasSeenWeekHint');
            localStorage.removeItem('hasSeenSwipeHint');
            localStorage.removeItem('previousHabitsCount');
            
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && key.startsWith('cache_habits')) {
                console.log('🗑️ Removing stale habits cache:', key);
                localStorage.removeItem(key);
              }
            }
            
            setShowOnboarding(true);
            setShouldShowFabHint(true);
          } else {
            console.log('👤 EXISTING USER - SKIPPING ONBOARDING');
            
            console.log('🧹 Clearing habits cache for existing user');
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && key.startsWith('cache_habits')) {
                console.log('🗑️ Removing stale habits cache:', key);
                localStorage.removeItem(key);
              }
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

  // 🆕 Функции навигации
  const navigateTo = (page, params = {}) => {
    console.log('📍 Navigating to:', page, params);
    
    // Трекинг навигации
    analytics.track('page_view', {
      page: page,
      from: currentPage,
      ...params
    });
    
    setCurrentPage(page);
    
    if (page === 'pack-detail' && params.slug) {
      setSelectedPackSlug(params.slug);
    }
    
    // Управление BackButton
    if (tg?.BackButton) {
      if (page === 'today') {
        tg.BackButton.hide();
      } else {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          if (page === 'pack-detail') {
            navigateTo('packs');
          } else {
            navigateTo('today');
          }
        });
      }
    }
  };

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

  console.log('📱 Rendering MAIN APP - Page:', currentPage);

  // 🆕 Рендер страниц
  return (
    <div className="app-container">
      {currentPage === 'today' && (
        <Today 
          shouldShowFabHint={shouldShowFabHint}
          onNavigate={navigateTo}
        />
      )}
      
      {currentPage === 'packs' && (
        <PackStore 
          onNavigate={navigateTo}
        />
      )}
      
      {currentPage === 'pack-detail' && selectedPackSlug && (
        <PackDetail 
          slug={selectedPackSlug}
          onNavigate={navigateTo}
        />
      )}
      
      {currentPage === 'achievements' && (
        <Achievements 
          onNavigate={navigateTo}
        />
      )}
      
      {currentPage === 'profile' && (
        <Profile 
          onClose={() => navigateTo('today')}
        />
      )}

      {/* 🆕 Нижняя навигация */}
      <BottomNavigation 
        currentPage={currentPage}
        onNavigate={navigateTo}
      />
    </div>
  );
}

// 🆕 Компонент нижней навигации
function BottomNavigation({ currentPage, onNavigate }) {
  return (
    <nav className="bottom-navigation">
      <button
        className={`nav-item ${currentPage === 'today' ? 'active' : ''}`}
        onClick={() => onNavigate('today')}
        data-analytics="nav_click"
        data-analytics-data='{"page":"today"}'
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Today</span>
      </button>

      <button
        className={`nav-item ${currentPage === 'packs' ? 'active' : ''}`}
        onClick={() => onNavigate('packs')}
        data-analytics="nav_click"
        data-analytics-data='{"page":"packs"}'
      >
        <span className="nav-icon">📦</span>
        <span className="nav-label">Packs</span>
      </button>

      <button
        className={`nav-item ${currentPage === 'achievements' ? 'active' : ''}`}
        onClick={() => onNavigate('achievements')}
        data-analytics="nav_click"
        data-analytics-data='{"page":"achievements"}'
      >
        <span className="nav-icon">🏆</span>
        <span className="nav-label">Achievements</span>
      </button>

      <button
        className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate('profile')}
        data-analytics="nav_click"
        data-analytics-data='{"page":"profile"}'
      >
        <span className="nav-icon">👤</span>
        <span className="nav-label">Profile</span>
      </button>
    </nav>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;