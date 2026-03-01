// src/components/habits/SwipeHint.jsx
import React, { useEffect, useState, useRef } from 'react';
import './SwipeHint.css';
import { useTranslation } from '../../hooks/useTranslation';

const translations = {
  en: {
    title: 'Quick Actions',
    swipeLeft: 'to mark habit as',
    swipeLeftBold: 'completed',
    swipeRight: 'to mark as',
    swipeRightBold: 'failed / undo',
    dontShow: "Don't show again",
    gotIt: 'Got it!'
  },
  ru: {
    title: 'Быстрые действия',
    swipeLeft: '— отметить как',
    swipeLeftBold: 'выполнено',
    swipeRight: '— отметить как',
    swipeRightBold: 'провалено / отмена',
    dontShow: 'Больше не показывать',
    gotIt: 'Понятно!'
  },
  kk: {
    title: 'Жылдам әрекеттер',
    swipeLeft: '— орындалды деп',
    swipeLeftBold: 'белгілеу',
    swipeRight: '— орындалмады деп',
    swipeRightBold: 'белгілеу / болдырмау',
    dontShow: 'Енді көрсетпе',
    gotIt: 'Түсінікті!'
  }
};

/**
 * SwipeHint
 * Props:
 *   show    {boolean}  - whether to show the hint
 *   onClose {function(dontShowAgain: boolean)} - called when user closes
 */
const SwipeHint = ({ show, onClose }) => {
  const { language } = useTranslation();
  const texts = translations[language] || translations.ru;

  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding]   = useState(false);
  const [dontShow, setDontShow]   = useState(false);

  // Ref so timers always see the latest dontShow value
  const dontShowRef = useRef(false);
  dontShowRef.current = dontShow;

  useEffect(() => {
    if (!show) return;

    setIsVisible(true);
    setIsHiding(false);
    setDontShow(false);

    // Auto-dismiss after 6 s — longer so user can check the box
    const timer = setTimeout(() => triggerClose(), 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const triggerClose = () => {
    setIsHiding(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(dontShowRef.current);
    }, 300);
  };

  if (!show || !isVisible) return null;

  return (
    <div
      className={`sh-overlay ${isHiding ? 'sh-overlay--hiding' : ''}`}
      onClick={triggerClose}
    >
      <div className="sh-card" onClick={(e) => e.stopPropagation()}>

        {/* Title */}
        <h3 className="sh-card__title">{texts.title}</h3>

        {/* Swipe rows */}
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

        {/* Divider */}
        <div className="sh-divider" />

        {/* "Don't show again" checkbox */}
        <label
          className="sh-checkbox"
          onClick={(e) => { e.stopPropagation(); setDontShow(v => !v); }}
        >
          <span className={`sh-checkbox__box ${dontShow ? 'sh-checkbox__box--checked' : ''}`}>
            {dontShow && (
              <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 5l3.5 3.5L11 1"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className="sh-checkbox__label">{texts.dontShow}</span>
        </label>

        {/* Got it button */}
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
