// src/components/hints/WeekNavigationHint.jsx - БЕЗ КРУЖКОВ
import React, { useEffect } from 'react';
import './WeekNavigationHint.css';
import { useTranslation } from '../../hooks/useTranslation';

// Переводы для подсказки
const translations = {
  en: {
    message: 'Swipe left or right to view habits for different days of the week!',
    gotIt: 'Got it!'
  },
  ru: {
    message: 'Свайпайте влево или вправо, чтобы просмотреть привычки за разные дни недели!',
    gotIt: 'Понятно!'
  },
  kk: {
    message: 'Апталық әртүрлі күндердің әдеттерін көру үшін солға немесе оңға сырғытыңыз!',
    gotIt: 'Түсінікті!'
  }
};

const WeekNavigationHint = ({ show, onClose }) => {
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

  // Координаты для выреза WeekNavigation
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 500;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  
  // Область WeekNavigation: top: 220px, height: 100px, full width
  const cutoutY = 220;
  const cutoutHeight = 100;

  return (
    <>
      {/* Затемнённый overlay с SVG маской для выреза */}
      <div className="week-hint-overlay-wrapper" onClick={handleClose}>
        {/* SVG с маской - создаёт вырез в затемнении */}
        <svg 
          className="week-hint-svg-mask" 
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <mask id="week-hint-mask">
              {/* Белый = видимо (затемнено), чёрный = скрыто (не затемнено) */}
              <rect width="100%" height="100%" fill="white"/>
              {/* Вырезаем прямоугольник для WeekNavigation - область НЕ затемняется */}
              <rect 
                x="0" 
                y={cutoutY}
                width="100%" 
                height={cutoutHeight}
                fill="black"
                rx="16"
              />
            </mask>
          </defs>
          {/* Затемнение с маской */}
          <rect 
            width="100%" 
            height="100%" 
            fill="rgba(0, 0, 0, 0.65)" 
            mask="url(#week-hint-mask)"
          />
        </svg>
        
        <div className="week-hint-container" onClick={(e) => e.stopPropagation()}>
          {/* Белый балун с хвостиком */}
          <div className="week-hint-bubble">
            <p className="week-hint-text">
              {texts.message}
            </p>
            <button className="week-hint-button" onClick={handleClose}>
              {texts.gotIt}
            </button>
          </div>
        </div>
      </div>
      
      {/* Анимированная стрелка вверх */}
      <div className="week-hint-arrow-container">
        <div className="week-hint-arrow">↑</div>
      </div>
    </>
  );
};

export default WeekNavigationHint;