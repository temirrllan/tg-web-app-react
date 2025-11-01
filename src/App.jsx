import React, { useState, useEffect, useContext } from 'react';
import { authenticateUser } from './services/auth';
import { habitService } from './services/habits';
import { useTelegram } from './hooks/useTelegram';
import { LanguageProvider, LanguageContext } from './context/LanguageContext';
import Onboarding from './components/Onboarding';
import Today from './pages/Today';
import Loader from './components/common/Loader';
import './App.css';
import { NavigationProvider } from './context/NavigationContext.jsx';

function AppContent() {
  const { tg, user: tgUser, webApp, isReady } = useTelegram();

  const [appState, setAppState] = useState({
    loading: true,
    error: null,
    user: null,
    showOnboarding: false,
  });

  const { initializeLanguage, language } = useContext(LanguageContext);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("BOOT: init Telegram WebApp");

        tg?.expand();
        tg?.ready();
        tg?.BackButton?.hide();

        if (!isReady) return;

        const isProd = window.location.hostname !== "localhost";
        if (isProd && !webApp?.initData) {
          throw new Error("Must be opened in Telegram");
        }

        const response = await authenticateUser(webApp?.initData, tgUser);
        if (!response.success) throw new Error("Auth failed");

        const user = response.user;
        setAppState(prev => ({ ...prev, user }));

        if (user.language && initializeLanguage) {
          initializeLanguage(user.language);
        }

        if (response.isNewUser) {
          setAppState(prev => ({ ...prev, showOnboarding: true }));
        }

        // ✅ Query-join обработка перенесена ниже init
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const code = urlParams.get('code');

        if (action === 'join' && code) {
          try {
            await habitService.joinHabit(code);
            tg?.showAlert("🎉 Habit joined!");
          } catch {
            tg?.showAlert("⚠️ Unable to join habit");
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        }

      } catch (e) {
        console.error("INIT ERROR:", e);
        setAppState(prev => ({
          ...prev,
          error: e.message || "Unknown error"
        }));
      } finally {
        setAppState(prev => ({ ...prev, loading: false }));
      }
    };

    initialize();
  }, [isReady, tg, webApp, tgUser, initializeLanguage]);

  const { loading, error, user, showOnboarding } = appState;

  if (loading) {
    return (
      <div className="app-loading">
        <Loader size="large" />
        <p>Loading Habit Tracker…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-error">
        <h2>Authorization Required</h2>
        <p>Open via @CheckHabitlyBot in Telegram</p>
      </div>
    );
  }

  return showOnboarding
    ? <Onboarding user={user} onComplete={() => setAppState(p => ({ ...p, showOnboarding: false }))} />
    : <Today />;
}

export default function App() {
  return (
    <NavigationProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </NavigationProvider>
  );
}
