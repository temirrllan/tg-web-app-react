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

  // Функция инициализации языка из данных пользователя
  const initializeLanguage = useCallback((userLanguage) => {
    console.log('Initializing language from user data:', userLanguage);
    
    if (userLanguage && ['en', 'ru', 'kk'].includes(userLanguage)) {
      setLanguageState(userLanguage);
      localStorage.setItem('appLanguage', userLanguage);
      setIsInitialized(true);
      console.log('Language initialized to:', userLanguage);
    }
  }, []);

  // Загружаем язык при монтировании компонента
  useEffect(() => {
    if (isInitialized) return;
    
    const loadInitialLanguage = () => {
      // Сначала проверяем localStorage
      const savedLanguage = localStorage.getItem('appLanguage');
      
      if (savedLanguage && ['en', 'ru', 'kk'].includes(savedLanguage)) {
        console.log('Loading language from localStorage:', savedLanguage);
        setLanguageState(savedLanguage);
        return;
      }
      
      // Если нет сохраненного языка, пробуем определить по Telegram
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const tgLanguage = tgUser?.language_code;
      
      if (tgLanguage) {
        console.log('Telegram language code:', tgLanguage);
        if (tgLanguage === 'ru') {
          setLanguageState('ru');
          localStorage.setItem('appLanguage', 'ru');
        } else if (tgLanguage === 'kk' || tgLanguage === 'kz') {
          setLanguageState('kk');
          localStorage.setItem('appLanguage', 'kk');
        } else {
          setLanguageState('en');
          localStorage.setItem('appLanguage', 'en');
        }
      } else {
        // По умолчанию английский
        console.log('No language preference found, defaulting to English');
        setLanguageState('en');
        localStorage.setItem('appLanguage', 'en');
      }
    };
    
    // Небольшая задержка для загрузки данных пользователя
    const timeoutId = setTimeout(() => {
      if (!isInitialized) {
        loadInitialLanguage();
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
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
    
    console.log('Changing language from', language, 'to', newLanguage);
    setIsChanging(true);
    
    try {
      // Сначала меняем язык локально для мгновенного отклика
      if (['en', 'ru', 'kk'].includes(newLanguage)) {
        setLanguageState(newLanguage);
        localStorage.setItem('appLanguage', newLanguage);
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