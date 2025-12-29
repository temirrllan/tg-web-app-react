// src/components/hints/WeekNavigationHint.jsx
import React, { useEffect } from 'react';
import './WeekNavigationHint.css';
import { useTranslation } from '../../hooks/useTranslation';

// Переводы для подсказки
const translations = {
  en: {
    message: 'Swipe left or right to view other days of the week',
    gotIt: 'Got it!'
  },
  ru: {
    message: 'Свайпайте влево или вправо, чтобы посмотреть другие дни недели',
    gotIt: 'Понятно!'
  },
  kk: {
    message: 'Аптаның басқа күндерін көру үшін солға немесе оңға сырғытыңыз',
    gotIt: 'Түсінікті!'
  }
};

const WeekNavigationHint = ({ show, onClose }) => {
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
      {/* Затемнённый overlay */}
      <div className="week-hint-overlay" onClick={handleClose}>
        <div className="week-hint-container" onClick={(e) => e.stopPropagation()}>
          {/* Светящаяся область вокруг WeekNavigation */}
          <div className="week-hint-spotlight" />
          
          {/* Речевой пузырь с подсказкой */}
          <div className="week-hint-bubble">
            <p className="week-hint-text">
              {texts.message}
            </p>
            
            {/* Демонстрация свайпа стрелками */}
            <div className="week-hint-swipe-icon">
              <span className="week-hint-arrow">←</span>
              <span className="week-hint-arrow">→</span>
            </div>
            
            <button className="week-hint-button" onClick={handleClose}>
              {texts.gotIt}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WeekNavigationHint;