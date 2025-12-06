// src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false
});

export const ThemeProvider = ({ children }) => {
  // Инициализация темы из localStorage или системных настроек
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) return savedTheme;
    
    // Проверяем системные настройки пользователя
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Применяем тему к document
  useEffect(() => {
    const root = document.documentElement;
    
    // Удаляем предыдущую тему
    root.classList.remove('light-theme', 'dark-theme');
    
    // Добавляем новую тему
    root.classList.add(`${theme}-theme`);
    
    // Сохраняем в localStorage
    localStorage.setItem('app-theme', theme);
    
    console.log(`🎨 Theme changed to: ${theme}`);
  }, [theme]);

  // Функция переключения темы
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      
      // Вибрация при переключении (если доступна)
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
      
      return newTheme;
    });
  }, []);

  // Слушаем изменения системной темы
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Только если пользователь не выбрал тему вручную
      const savedTheme = localStorage.getItem('app-theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};