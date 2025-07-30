import { useEffect, useState } from 'react';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Даем время на загрузку Telegram WebApp
    const initTelegram = () => {
      const tg = window.Telegram?.WebApp;
      
      if (tg) {
        tg.ready();
        tg.expand();
        
        // Настройка UI
        tg.setHeaderColor('#ffffff');
        tg.setBackgroundColor('#f3f4f6');
        
        setWebApp(tg);
        
        // Получаем данные пользователя
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          setUser(tgUser);
        } else {
          // Моковые данные для демонстрации
          setUser({
            id: 123456789,
            first_name: 'Logan',
            last_name: 'Howlett',
            photo_url: null, // Можно добавить URL фото
            username: 'wolverine'
          });
        }
        
        console.log('Telegram WebApp initialized:', {
          version: tg.version,
          platform: tg.platform,
          user: tgUser
        });
      } else {
        console.error('Telegram WebApp not found');
        // Моковые данные для демонстрации
        setUser({
          id: 123456789,
          first_name: 'Logan',
          last_name: 'Howlett',
          photo_url: null,
          username: 'wolverine'
        });
      }
    };

    // Проверяем сразу
    if (window.Telegram?.WebApp) {
      initTelegram();
    } else {
      // Если нет, ждем загрузки
      window.addEventListener('load', initTelegram);
      
      // Также проверяем через небольшую задержку
      setTimeout(initTelegram, 100);
    }

    return () => {
      window.removeEventListener('load', initTelegram);
    };
  }, []);

  const showAlert = (message) => {
    if (webApp) {
      webApp.showAlert(message);
    } else {
      alert(message);
    }
  };

  const showConfirm = (message) => {
    if (webApp) {
      return new Promise((resolve) => {
        webApp.showConfirm(message, resolve);
      });
    } else {
      return Promise.resolve(confirm(message));
    }
  };

  const close = () => {
    if (webApp) {
      webApp.close();
    }
  };

  return {
    webApp,
    user,
    showAlert,
    showConfirm,
    close,
    isReady: !!webApp && !!user
  };
};