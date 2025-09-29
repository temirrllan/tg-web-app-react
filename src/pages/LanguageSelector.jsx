// src/pages/LanguageSelector.jsx
import React, { useState } from 'react';
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
    { code: 'kk', name: 'Kazakh',  nativeName: 'Қазақша' }
  ];

  const handleLanguageSelect = async (langCode) => {
    if (isSelecting || isChanging || langCode === selectedLanguage) return;

    try {
      setIsSelecting(true);
      setSelectedLanguage(langCode);

      // ВАЖНО: ждём, пока язык будет установлен в контексте и сохранён в БД
      await setLanguage(langCode);

      // Лёгкий хаптик по желанию
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');

      // Закрываем только после успешного сохранения
      onClose();
    } catch (e) {
      console.error('Language change failed:', e);
      // По желанию показать алерт
      window.Telegram?.WebApp?.showAlert?.(t('common.error') || 'Error');
      setIsSelecting(false);
      setSelectedLanguage(language); // откатываем визуально
    }
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
                <span className="language-selector__item-subtitle">
                  {t(`languages.${lang.code}`)}
                </span>
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
