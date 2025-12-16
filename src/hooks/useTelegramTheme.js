// src/hooks/useTelegramTheme.js
import { useEffect, useCallback, useRef } from 'react';
import { useTheme } from './useTheme';
import { useTelegram } from './useTelegram';

/**
 * Хук для синхронизации темы приложения с Telegram WebApp
 * Обновляет цвета Header, BackButton, MainButton и фона
 * Автоматически восстанавливает тему при навигации и изменении видимости
 */
export const useTelegramTheme = () => {
  const { theme, isDark } = useTheme();
  const { tg } = useTelegram();
  const intervalRef = useRef(null);

  // Функция применения темы
  const applyTheme = useCallback(() => {
    if (!tg) return;

    try {
      console.log(`🎨 Applying ${theme} theme to Telegram WebApp`);

      if (isDark) {
        // ==================== ТЕМНАЯ ТЕМА ====================
        
        // Цвет фона приложения
        if (typeof tg.setBackgroundColor === 'function') {
          tg.setBackgroundColor('#000000');
        }
        
        // Цвет заголовка (header) - САМОЕ ВАЖНОЕ
        if (typeof tg.setHeaderColor === 'function') {
          tg.setHeaderColor('#1C1C1E');
        }
        
        // Цвет нижней панели (если используется)
        if (typeof tg.setBottomBarColor === 'function') {
          tg.setBottomBarColor('#1C1C1E');
        }

        // MainButton (если используется)
        if (tg.MainButton) {
          tg.MainButton.color = '#A7D96C'; // Зеленый акцент
          tg.MainButton.textColor = '#000000'; // Черный текст
        }

        console.log('✅ Dark theme applied to Telegram WebApp');

      } else {
        // ==================== СВЕТЛАЯ ТЕМА ====================
        
        // Цвет фона приложения
        if (typeof tg.setBackgroundColor === 'function') {
          tg.setBackgroundColor('#F2F2F7');
        }
        
        // Цвет заголовка (header)
        if (typeof tg.setHeaderColor === 'function') {
          tg.setHeaderColor('#FFFFFF');
        }
        
        // Цвет нижней панели (если используется)
        if (typeof tg.setBottomBarColor === 'function') {
          tg.setBottomBarColor('#FFFFFF');
        }

        // MainButton (если используется)
        if (tg.MainButton) {
          tg.MainButton.color = '#0088cc'; // Синий акцент
          tg.MainButton.textColor = '#FFFFFF'; // Белый текст
        }

        console.log('✅ Light theme applied to Telegram WebApp');
      }

    } catch (error) {
      console.error('❌ Failed to apply theme to Telegram WebApp:', error);
    }
  }, [theme, isDark, tg]);

  // Применяем тему при монтировании и изменении темы
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // 🔄 Слежение за изменением видимости страницы
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Page became visible, reapplying theme...');
        // Небольшая задержка для надежности
        setTimeout(() => {
          applyTheme();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [applyTheme]);

  // 🔄 Слежение за Telegram событиями
  useEffect(() => {
    if (!tg) return;

    const handleThemeChanged = () => {
      console.log('🎨 Telegram theme changed event, reapplying theme...');
      setTimeout(() => {
        applyTheme();
      }, 100);
    };

    const handleViewportChanged = () => {
      console.log('📱 Viewport changed, reapplying theme...');
      setTimeout(() => {
        applyTheme();
      }, 100);
    };

    // Подписываемся на события Telegram
    if (tg.onEvent) {
      tg.onEvent('themeChanged', handleThemeChanged);
      tg.onEvent('viewportChanged', handleViewportChanged);
    }

    return () => {
      if (tg.offEvent) {
        tg.offEvent('themeChanged', handleThemeChanged);
        tg.offEvent('viewportChanged', handleViewportChanged);
      }
    };
  }, [tg, applyTheme]);

  // 🔄 Периодическое восстановление темы (каждые 500мс)
  // Это нужно потому что Telegram иногда сбрасывает цвета при навигации
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      applyTheme();
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [applyTheme]);

  return { theme, isDark, applyTheme };
};