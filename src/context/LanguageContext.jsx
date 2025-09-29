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
  initializeLanguage: () => {},
  isLoading: true
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isChanging, setIsChanging] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Функция инициализации языка из данных пользователя (вызывается из App.jsx)
  const initializeLanguage = useCallback((userLanguage) => {
    console.log('🌍 Initializing language from user data:', userLanguage);
    
    if (userLanguage && ['en', 'ru', 'kk'].includes(userLanguage)) {
      setLanguageState(userLanguage);
      localStorage.setItem('userLanguage', userLanguage);
      setIsInitialized(true);
      setIsLoading(false);
      console.log('✅ Language initialized to:', userLanguage);
    } else {
      // Если язык не поддерживается, используем английский
      console.log('⚠️ Unsupported language, defaulting to English');
      setLanguageState('en');
      localStorage.setItem('userLanguage', 'en');
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, []);

  // При монтировании пытаемся загрузить сохраненный язык (для быстрого старта)
  useEffect(() => {
    // Если язык уже инициализирован из БД, не перезаписываем
    if (isInitialized) {
      setIsLoading(false);
      return;
    }
    
    // Пробуем загрузить из localStorage для быстрого старта
    const savedLanguage = localStorage.getItem('userLanguage');
    if (savedLanguage && ['en', 'ru', 'kk'].includes(savedLanguage)) {
      console.log('📦 Loading cached language from localStorage:', savedLanguage);
      setLanguageState(savedLanguage);
      // НЕ устанавливаем isInitialized, чтобы язык из БД мог перезаписать
    }
    
    // Устанавливаем таймаут, если инициализация не произошла
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        console.log('⏱️ Language initialization timeout, using default');
        setLanguageState('en');
        setIsLoading(false);
      }
    }, 2000);
    
    return () => clearTimeout(timeout);
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
    
    console.log('🔄 Changing language from', language, 'to', newLanguage);
    setIsChanging(true);
    
    try {
      // Сначала меняем язык локально для мгновенного отклика
      if (['en', 'ru', 'kk'].includes(newLanguage)) {
        setLanguageState(newLanguage);
        localStorage.setItem('userLanguage', newLanguage);
        setIsInitialized(true);
        setIsLoading(false);
        
        // Вибрация при смене языка
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
        
        // Затем обновляем в БД
        try {
          const result = await habitService.updateUserLanguage(newLanguage);
          console.log(`✅ Language updated in database:`, result);
        } catch (error) {
          console.error('❌ Failed to update language in database:', error);
          // Не откатываем изменения, так как локально язык уже изменен
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
    initializeLanguage,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};