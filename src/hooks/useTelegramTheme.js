// src/hooks/useTelegramTheme.js
import { useEffect } from 'react';
import { useTheme } from './useTheme';
import { useTelegram } from './useTelegram';

/**
 * Хук для синхронизации темы приложения с Telegram WebApp
 * Обновляет цвета Header, BackButton, MainButton и фона
 */
export const useTelegramTheme = () => {
  const { theme, isDark } = useTheme();
  const { tg } = useTelegram();

  useEffect(() => {
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

  return { theme, isDark };
};