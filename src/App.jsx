import React, { useState, useEffect, useContext, useRef } from 'react';
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
  const { tg, user: tgUser, webApp, isReady, isLoading: tgLoading } = useTelegram();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);   // локальная загрузка аутентификации
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // из контекста языка берём инициализатор и флаг загрузки языка
  const { initializeLanguage, isLoading: langLoading } = useContext(LanguageContext);

  // Чтобы не запустить аутентификацию несколько раз
  const authStartedRef = useRef(false);

  useEffect(() => {
    if (tg) {
      tg.expand();
      tg.ready();
      if (tg.BackButton) tg.BackButton.hide();
    }
  }, [tg]);

  useEffect(() => {
    const initAuth = async () => {
      if (authStartedRef.current) return;
      authStartedRef.current = true;

      try {
        console.log('🚀 App.jsx: Starting authentication...');
        console.log('📱 Telegram WebApp data:', webApp);
        console.log('👤 Telegram user:', tgUser);

        if (tgUser) {
          console.log('🌐 User language_code from Telegram:', tgUser.language_code);
        }

        const isProduction = window.location.hostname !== 'localhost';

        if (isProduction && !webApp?.initData) {
          setError('Приложение должно быть открыто через Telegram');
          setLoading(false);
          return;
        }

        // Готовим данные для аутентификации
        let userDataForAuth;
        if (tgUser && tgUser.id) {
          userDataForAuth = {
            id: tgUser.id,
            first_name: tgUser.first_name || '',
            last_name: tgUser.last_name || '',
            username: tgUser.username || null,
            language_code: tgUser.language_code || 'en', // важно — передаём язык из TG
            is_premium: tgUser.is_premium || false,
            photo_url: tgUser.photo_url || null
          };
          console.log('✅ Using real Telegram data with language_code:', userDataForAuth.language_code);
        } else {
          // dev fallback
          userDataForAuth = {
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            language_code: 'en',
            is_premium: false,
            photo_url: null
          };
          console.log('⚠️ Using mock data for development');
        }

        console.log('📤 Sending auth request with user data:', userDataForAuth);

        // Аутентификация → бэк создаёт/возвращает пользователя и ЯЗЫК ИЗ БД
        const response = await authenticateUser(webApp?.initData, userDataForAuth);

        if (response.success) {
          setUser(response.user);

          // КРИТИЧНО: Инициализируем UI языком ИЗ БД
          const userLanguage = response.user.language;
          console.log('📥 Received user language from server (DB):', userLanguage);

          initializeLanguage(userLanguage || 'en');

          // Обработка action=join
          const urlParams = new URLSearchParams(window.location.search);
          const action = urlParams.get('action');
          const code = urlParams.get('code');

          if (action === 'join' && code) {
            try {
              const joinResult = await habitService.joinHabit(code);
              if (joinResult.success) {
                tg?.showAlert?.('Successfully joined the habit! 🎉');
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            } catch (err) {
              console.error('Failed to join habit:', err);
              tg?.showAlert?.('Failed to join habit. It may no longer exist.');
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

    // Запускаем, когда Telegram готов И не грузится
    if (!tgLoading && isReady) {
      console.log('✅ Telegram WebApp is ready, starting auth...');
      initAuth();
    } else if (!tgLoading && !isReady) {
      const isProduction = window.location.hostname !== 'localhost';
      if (isProduction) {
        console.log('❌ Telegram WebApp not ready in production');
        setError('Пожалуйста, откройте приложение через Telegram бота');
        setLoading(false);
      } else {
        console.log('⚠️ Development mode - proceeding without Telegram WebApp');
        initAuth();
      }
    } else {
      console.log('⏳ Waiting for Telegram WebApp to load...');
    }
  }, [webApp, tgUser, isReady, tgLoading, tg, initializeLanguage]);

  // ВАЖНО: ждём и Telegram, и инициализацию языка из контекста
  if (loading || tgLoading || langLoading) {
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
