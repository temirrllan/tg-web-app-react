// src/components/hints/FabHint.jsx - С SVG МАСКОЙ
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

  // Вычисляем позицию FAB кнопки для выреза
  // По умолчанию: bottom: 24px, right: 24px, size: 56px
  const fabSize = 56;
  const fabBottom = 24;
  const fabRight = 24;
  
  // Используем viewBox и координаты относительно viewport
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 500;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  
  // Координаты центра круга (от левого верхнего угла)
  const circleCenterX = viewportWidth - fabRight - fabSize / 2;
  const circleCenterY = viewportHeight - fabBottom - fabSize / 2;
  const circleRadius = fabSize / 2 + 10; // +10px для запаса

  return (
    <>
      {/* Затемнённый overlay с SVG маской для выреза */}
      <div className="fab-hint-overlay-wrapper" onClick={handleClose}>
        {/* SVG с маской - создаёт вырез в затемнении */}
        <svg 
          className="fab-hint-svg-mask" 
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <mask id="fab-hint-mask">
              {/* Белый = видимо (затемнено), чёрный = скрыто (не затемнено) */}
              <rect width="100%" height="100%" fill="white"/>
              {/* Вырезаем круг для FAB кнопки - область НЕ затемняется */}
              <circle 
                cx={circleCenterX}
                cy={circleCenterY}
                r={circleRadius}
                fill="black"
              />
            </mask>
          </defs>
          {/* Затемнение с маской */}
          <rect 
            width="100%" 
            height="100%" 
            fill="rgba(0, 0, 0, 0.65)" 
            mask="url(#fab-hint-mask)"
          />
        </svg>
        
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