import React, { createContext, useState, useEffect, useCallback } from 'react';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import kk from '../locales/kk.json';
import { habitService } from '../services/habits';
import cacheService from '../services/cacheService';

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

// Определяем язык из Telegram ДО первого рендера
function detectTelegramLanguage() {
  try {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const langCode = tgUser?.language_code?.toLowerCase()?.trim();
    if (!langCode) return 'en';

    if (langCode === 'kk' || langCode === 'kz' || langCode.startsWith('kk-') || langCode.startsWith('kk_') || langCode.startsWith('kz-') || langCode.startsWith('kz_')) {
      return 'kk';
    }
    if (langCode === 'ru' || langCode.startsWith('ru-') || langCode.startsWith('ru_')) {
      return 'ru';
    }
    return 'en';
  } catch {
    return 'en';
  }
}

function normalizeLanguage(lang) {
  if (!lang) return 'en';
  const l = lang.toLowerCase().trim();
  if (l === 'kk' || l === 'kz') return 'kk';
  if (l === 'ru') return 'ru';
  if (l === 'en') return 'en';
  return 'en';
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => detectTelegramLanguage());
  const [isChanging, setIsChanging] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Функция инициализации языка из данных пользователя (вызывается из App.jsx после авторизации)
  const initializeLanguage = useCallback((userLanguage) => {
    console.log('🌍 Initializing language from user data:', userLanguage);
    const normalizedLanguage = normalizeLanguage(userLanguage);
    setLanguageState(normalizedLanguage);
    setIsInitialized(true);
    console.log('✅ Language initialized to:', normalizedLanguage);
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
        
        // Сбрасываем кэш данных, зависящих от языка (категории, привычки)
        cacheService.invalidate('categories_en');
        cacheService.invalidate('categories_ru');
        cacheService.invalidate('categories_kk');
        cacheService.invalidate('habits_');

        // Уведомляем компоненты о смене языка для перезагрузки данных
        window.dispatchEvent(new CustomEvent('language-changed', { detail: { language: newLanguage } }));

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