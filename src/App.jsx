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
  const { initializeLanguage } = useContext(LanguageContext);

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
        console.log('🚀 Starting authentication...');
        const isProduction = window.location.hostname !== 'localhost';
        
        if (isProduction && !webApp?.initData) {
          setError('Приложение должно быть открыто через Telegram');
          setLoading(false);
          return;
        }

        // Отправляем язык Telegram на сервер
        const userDataForAuth = tgUser || {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'en' // По умолчанию для dev режима
        };
        
        console.log('📤 Sending auth request with language_code:', userDataForAuth.language_code);
        
        const response = await authenticateUser(webApp?.initData, userDataForAuth);
        
        if (response.success) {
          setUser(response.user);
          
          // КРИТИЧНО: Инициализируем язык из БД
          const userLanguage = response.user.language;
          console.log('📥 Received user language from server:', userLanguage);
          
          if (userLanguage) {
            // Инициализируем язык интерфейса из БД
            initializeLanguage(userLanguage);
          } else {
            // Fallback на английский
            console.warn('⚠️ No language in user data, using English');
            initializeLanguage('en');
          }
          
          // Обработка параметров URL (join и т.д.)
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
            console.log('👋 New user - showing onboarding');
          }
        } else {
          setError('Ошибка аутентификации');
        }
      } catch (err) {
        console.error('❌ Auth error:', err);
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
        setLoading(false);
      } else {
        // В dev режиме все равно пытаемся авторизоваться
        initAuth();
      }
    }
  }, [webApp, tgUser, isReady, isLoading, tg, initializeLanguage]);

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
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '8px',
              border: 'none',
              background: '#0088cc',
              color: 'white',
              cursor: 'pointer'
            }}
          >
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