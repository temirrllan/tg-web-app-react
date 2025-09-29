import React, { createContext, useState, useEffect, useCallback } from 'react';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import kk from '../locales/kk.json';
import { habitService } from '../services/habits';

const translations = {
  en,
  ru,
  kk
};

export const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  availableLanguages: ['en', 'ru', 'kk'],
  initializeLanguage: () => {}
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isChanging, setIsChanging] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Функция инициализации языка из данных пользователя (вызывается из App.jsx после авторизации)
  const initializeLanguage = useCallback((userLanguage) => {
    console.log('🌍 Initializing language from user data:', userLanguage);
    
    // Проверяем и нормализуем язык
    let normalizedLanguage = 'en'; // По умолчанию английский
    
    if (userLanguage) {
      const langLower = userLanguage.toLowerCase();
      
      if (langLower === 'kk' || langLower === 'kz') {
        // Казахский язык всегда сохраняем как 'kk'
        normalizedLanguage = 'kk';
      } else if (langLower === 'ru') {
        normalizedLanguage = 'ru';
      } else if (langLower === 'en') {
        normalizedLanguage = 'en';
      } else {
        // Любой неизвестный язык = английский
        normalizedLanguage = 'en';
        console.log(`⚠️ Unknown language "${userLanguage}", using English`);
      }
    }
    
    setLanguageState(normalizedLanguage);
    setIsInitialized(true);
    console.log('✅ Language initialized to:', normalizedLanguage);
  }, []);

  // При монтировании компонента НЕ загружаем язык автоматически
  // Ждём, пока App.jsx вызовет initializeLanguage после получения данных пользователя
  useEffect(() => {
    console.log('🌍 LanguageProvider mounted, waiting for user data...');
    // Устанавливаем дефолтный язык, пока не получим данные пользователя
    if (!isInitialized) {
      setLanguageState('en'); // Временно ставим английский
    }
  }, [isInitialized]);

  // Функция для получения перевода
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let translation = translations[language];
    
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // Fallback to English if translation not found
        translation = translations['en'];
        for (const fallbackKey of keys) {
          if (translation && typeof translation === 'object' && fallbackKey in translation) {
            translation = translation[fallbackKey];
          } else {
            console.warn(`Translation not found for key: ${key}`);
            return key;
          }
        }
        break;
      }
    }
    
    // Replace parameters if any
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      let result = translation;
      Object.entries(params).forEach(([param, value]) => {
        result = result.replace(`{{${param}}}`, value);
      });
      return result;
    }
    
    return translation || key;
  }, [language]);

  // Функция смены языка с сохранением в БД
  const setLanguage = useCallback(async (newLanguage) => {
    if (isChanging || newLanguage === language) return;
    
    console.log('🌍 Changing language from', language, 'to', newLanguage);
    setIsChanging(true);
    
    try {
      // Сначала меняем язык локально для мгновенного отклика
      if (['en', 'ru', 'kk'].includes(newLanguage)) {
        setLanguageState(newLanguage);
        setIsInitialized(true);
        
        // Вибрация при смене языка
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
        
        // Затем обновляем в БД
        try {
          await habitService.updateUserLanguage(newLanguage);
          console.log(`✅ Language updated to ${newLanguage} in database`);
        } catch (error) {
          console.error('Failed to update language in database:', error);
          // При ошибке откатываем изменение
          setLanguageState(language);
          throw error;
        }
      }
    } finally {
      setTimeout(() => {
        setIsChanging(false);
      }, 300);
    }
  }, [language, isChanging]);

  const value = {
    language,
    setLanguage,
    t,
    availableLanguages: ['en', 'ru', 'kk'],
    isChanging,
    initializeLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};