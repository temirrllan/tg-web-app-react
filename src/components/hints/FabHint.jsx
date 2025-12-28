// src/components/hints/FabHint.jsx - УЛУЧШЕННАЯ ВЕРСИЯ
import React, { useEffect } from 'react';
import './FabHint.css';
import { useTranslation } from '../../hooks/useTranslation';

// Переводы для подсказки
const translations = {
  en: {
    message: 'Tap here to create your first habit! 🎯',
    gotIt: 'Got it!'
  },
  ru: {
    message: 'Нажмите сюда, чтобы создать свою первую привычку! 🎯',
    gotIt: 'Понятно!'
  },
  kk: {
    message: 'Алғашқы әдетіңізді құру үшін мұнда басыңыз! 🎯',
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
    <div className="fab-hint-overlay" onClick={handleClose}>
      <div className="fab-hint-container" onClick={(e) => e.stopPropagation()}>
        {/* Пульсирующие круги */}
        <div className="fab-hint-pulse" />
        
        {/* Яркая стрелка-указатель */}
        <div className="fab-hint-arrow">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Внешняя обводка для яркости */}
            <path 
              d="M15 15 L55 55 M55 55 L55 30 M55 55 L30 55" 
              stroke="#FFFFFF" 
              strokeWidth="8" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              opacity="0.3"
            />
            {/* Основная стрелка */}
            <path 
              d="M15 15 L55 55 M55 55 L55 30 M55 55 L30 55" 
              stroke="#A7D96C" 
              strokeWidth="5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            {/* Точка на конце стрелки для акцента */}
            <circle 
              cx="55" 
              cy="55" 
              r="4" 
              fill="#A7D96C"
            />
          </svg>
        </div>
        
        {/* Балун с текстом */}
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
  );
};

export default FabHint;