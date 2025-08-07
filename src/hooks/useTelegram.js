  // src/hooks/useTelegram.js
  import { useEffect, useState } from 'react';

  export const useTelegram = () => {
    const [webApp, setWebApp] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const initTelegram = () => {
        const tg = window.Telegram?.WebApp;
        const isProduction = window.location.hostname !== 'localhost';
        
        if (tg) {
          // Production mode - используем реальный Telegram WebApp
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
          }
          
          console.log('Telegram WebApp initialized:', {
            version: tg.version,
            platform: tg.platform,
            hasUser: !!tgUser,
            hasInitData: !!tg.initData
          });
          
          setIsLoading(false);
        } else if (!isProduction) {
          // Development mode - эмулируем Telegram WebApp
          console.warn('🚧 Development mode: Telegram WebApp emulated');
          
          const mockWebApp = {
            initData: 'test_init_data',
            initDataUnsafe: {
              user: {
                id: 123456789,
                first_name: 'Test',
                last_name: 'User',
                username: 'testuser',
                language_code: 'en'
              }
            },
            ready: () => console.log('Mock WebApp ready'),
            expand: () => console.log('Mock WebApp expanded'),
            close: () => console.log('Mock WebApp closed'),
            showAlert: (msg) => alert(msg),
            showConfirm: (msg, cb) => cb(confirm(msg)),
            setHeaderColor: () => {},
            setBackgroundColor: () => {},
            HapticFeedback: {
              impactOccurred: () => console.log('Mock haptic feedback')
            }
          };
          
          setWebApp(mockWebApp);
          setUser(mockWebApp.initDataUnsafe.user);
          setIsLoading(false);
        } else {
          // Production mode - Telegram WebApp не найден
          console.error('❌ Telegram WebApp not found in production');
          setIsLoading(false);
        }
      };

      // Для production ждем загрузку Telegram WebApp
      if (window.Telegram?.WebApp) {
        initTelegram();
      } else {
        const isProduction = window.location.hostname !== 'localhost';
        
        if (isProduction) {
          // В production ждем до 3 секунд
          let attempts = 0;
          const checkInterval = setInterval(() => {
            attempts++;
            if (window.Telegram?.WebApp) {
              clearInterval(checkInterval);
              initTelegram();
            } else if (attempts > 30) { // 30 * 100ms = 3 seconds
              clearInterval(checkInterval);
              console.error('Telegram WebApp failed to load');
              setIsLoading(false);
            }
          }, 100);
        } else {
          // В development сразу используем mock
          setTimeout(initTelegram, 100);
        }
      }
    }, []);

    const showAlert = (message) => {
      webApp?.showAlert?.(message) || alert(message);
    };

    const showConfirm = (message) => {
      if (webApp?.showConfirm) {
        return new Promise((resolve) => {
          webApp.showConfirm(message, resolve);
        });
      }
      return Promise.resolve(confirm(message));
    };

    const close = () => {
      webApp?.close?.();
    };

    const vibrate = () => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred('light');
      }
    };

    return {
      webApp,
      user,
      showAlert,
      showConfirm,
      close,
      vibrate,
      isReady: !!webApp && !!user,
      isLoading
    };
  };