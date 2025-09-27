// src/context/LanguageContext.jsx
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
  availableLanguages: ['en', 'ru', 'kk']
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isChanging, setIsChanging] = useState(false);

  // Загружаем язык из localStorage и данных пользователя при монтировании
  useEffect(() => {
    const loadUserLanguage = async () => {
      // Сначала проверяем сохраненный язык
      const savedLanguage = localStorage.getItem('appLanguage');
      
      // Затем проверяем язык из Telegram
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const tgLanguage = tgUser?.language_code;
      
      // Пытаемся получить язык из БД через API
      try {
        const userData = await habitService.getUserProfile();
        if (userData?.language && ['en', 'ru', 'kk'].includes(userData.language)) {
          setLanguageState(userData.language);
          localStorage.setItem('appLanguage', userData.language);
          return;
        }
      } catch (error) {
        console.log('Could not load user language from DB');
      }
      
      // Fallback на сохраненный язык
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
    };
    
    loadUserLanguage();
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
  const setLanguage = useCallback(async (newLanguage) => {
    if (isChanging || newLanguage === language) return;
    
    setIsChanging(true);
    
    // Задержка для предотвращения двойных кликов
    setTimeout(async () => {
      if (['en', 'ru', 'kk'].includes(newLanguage)) {
        setLanguageState(newLanguage);
        localStorage.setItem('appLanguage', newLanguage);
        
        // Обновляем язык в базе данных
        try {
          await habitService.updateUserLanguage(newLanguage);
          console.log(`Language updated to ${newLanguage} in database`);
        } catch (error) {
          console.error('Failed to update language in database:', error);
        }
        
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