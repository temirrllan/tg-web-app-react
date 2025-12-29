// src/components/hints/FabHint.jsx - С ВЫРЕЗОМ ДЛЯ FAB
import React, { useEffect } from 'react';
import './FabHint.css';
import { useTranslation } from '../../hooks/useTranslation';

// Переводы для подсказки
const translations = {
  en: {
    message: 'Tap here to see something!',
    gotIt: 'Got it!'
  },
  ru: {
    message: 'Нажмите сюда, чтобы увидеть что-то!',
    gotIt: 'Понятно!'
  },
  kk: {
    message: 'Бірдеңе көру үшін осы жерді басыңыз!',
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

  const handleClose = () => {
    // Вибрация при закрытии
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    onClose();
  };

  if (!show) return null;

  return (
    <>
      {/* SVG с маской для выреза */}
      <svg style={{ position: 'fixed', width: 0, height: 0 }}>
        <defs>
          <mask id="fab-cutout-mask">
            {/* Белый фон = видимая область */}
            <rect width="100%" height="100%" fill="white" />
            {/* Чёрный круг = вырез (невидимая область) */}
            <circle 
              cx="calc(100vw - 52px)" 
              cy="calc(100vh - 52px)" 
              r="40" 
              fill="black" 
            />
          </mask>
        </defs>
      </svg>

      {/* Затемнённый overlay с вырезом */}
      <div className="fab-hint-overlay-wrapper" onClick={handleClose}>
        <div className="fab-hint-overlay" />
        
        <div className="fab-hint-container" onClick={(e) => e.stopPropagation()}>
          {/* Белый балун с хвостиком */}
          <div className="fab-hint-bubble">
            <p className="fab-hint-text">
              {texts.message}
            </p>
            <button className="fab-hint-button" onClick={handleClose}>
              {texts.gotIt}
            </button>
          </div>
        </div>
      </div>
      
      {/* Пульсирующие круги ПОВЕРХ всего */}
      <div className="fab-hint-pulse-container">
        <div className="fab-hint-pulse" />
      </div>
    </>
  );
};

export default FabHint;