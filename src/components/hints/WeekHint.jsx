// src/components/hints/WeekHint.jsx
import React, { useState, useEffect } from 'react';
import './WeekHint.css';
import { useTranslation } from '../../hooks/useTranslation';

const translations = {
  en: {
    message: 'Scroll left or right to navigate between days of the week!',
    gotIt: 'Got it!'
  },
  ru: {
    message: 'Листайте влево или вправо, чтобы переключаться между днями недели!',
    gotIt: 'Понятно!'
  },
  kk: {
    message: 'Апта күндерін ауыстыру үшін солға немесе оңға жылжытыңыз!',
    gotIt: 'Түсінікті!'
  }
};

const WeekHint = ({ show, onClose }) => {
  const { language } = useTranslation();
  const texts = translations[language] || translations.en;

  // Bounding rect of the week navigation element
  const [navRect, setNavRect] = useState(null);

  useEffect(() => {
    if (show) {
      // Get the exact position of the week navigation
      const el = document.querySelector('.week-navigation');
      if (el) {
        const rect = el.getBoundingClientRect();
        setNavRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
        });
      }

      // Block page scroll while hint is open
      document.body.style.overflow = 'hidden';

      // Haptic feedback
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      return () => {
        document.body.style.overflow = '';
      };
    } else {
      setNavRect(null);
    }
  }, [show]);

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    setTimeout(() => onClose(), 50);
  };

  const handleBubbleClick = (e) => {
    e.stopPropagation();
  };

  if (!show) return null;

  // Tooltip appears 16px below the week navigation
  const bubbleTop = navRect ? navRect.bottom + 16 : 180;

  return (
    <>
      {/* Full-screen overlay — click anywhere to close */}
      <div
        className="wh-overlay"
        onClick={handleClose}
        onTouchEnd={handleClose}
      />

      {/* Spotlight rectangle over week navigation —
          box-shadow darkens everything outside this strip */}
      {navRect && (
        <div
          className="wh-spotlight"
          style={{
            top: navRect.top,
            left: navRect.left,
            width: navRect.width,
            height: navRect.height,
          }}
        >
          {/* Animated swipe gesture inside the highlighted strip */}
          <div className="wh-swipe">
            <span className="wh-swipe__arrow wh-swipe__arrow--left">‹</span>
            <div className="wh-swipe__track">
              <span className="wh-swipe__dot" />
              <span className="wh-swipe__dot" />
              <span className="wh-swipe__dot" />
            </div>
            <span className="wh-swipe__arrow wh-swipe__arrow--right">›</span>
          </div>
        </div>
      )}

      {/* Tooltip bubble below the spotlight */}
      <div
        className="wh-bubble"
        style={{ top: bubbleTop }}
        onClick={handleBubbleClick}
        onTouchEnd={handleBubbleClick}
      >
        {/* Arrow tip pointing up toward week navigation */}
        <div className="wh-bubble__arrow" />

        <p className="wh-bubble__text">{texts.message}</p>

        <button
          className="wh-bubble__btn"
          onClick={handleClose}
          onTouchEnd={handleClose}
          type="button"
        >
          {texts.gotIt}
        </button>
      </div>
    </>
  );
};

export default WeekHint;
