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

function AppContent() {
  const { tg, webApp, user: tgUser, isReady } = useTelegram();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [error, setError] = useState(null);
  const { initializeLanguage } = useContext(LanguageContext);

  console.log("ℹ Telegram API loaded:", !!tg);
  console.log("ℹ isReady:", isReady);

  // ✅ Инициализация Telegram WebApp
  useEffect(() => {
    if (!tg) return;
    try {
      tg.ready?.();
      tg.expand?.();
      tg.BackButton?.hide?.();
    } catch (e) {
      console.warn("⚠️ WebApp init error", e);
    }
  }, [tg]);

  // ✅ Авторизация
  useEffect(() => {
    if (!isReady) return;
    setLoading(true);

    const authenticate = async () => {
      try {
        console.log("🔍 Auth started...");
        const prod = window.location.hostname !== "localhost";

        if (prod && !webApp?.initData) {
          throw new Error("Открой через Telegram 🚫");
        }

        const res = await authenticateUser(webApp?.initData, tgUser);

        if (!res.success) throw new Error("Auth failed");

        setUser(res.user);

        if (res.user.language && initializeLanguage) {
          initializeLanguage(res.user.language);
        }

        if (res.isNewUser) {
          setOnboarding(true);
        }

        console.log("✅ Auth success");
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    authenticate();
  }, [isReady, webApp, tgUser, initializeLanguage]);

  if (loading) {
    return (
      <div className="app-loading">
        <Loader size="large" />
        <p>Загрузка…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Обновить</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-error">
        <h2>Необходима авторизация</h2>
        <p>Открой через Telegram бота</p>
      </div>
    );
  }

  return onboarding ? (
    <Onboarding user={user} onComplete={() => setOnboarding(false)} />
  ) : (
    <Today />
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
