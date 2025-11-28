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
    console.log('🌍 Initializing language from user data:', userLanguage);
    
    let normalizedLanguage = 'en';
    
    if (userLanguage) {
      const langLower = userLanguage.toLowerCase();
      console.log(`🔍 Checking language: "${langLower}"`);
      
      if (langLower === 'kk' || langLower === 'kz' || 
          langLower.startsWith('kk-') || langLower.startsWith('kk_') ||
          langLower.startsWith('kz-') || langLower.startsWith('kz_')) {
        normalizedLanguage = 'kk';
        console.log('✅ Detected Kazakh language');
      } else if (langLower === 'ru' || 
                 langLower.startsWith('ru-') || langLower.startsWith('ru_')) {
        normalizedLanguage = 'ru';
        console.log('✅ Detected Russian language');
      } else if (langLower === 'en' || 
                 langLower.startsWith('en-') || langLower.startsWith('en_')) {
        normalizedLanguage = 'en';
        console.log('✅ Detected English language');
      } else {
        normalizedLanguage = 'en';
        console.log(`⚠️ Unknown language "${langLower}", defaulting to English`);
      }
      
      console.log(`📌 Final decision: language_code="${langLower}" → language="${normalizedLanguage}"`);
    } else {
      console.log('⚠️ No language_code provided, defaulting to English');
      normalizedLanguage = 'en';
    }
    
    setLanguageState(normalizedLanguage);
    setIsInitialized(true);
    console.log('✅ Language initialized to:', normalizedLanguage);
  }, []);

  useEffect(() => {
    console.log('🌍 LanguageProvider mounted, waiting for user data...');
    if (!isInitialized) {
      setLanguageState('en');
    }
  }, [isInitialized]);

  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let translation = translations[language];
    
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
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
    
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      let result = translation;
      Object.entries(params).forEach(([param, value]) => {
        result = result.replace(`{{${param}}}`, value);
      });
      return result;
    }
    
    return translation || key;
  }, [language]);

  // 🔥 УЛУЧШЕННАЯ функция смены языка
  const setLanguage = useCallback(async (newLanguage) => {
    if (isChanging || newLanguage === language) return;
    
    console.log('🌍 Changing language from', language, 'to', newLanguage);
    setIsChanging(true);
    
    // 🔥 ВРЕМЕННО СКРЫВАЕМ BackButton чтобы избежать мигания
    const tg = window.Telegram?.WebApp;
    const backButtonWasVisible = tg?.BackButton?.isVisible;
    
    if (tg?.BackButton && backButtonWasVisible) {
      try {
        tg.BackButton.hide();
        console.log('🔄 BackButton hidden during language change');
      } catch (e) {
        console.warn('Failed to hide BackButton:', e);
      }
    }
    
    try {
      if (['en', 'ru', 'kk'].includes(newLanguage)) {
        // Обновляем язык локально
        setLanguageState(newLanguage);
        setIsInitialized(true);
        
        // Вибрация при смене языка
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('light');
        }
        
        // Обновляем в БД
        try {
          await habitService.updateUserLanguage(newLanguage);
          console.log(`✅ Language updated to ${newLanguage} in database`);
        } catch (error) {
          console.error('Failed to update language in database:', error);
          setLanguageState(language);
          throw error;
        }
      }
    } finally {
      // 🔥 ЗАДЕРЖКА перед возвратом BackButton
      setTimeout(() => {
        // Восстанавливаем BackButton если он был видим
        if (tg?.BackButton && backButtonWasVisible) {
          try {
            tg.BackButton.show();
            console.log('🔄 BackButton restored after language change');
          } catch (e) {
            console.warn('Failed to show BackButton:', e);
          }
        }
        
        setIsChanging(false);
      }, 500); // 🔥 Задержка 500ms для плавного перехода
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