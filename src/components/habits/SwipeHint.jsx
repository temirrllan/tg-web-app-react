// src/components/habits/SwipeHint.jsx
import React, { useEffect, useState } from 'react';
import './SwipeHint.css';
import { useTranslation } from '../../hooks/useTranslation';

const translations = {
  en: {
    title: 'Quick Actions',
    swipeLeft: 'to mark habit as',
    swipeLeftBold: 'completed',
    swipeRight: 'to mark as',
    swipeRightBold: 'failed / undo',
    gotIt: 'Got it!'
  },
  ru: {
    title: 'Быстрые действия',
    swipeLeft: '— отметить как',
    swipeLeftBold: 'выполнено',
    swipeRight: '— отметить как',
    swipeRightBold: 'провалено / отмена',
    gotIt: 'Понятно!'
  },
  kk: {
    title: 'Жылдам әрекеттер',
    swipeLeft: '— орындалды деп',
    swipeLeftBold: 'белгілеу',
    swipeRight: '— орындалмады деп',
    swipeRightBold: 'белгілеу / болдырмау',
    gotIt: 'Түсінікті!'
  }
};

/**
 * SwipeHint — показывается один раз новым пользователям.
 * Props:
 *   show    {boolean}   - показывать или нет
 *   onClose {function}  - вызывается при закрытии
 */
const SwipeHint = ({ show, onClose }) => {
  const { language } = useTranslation();
  const texts = translations[language] || translations.ru;

  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding]   = useState(false);

  useEffect(() => {
    if (!show) return;

    setIsVisible(true);
    setIsHiding(false);

    // Авто-закрытие через 6 секунд
    const timer = setTimeout(() => triggerClose(), 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const triggerClose = () => {
    setIsHiding(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!show || !isVisible) return null;

  return (
    <div
      className={`sh-overlay ${isHiding ? 'sh-overlay--hiding' : ''}`}
      onClick={triggerClose}
    >
      <div className="sh-card" onClick={(e) => e.stopPropagation()}>

        <h3 className="sh-card__title">{texts.title}</h3>

        <div className="sh-rows">
          <div className="sh-row">
            <div className="sh-row__icon sh-row__icon--left">←</div>
            <p className="sh-row__text">
              <strong>Swipe left</strong> {texts.swipeLeft}{' '}
              <strong className="sh-row__action">{texts.swipeLeftBold}</strong>
            </p>
          </div>

          <div className="sh-row">
            <div className="sh-row__icon sh-row__icon--right">→</div>
            <p className="sh-row__text">
              <strong>Swipe right</strong> {texts.swipeRight}{' '}
              <strong className="sh-row__action">{texts.swipeRightBold}</strong>
            </p>
          </div>
        </div>

        <div className="sh-divider" />

        <button
          className="sh-card__btn"
          onClick={(e) => { e.stopPropagation(); triggerClose(); }}
          type="button"
        >
          {texts.gotIt}
        </button>

      </div>
    </div>
  );
};

export default SwipeHint;
