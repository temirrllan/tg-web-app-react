// src/components/hints/WeekNavigationHint.jsx - С ДИНАМИЧЕСКОЙ ПОЗИЦИЕЙ
import React, { useEffect, useState, useRef } from 'react';
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
  const [position, setPosition] = useState({ top: 120, height: 70 });
  const [bubblePosition, setBubblePosition] = useState({ top: 200 });
  
  // Получаем текущие переводы
  const texts = translations[language] || translations.en;

  useEffect(() => {
    if (show) {
      // Находим WeekNavigation элемент и получаем его позицию
      const findWeekNavigation = () => {
        const weekNav = document.querySelector('.week-navigation');
        if (weekNav) {
          const rect = weekNav.getBoundingClientRect();
          console.log('📍 WeekNavigation position:', rect);
          
          setPosition({
            top: rect.top,
            height: rect.height
          });
          
          // Пузырь показываем ниже навигации с отступом
          setBubblePosition({
            top: rect.bottom + 10
          });
        } else {
          // Fallback если элемент не найден
          console.warn('⚠️ WeekNavigation element not found, using fallback');
          setTimeout(findWeekNavigation, 100);
        }
      };

      // Небольшая задержка для рендеринга DOM
      setTimeout(findWeekNavigation, 50);
      
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
          {/* Светящаяся область вокруг WeekNavigation - ДИНАМИЧЕСКАЯ ПОЗИЦИЯ */}
          <div 
            className="week-hint-spotlight" 
            style={{
              top: `${position.top}px`,
              height: `${position.height}px`
            }}
          />
          
          {/* Речевой пузырь с подсказкой - ДИНАМИЧЕСКАЯ ПОЗИЦИЯ */}
          <div 
            className="week-hint-bubble"
            style={{
              top: `${bubblePosition.top}px`
            }}
          >
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