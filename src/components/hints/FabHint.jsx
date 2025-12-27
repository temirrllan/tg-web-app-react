// src/components/hints/FabHint.jsx
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
        {/* Пульсирующий круг */}
        <div className="fab-hint-pulse" />
        
        {/* Стрелка-указатель */}
        <div className="fab-hint-arrow">
          <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M15 15 L45 45 M45 45 L45 25 M45 45 L25 45" 
              stroke="#A7D96C" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round"
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