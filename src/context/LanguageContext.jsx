import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import kk from '../locales/kk.json';
import { habitService } from '../services/habits';

const translations = { en, ru, kk };
const SUPPORTED = ['en', 'ru', 'kk'];

// Нормализация кода языка (ru-RU -> ru, en_US -> en, kz -> kk)
function normalizeLang(input) {
  if (!input || typeof input !== 'string') return 'en';
  const lang = input.toLowerCase().replace('_', '-'); // en_US -> en-US
  if (lang === 'kz' || lang.startsWith('kz-')) return 'kk';
  if (lang === 'kk' || lang.startsWith('kk-')) return 'kk';
  if (lang === 'ru' || lang.startsWith('ru-')) return 'ru';
  if (lang === 'en' || lang.startsWith('en-')) return 'en';
  // всё остальное — en
  return 'en';
}

export const LanguageContext = createContext({
  language: 'en',
  setLanguage: async () => {},
  t: () => '',
  availableLanguages: SUPPORTED,
  initializeLanguage: () => {},
  isLoading: true,
  isInitialized: false,
  isChanging: false,
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isChanging, setIsChanging] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Чтобы исключить двойную инициализацию (например, если auth внезапно вызовет повторно)
  const initCalledRef = useRef(false);

  // Инициализация из БД (вызывается из App.jsx после auth)
  const initializeLanguage = useCallback((userLanguage) => {
    if (initCalledRef.current) {
      // Уже инициализировано — ничего не делаем
      return;
    }
    initCalledRef.current = true;

    const normalized = normalizeLang(userLanguage);
    const finalLang = SUPPORTED.includes(normalized) ? normalized : 'en';

    console.log('🌍 LanguageContext: initializeLanguage ->', userLanguage, '=>', finalLang);

    setLanguageState(finalLang);
    setIsInitialized(true);
    setIsLoading(false);
  }, []);

  // Не грузим ничего сами — ждём initializeLanguage из App после авторизации
  useEffect(() => {
    if (!isInitialized) {
      // остаёмся в isLoading=true, пока App не дернёт initializeLanguage
      // можно подстраховаться защитным таймером, но оставим чисто
      return;
    }
    setIsLoading(false);
  }, [isInitialized]);

  // Переводы
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let bundle = translations[language] || translations.en;

    // По цепочке достаём ключ
    for (const k of keys) {
      if (bundle && typeof bundle === 'object' && k in bundle) {
        bundle = bundle[k];
      } else {
        // Фоллбек к английскому
        bundle = translations.en;
        for (const fk of keys) {
          if (bundle && typeof bundle === 'object' && fk in bundle) {
            bundle = bundle[fk];
          } else {
            return key;
          }
        }
        break;
      }
    }

    if (typeof bundle === 'string' && Object.keys(params).length) {
      let result = bundle;
      for (const [p, v] of Object.entries(params)) {
        result = result.replace(`{{${p}}}`, v);
      }
      return result;
    }
    return typeof bundle === 'string' ? bundle : key;
  }, [language]);

  // Смена языка + сохранение в БД
  const setLanguage = useCallback(async (newLanguage) => {
    const normalized = normalizeLang(newLanguage);
    const finalLang = SUPPORTED.includes(normalized) ? normalized : 'en';

    if (isChanging || finalLang === language) return;

    console.log(`🔄 Changing language: ${language} -> ${finalLang}`);
    setIsChanging(true);

    const prev = language;
    // Мгновенно обновляем локально для отзывчивости
    setLanguageState(finalLang);
    setIsInitialized(true);
    setIsLoading(false);

    // Хаптик (опционально)
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');

    try {
      // Важно: ждём БД
      const result = await habitService.updateUserLanguage(finalLang);
      console.log('✅ Language updated in DB:', result);
    } catch (err) {
      console.error('❌ Failed to update language in DB:', err);
      // Откат
      setLanguageState(prev);
    } finally {
      setIsChanging(false);
    }
  }, [language, isChanging]);

  const value = {
    language,
    setLanguage,
    t,
    availableLanguages: SUPPORTED,
    isChanging,
    initializeLanguage,
    isLoading,
    isInitialized,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
