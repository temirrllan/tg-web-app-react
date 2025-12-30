// src/components/hints/WeekNavigationHint.jsx
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

  return (
    <>
      {/* Затемнённый overlay */}
      <div className="week-hint-overlay-wrapper" onClick={handleClose}>
        {/* Подсветка области WeekNavigation */}
        <div className="week-hint-highlight" />
        
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
      
      {/* Пульсирующие круги по бокам */}
      <div className="week-hint-pulse-left" />
      <div className="week-hint-pulse-right" />
    </>
  );
};

export default WeekNavigationHint;