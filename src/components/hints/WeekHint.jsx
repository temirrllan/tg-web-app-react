// src/components/hints/WeekHint.jsx
import React, { useEffect } from 'react';
import './WeekHint.css';
import { useTranslation } from '../../hooks/useTranslation';

// Переводы для подсказки
const translations = {
  en: {
    message: 'Swipe to view your habits for different days of the week!',
    gotIt: 'Got it!'
  },
  ru: {
    message: 'Свайпайте, чтобы посмотреть привычки за разные дни недели!',
    gotIt: 'Понятно!'
  },
  kk: {
    message: 'Апта күндері бойынша әдеттеріңізді көру үшін сырғытыңыз!',
    gotIt: 'Түсінікті!'
  }
};

const WeekHint = ({ show, onClose }) => {
  const { language } = useTranslation();
  
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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Вибрация при закрытии
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    console.log('🔴 WeekHint closing...');
    
    setTimeout(() => {
      onClose();
    }, 50);
  };

  const handleOverlayClick = (e) => {
    const target = e.target;
    const isOverlay = target.classList.contains('week-hint-overlay-wrapper');
    
    if (isOverlay) {
      e.preventDefault();
      e.stopPropagation();
      handleClose(e);
    }
  };

  const handleBubbleClick = (e) => {
    e.stopPropagation();
  };

  if (!show) return null;

  return (
    <>
      {/* Затемнённый overlay */}
      <div 
        className="week-hint-overlay-wrapper" 
        onClick={handleOverlayClick}
        onTouchEnd={handleOverlayClick}
      >
        {/* Подсветка области week navigation */}
        <div className="week-hint-highlight" />
        
        {/* Анимация свайпа */}
        <div className="week-hint-swipe-indicator">
          <span className="week-hint-arrow">←</span>
          <span className="week-hint-arrow">→</span>
        </div>
        
        <div className="week-hint-container" onClick={handleBubbleClick}>
          {/* Белый балун с хвостиком */}
          <div className="week-hint-bubble" onClick={handleBubbleClick}>
            <p className="week-hint-text">
              {texts.message}
            </p>
            <button 
              className="week-hint-button" 
              onClick={handleClose}
              onTouchEnd={handleClose}
              type="button"
            >
              {texts.gotIt}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WeekHint;