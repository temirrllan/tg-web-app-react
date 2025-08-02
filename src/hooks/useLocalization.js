import { useState, useEffect, useCallback } from 'react';

// Минимальный словарь для двух языков (расширять по мере нужды)
const dictionaries = {
  en: {
    welcome: 'Welcome',
    habitName: 'Habit name',
    goal: 'Goal',
    createHabit: 'Create habit',
    cancel: 'Cancel',
    badHabit: 'Bad habit 😈',
    // ... добавить остальные ключи по необходимости
  },
  ru: {
    welcome: 'Добро пожаловать',
    habitName: 'Название привычки',
    goal: 'Цель',
    createHabit: 'Создать привычку',
    cancel: 'Отмена',
    badHabit: 'Плохая привычка 😈',
    // ... и другие
  }
};

// Список поддерживаемых языков
const supportedLanguages = ['en', 'ru'];

// Получить валидный язык по коду, fallback на 'en'
const getValidLanguage = (lang) => {
  if (!lang) return 'en';
  const shortLang = lang.slice(0, 2).toLowerCase();
  return supportedLanguages.includes(shortLang) ? shortLang : 'en';
};

export const useLocalization = (telegramUserLanguageCode) => {
  const [language, setLanguage] = useState(getValidLanguage(telegramUserLanguageCode));
  const [dictionary, setDictionary] = useState(dictionaries[language]);

  useEffect(() => {
    setLanguage(getValidLanguage(telegramUserLanguageCode));
  }, [telegramUserLanguageCode]);

  useEffect(() => {
    setDictionary(dictionaries[language]);
  }, [language]);

  // Функция переключения языка вручную
  const switchLanguage = useCallback((lang) => {
    const validLang = getValidLanguage(lang);
    setLanguage(validLang);
  }, []);

  return {
    language,
    dictionary,
    switchLanguage,
  };
};
