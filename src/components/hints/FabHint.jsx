// src/components/hints/FabHint.jsx - ИСПРАВЛЕНО: предотвращение повторного открытия
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
    // КРИТИЧНО: Останавливаем всплытие события
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Вибрация при закрытии
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    console.log('🔴 FabHint closing...');
    
    // НОВОЕ: Задержка перед закрытием, чтобы предотвратить всплытие к FAB
    setTimeout(() => {
      onClose();
    }, 50);
  };

  const handleOverlayClick = (e) => {
    // КРИТИЧНО: Проверяем, что клик был именно на overlay или cutout-circle
    const target = e.target;
    const isOverlay = target.classList.contains('fab-hint-overlay-wrapper');
    const isCutout = target.classList.contains('fab-hint-cutout-circle');
    
    if (isOverlay || isCutout) {
      e.preventDefault();
      e.stopPropagation();
      handleClose(e);
    }
  };

  const handleBubbleClick = (e) => {
    // Предотвращаем закрытие при клике на сам bubble
    e.stopPropagation();
  };

  if (!show) return null;

  return (
    <>
      {/* Затемнённый overlay - перехватывает клики */}
      <div 
        className="fab-hint-overlay-wrapper" 
        onClick={handleOverlayClick}
        onTouchEnd={handleOverlayClick}
      >
        {/* Прозрачный круг с огромной тенью = затемнение всего кроме круга */}
        <div 
          className="fab-hint-cutout-circle" 
          onClick={handleOverlayClick}
          onTouchEnd={handleOverlayClick}
        />
        
        <div className="fab-hint-container" onClick={handleBubbleClick}>
          {/* Белый балун с хвостиком */}
          <div className="fab-hint-bubble" onClick={handleBubbleClick}>
            <p className="fab-hint-text">
              {texts.message}
            </p>
            <button 
              className="fab-hint-button" 
              onClick={handleClose}
              onTouchEnd={handleClose}
              type="button"
            >
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