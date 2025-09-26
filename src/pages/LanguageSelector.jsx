import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useTranslation } from '../hooks/useTranslation';
import './LanguageSelector.css';

const LanguageSelector = ({ onClose }) => {
  useNavigation(onClose);
  const { t, language, setLanguage, isChanging } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isSelecting, setIsSelecting] = useState(false);
  
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша' }
  ];
  
  const handleLanguageSelect = (langCode) => {
    if (isSelecting || isChanging) return;
    
    setIsSelecting(true);
    setSelectedLanguage(langCode);
    
    // Применяем изменение языка
    setTimeout(() => {
      setLanguage(langCode);
      
      // Добавляем вибрацию
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      
      // Небольшая задержка перед закрытием для плавности
      setTimeout(() => {
        onClose();
      }, 200);
    }, 100);
  };
  
  return (
    <div className="language-selector">
      <div className="language-selector__content">
        <h3 className="language-selector__heading">{t('settings.language')}</h3>
        
        <div className="language-selector__list">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-selector__item ${
                selectedLanguage === lang.code ? 'language-selector__item--selected' : ''
              }`}
              onClick={() => handleLanguageSelect(lang.code)}
              disabled={isSelecting || isChanging}
            >
              <div className="language-selector__item-info">
                <span className="language-selector__item-name">{lang.nativeName}</span>
                <span className="language-selector__item-subtitle">{t(`languages.${lang.code}`)}</span>
              </div>
              {selectedLanguage === lang.code && (
                <span className="language-selector__item-check">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;