import React, { createContext, useState, useEffect, useCallback } from 'react';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import kk from '../locales/kk.json';

const translations = {
  en,
  ru,
  kk
};

export const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  availableLanguages: ['en', 'ru', 'kk']
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isChanging, setIsChanging] = useState(false);

  // Загружаем язык из localStorage при монтировании
  useEffect(() => {
    const savedLanguage = localStorage.getItem('appLanguage');
    const tgLanguage = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    
    if (savedLanguage && ['en', 'ru', 'kk'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    } else if (tgLanguage) {
      // Определяем язык по Telegram
      if (tgLanguage === 'ru') {
        setLanguageState('ru');
      } else if (tgLanguage === 'kk' || tgLanguage === 'kz') {
        setLanguageState('kk');
      } else {
        setLanguageState('en');
      }
    }
  }, []);

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

  // Функция смены языка с защитой от двойных кликов
  const setLanguage = useCallback((newLanguage) => {
    if (isChanging || newLanguage === language) return;
    
    setIsChanging(true);
    
    // Задержка для предотвращения двойных кликов
    setTimeout(() => {
      if (['en', 'ru', 'kk'].includes(newLanguage)) {
        setLanguageState(newLanguage);
        localStorage.setItem('appLanguage', newLanguage);
        
        // Вибрация при смене языка
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      }
      setIsChanging(false);
    }, 300);
  }, [language, isChanging]);

  const value = {
    language,
    setLanguage,
    t,
    availableLanguages: ['en', 'ru', 'kk'],
    isChanging
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};