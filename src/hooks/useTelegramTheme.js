// src/hooks/useTelegramTheme.js
import { useEffect, useCallback, useRef } from 'react';
import { useTheme } from './useTheme';
import { useTelegram } from './useTelegram';

/**
 * Применить тему к Telegram WebApp синхронно
 * Может вызываться отдельно для немедленного применения
 */
export const applyTelegramTheme = (isDark, tg) => {
  if (!tg) return;

  try {
    if (isDark) {
      // ТЕМНАЯ ТЕМА
      if (typeof tg.setBackgroundColor === 'function') {
        tg.setBackgroundColor('#000000');
      }
      if (typeof tg.setHeaderColor === 'function') {
        tg.setHeaderColor('#1C1C1E');
      }
      if (typeof tg.setBottomBarColor === 'function') {
        tg.setBottomBarColor('#1C1C1E');
      }
      if (tg.MainButton) {
        tg.MainButton.color = '#A7D96C';
        tg.MainButton.textColor = '#000000';
      }
    } else {
      // СВЕТЛАЯ ТЕМА
      if (typeof tg.setBackgroundColor === 'function') {
        tg.setBackgroundColor('#F2F2F7');
      }
      if (typeof tg.setHeaderColor === 'function') {
        tg.setHeaderColor('#FFFFFF');
      }
      if (typeof tg.setBottomBarColor === 'function') {
        tg.setBottomBarColor('#FFFFFF');
      }
      if (tg.MainButton) {
        tg.MainButton.color = '#0088cc';
        tg.MainButton.textColor = '#FFFFFF';
      }
    }
  } catch (error) {
    console.error('Failed to apply Telegram theme:', error);
  }
};

/**
 * Хук для синхронизации темы приложения с Telegram WebApp
 */
export const useTelegramTheme = () => {
  const { theme, isDark } = useTheme();
  const { tg } = useTelegram();
  const intervalRef = useRef(null);

  const applyTheme = useCallback(() => {
    applyTelegramTheme(isDark, tg);
  }, [isDark, tg]);

  // Применяем тему при монтировании и изменении темы
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Слежение за изменением видимости страницы
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
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

  // Слежение за Telegram событиями
  useEffect(() => {
    if (!tg) return;

    const handleThemeChanged = () => {
      setTimeout(() => {
        applyTheme();
      }, 100);
    };

    const handleViewportChanged = () => {
      setTimeout(() => {
        applyTheme();
      }, 100);
    };

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

  // Периодическое восстановление темы
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