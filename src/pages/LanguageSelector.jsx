import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './LanguageSelector.css';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import { useTelegram } from '../hooks/useTelegram';

const LanguageSelector = ({ onClose }) => {
  const { tg } = useTelegram();
  const { t, language, setLanguage, isChanging } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isSelecting, setIsSelecting] = useState(false);
  const backButtonHandlerRef = useRef(null);
  useTelegramTheme();

  // 🔥 Устанавливаем текст BackButton ОДИН РАЗ при монтировании
  useEffect(() => {
    if (!tg?.BackButton) return;
    
    // Определяем текст "Назад" на текущем языке
    const backTexts = {
      en: 'Back',
      ru: 'Назад',
      kk: 'Артқа'
    };
    
    const backText = backTexts[language] || backTexts['en'];
    
    console.log('🔙 Setting BackButton text once:', backText);
    
    try {
      // Устанавливаем текст один раз
      if (typeof tg.BackButton.setText === 'function') {
        tg.BackButton.setText(backText);
      }
      
      // Показываем кнопку
      tg.BackButton.show();
      
      // Обработчик клика
      const handleBack = () => {
        console.log('🔙 BackButton clicked, closing...');
        onClose();
      };
      
      backButtonHandlerRef.current = handleBack;
      tg.BackButton.onClick(handleBack);
      
      // Cleanup: скрываем кнопку при размонтировании
      return () => {
        try {
          tg.BackButton.offClick(backButtonHandlerRef.current);
          tg.BackButton.hide();
          console.log('🔙 BackButton cleanup done');
        } catch (e) {
          console.warn('BackButton cleanup error:', e);
        }
      };
    } catch (error) {
      console.warn('BackButton setup error:', error);
    }
  }, []); // ⚠️ Пустой массив - выполняется ТОЛЬКО при монтировании

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша' }
  ];
  
  const handleLanguageSelect = async (langCode) => {
    if (isSelecting || isChanging) return;
    
    setIsSelecting(true);
    setSelectedLanguage(langCode);
    
    // Добавляем вибрацию
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    
    // Применяем изменение языка
    await setLanguage(langCode);
    
    // Закрываем экран
    setTimeout(() => {
      onClose();
    }, 150);
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