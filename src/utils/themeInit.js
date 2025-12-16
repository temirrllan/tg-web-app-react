// src/utils/themeInit.js
/**
 * КРИТИЧНО: Этот скрипт выполняется ДО React
 * Применяет тему мгновенно, чтобы избежать "мигания"
 */

(function initThemeImmediately() {
  try {
    // 1. Получаем сохраненную тему из localStorage
    const savedTheme = localStorage.getItem('app-theme');
    
    // 2. Определяем активную тему
    let activeTheme = savedTheme;
    
    if (!activeTheme) {
      // Если нет сохраненной темы, проверяем системные настройки
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        activeTheme = 'dark';
      } else {
        activeTheme = 'light';
      }
    }
    
    const isDark = activeTheme === 'dark';
    
    console.log(`🎨 Early theme init: ${activeTheme}`);
    
    // 3. Применяем CSS класс НЕМЕДЛЕННО (до React)
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${activeTheme}-theme`);
    
    // 4. Применяем к Telegram WebApp НЕМЕДЛЕННО
    const applyTelegramTheme = () => {
      const tg = window.Telegram?.WebApp;
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
        }
        console.log('✅ Telegram theme applied early');
      } catch (error) {
        console.error('Failed to apply Telegram theme early:', error);
      }
    };
    
    // 5. Применяем Telegram тему
    if (window.Telegram?.WebApp) {
      // Если WebApp уже загружен
      applyTelegramTheme();
    } else {
      // Если еще не загружен, ждем
      let attempts = 0;
      const checkTelegram = setInterval(() => {
        attempts++;
        if (window.Telegram?.WebApp) {
          clearInterval(checkTelegram);
          applyTelegramTheme();
        } else if (attempts > 50) {
          // Максимум 5 секунд ожидания
          clearInterval(checkTelegram);
          console.warn('Telegram WebApp not found after 5 seconds');
        }
      }, 100);
    }
    
  } catch (error) {
    console.error('Early theme init failed:', error);
  }
})();