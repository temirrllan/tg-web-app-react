import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  return {
    t: context.t,
    language: context.language,
    setLanguage: context.setLanguage,
    availableLanguages: context.availableLanguages,
    isChanging: context.isChanging,
    initializeLanguage: context.initializeLanguage,
    // добавлено: чтобы уметь ждать язык из БД и не флэшить дефолт
    isLoading: context.isLoading,
  };
};
