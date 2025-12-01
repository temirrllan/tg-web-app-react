import { useEffect, useState } from "react";

export const useTelegram = () => {
  const [webApp, setWebApp] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // src/hooks/useTelegram.js

useEffect(() => {
  const initTelegram = () => {
    const tg = window.Telegram?.WebApp;
    const isProduction = window.location.hostname !== 'localhost';

    if (tg) {
      try {
        tg.ready?.();
        tg.expand?.();

        // Настройка UI
        try {
          if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#ffffff');
          if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#f3f4f6');
        } catch (err) {
          console.warn('useTelegram: Failed to set colors', err);
        }

        setWebApp(tg);

        // 🔥 КРИТИЧНО: Получаем данные пользователя
        const tgUser = tg.initDataUnsafe?.user;
        
        if (tgUser) {
          setUser(tgUser);
          console.log('✅ Telegram user data found:', {
            id: tgUser.id,
            first_name: tgUser.first_name,
            username: tgUser.username
          });
        } else {
          console.warn('⚠️ No user data in initDataUnsafe');
          
          // 🆕 Пытаемся извлечь из initData напрямую
          if (tg.initData) {
            try {
              const userMatch = tg.initData.match(/user=([^&]+)/);
              if (userMatch) {
                const userJson = decodeURIComponent(userMatch[1]);
                const parsedUser = JSON.parse(userJson);
                setUser(parsedUser);
                console.log('✅ User data extracted from initData:', parsedUser);
              }
            } catch (e) {
              console.error('Failed to parse user from initData:', e);
            }
          }
        }

        console.log('Telegram WebApp initialized:', {
          version: tg.version,
          platform: tg.platform,
          hasUser: !!tgUser,
          hasInitData: !!tg.initData
        });
        
      } catch (err) {
        console.error('useTelegram: initialization failed', err);
      } finally {
        setIsLoading(false);
      }
    } else if (!isProduction) {
      // Development mode
      console.warn('🚧 Development mode: Telegram WebApp emulated');
      const mockWebApp = {
        // ... ваш существующий mock
      };
      setWebApp(mockWebApp);
      setUser(mockWebApp.initDataUnsafe.user);
      setIsLoading(false);
    } else {
      console.error('❌ Telegram WebApp not found in production');
      setIsLoading(false);
    }
  };

  // Инициализация
  if (window.Telegram?.WebApp) {
    initTelegram();
  } else {
    const isProduction = window.location.hostname !== 'localhost';

    if (isProduction) {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.Telegram?.WebApp) {
          clearInterval(checkInterval);
          initTelegram();
        } else if (attempts > 30) {
          clearInterval(checkInterval);
          console.error('Telegram WebApp failed to load');
          setIsLoading(false);
        }
      }, 100);
    } else {
      setTimeout(initTelegram, 100);
    }
  }
}, []);

  const showAlert = (message) => {
    try {
      if (webApp?.showAlert) {
        webApp.showAlert(message);
      } else {
        alert(message);
      }
    } catch (err) {
      console.warn("useTelegram.showAlert failed", err);
      alert(message);
    }
  };

  const showConfirm = (message) => {
    if (webApp?.showConfirm) {
      return new Promise((resolve) => {
        try {
          webApp.showConfirm(message, resolve);
        } catch (err) {
          console.warn("useTelegram.showConfirm failed", err);
          resolve(window.confirm(message));
        }
      });
    }
    return Promise.resolve(window.confirm(message));
  };

  const close = () => {
    try {
      webApp?.close?.();
    } catch (err) {
      console.warn("useTelegram.close failed", err);
    }
  };

  const vibrate = () => {
    try {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred("light");
      }
    } catch (err) {
      console.warn("useTelegram.vibrate failed", err);
    }
  };

  return {
    tg: webApp,
    webApp,
    user,
    showAlert,
    showConfirm,
    close,
    vibrate,
    isReady: !!webApp && !!user,
    isLoading,
  };
};
