// src/components/hints/FabHint.jsx - ИСПРАВЛЕНО ЗАКРЫТИЕ
import React, { useEffect } from 'react';
import './FabHint.css';
import { useTranslation } from '../../hooks/useTranslation';

// Переводы для подсказки
const translations = {
  en: {
    message: 'Tap here to create your first habit!',
    gotIt: 'Got it!'
  },
  ru: {
    message: 'Нажмите сюда, чтобы создать свою первую привычку!',
    gotIt: 'Понятно!'
  },
  kk: {
    message: 'Алғашқы әдетіңізді жасау үшін осы жерді басыңыз!',
    gotIt: 'Түсінікті!'
  }
};

const FabHint = ({ show, onClose }) => {
  const { t, language } = useTranslation();
  
  // Получаем текущие переводы
  const texts = translations[language] || translations.en;

  useEffect(() => {
    if (show) {
      // Предотвращаем скролл когда подсказка открыта
      document.body.style.overflow = 'hidden';
      
      // Вибрация при показе
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [show]);

  const handleClose = (e) => {
    // Останавливаем всплытие события
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Вибрация при закрытии
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    console.log('🔴 FabHint closing...');
    onClose();
  };

  const handleOverlayClick = (e) => {
    // Закрываем только при клике на сам overlay, не на балун
    if (e.target === e.currentTarget) {
      handleClose(e);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Затемнённый overlay с вырезом через box-shadow */}
      <div className="fab-hint-overlay-wrapper" onClick={handleOverlayClick}>
        {/* Прозрачный круг с огромной тенью = затемнение всего кроме круга */}
        <div className="fab-hint-cutout-circle" onClick={handleClose} />
        
        <div className="fab-hint-container">
          {/* Белый балун с хвостиком */}
          <div className="fab-hint-bubble" onClick={(e) => e.stopPropagation()}>
            <p className="fab-hint-text">
              {texts.message}
            </p>
            <button 
              className="fab-hint-button" 
              onClick={handleClose}
              type="button"
            >
              {texts.gotIt}
            </button>
          </div>
        </div>
      </div>
      
      {/* Пульсирующие круги ПОВЕРХ всего */}
      <div className="fab-hint-pulse-container" onClick={handleClose}>
        <div className="fab-hint-pulse" />
      </div>
    </>
  );
};

export default FabHint;