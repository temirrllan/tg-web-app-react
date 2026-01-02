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
  const backButtonSetupRef = useRef(false);
  useTelegramTheme();

  // 🔥 КРИТИЧНО: Устанавливаем BackButton ТОЛЬКО ОДИН РАЗ
  useEffect(() => {
    if (!tg?.BackButton || backButtonSetupRef.current) return;
    
    backButtonSetupRef.current = true; // Помечаем, что уже настроили
    
    console.log('🔙 [LanguageSelector] Setting up BackButton');
    
    const backButton = tg.BackButton;
    
    // Определяем текст на текущем языке
    const getBackText = (lang) => {
      const texts = {
        en: 'Back',
        ru: 'Назад',
        kk: 'Артқа'
      };
      return texts[lang] || texts['en'];
    };
    
    const initialText = getBackText(language);
    
    // Обработчик клика
    const handleBackClick = () => {
      console.log('🔙 [LanguageSelector] Back button clicked');
      onClose();
    };
    
    try {
      // 1. Отключаем все предыдущие обработчики
      backButton.offClick(handleBackClick);
      
      // 2. Устанавливаем текст
      if (typeof backButton.setText === 'function') {
        backButton.setText(initialText);
        console.log('✅ [LanguageSelector] Set text:', initialText);
      }
      
      // 3. Показываем кнопку
      backButton.show();
      
      // 4. Добавляем обработчик
      backButton.onClick(handleBackClick);
      
      console.log('✅ [LanguageSelector] BackButton setup complete');
    } catch (error) {
      console.error('❌ [LanguageSelector] BackButton setup error:', error);
    }
    
    // Cleanup
    return () => {
      console.log('🧹 [LanguageSelector] Cleaning up BackButton');
      try {
        backButton.offClick(handleBackClick);
        backButton.hide();
        backButtonSetupRef.current = false;
      } catch (e) {
        console.warn('⚠️ [LanguageSelector] Cleanup error:', e);
      }
    };
  }, []); // Пустой массив - выполняется ТОЛЬКО при монтировании

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша' }
  ];
  
  const handleLanguageSelect = async (langCode) => {
    if (isSelecting || isChanging) {
      console.log('⚠️ Already selecting or changing language');
      return;
    }
    
    console.log('🌍 [LanguageSelector] Language selected:', langCode);
    
    setIsSelecting(true);
    setSelectedLanguage(langCode);
    
    // Вибрация
    if (window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      } catch (e) {
        console.warn('Haptic feedback failed:', e);
      }
    }
    
    try {
      // Применяем изменение языка
      await setLanguage(langCode);
      console.log('✅ [LanguageSelector] Language changed to:', langCode);
      
      // Небольшая задержка для завершения операции
      setTimeout(() => {
        console.log('🚪 [LanguageSelector] Closing...');
        onClose();
      }, 200);
    } catch (error) {
      console.error('❌ [LanguageSelector] Language change error:', error);
      setIsSelecting(false);
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