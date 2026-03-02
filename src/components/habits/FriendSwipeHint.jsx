// src/components/habits/FriendSwipeHint.jsx
import React, { useEffect, useState, useRef } from 'react';
import './FriendSwipeHint.css';
import { useTranslation } from '../../hooks/useTranslation';

const translations = {
  en: {
    title: 'Friend Actions',
    swipeLeft: 'to send a',
    swipeLeftBold: 'punch reminder',
    swipeRight: 'to',
    swipeRightBold: 'remove friend',
    dontShow: "Don't show again",
    gotIt: 'Got it!'
  },
  ru: {
    title: 'Действия с другом',
    swipeLeft: '— отправить',
    swipeLeftBold: 'напоминание (панч)',
    swipeRight: '—',
    swipeRightBold: 'удалить друга',
    dontShow: 'Больше не показывать',
    gotIt: 'Понятно!'
  },
  kk: {
    title: 'Дос әрекеттері',
    swipeLeft: '—',
    swipeLeftBold: 'еске салу жіберу',
    swipeRight: '—',
    swipeRightBold: 'досты жою',
    dontShow: 'Енді көрсетпе',
    gotIt: 'Түсінікті!'
  }
};

/**
 * FriendSwipeHint
 * Props:
 *   show    {boolean}  - whether to show the hint
 *   onClose {function(dontShowAgain: boolean)} - called when user closes
 */
const FriendSwipeHint = ({ show, onClose }) => {
  const { language } = useTranslation();
  const texts = translations[language] || translations.ru;

  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding]   = useState(false);
  const [dontShow, setDontShow]   = useState(false);

  const dontShowRef = useRef(false);
  dontShowRef.current = dontShow;

  useEffect(() => {
    if (!show) return;

    setIsVisible(true);
    setIsHiding(false);
    setDontShow(false);

    // Auto-dismiss after 6 s
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
      className={`fsh-overlay ${isHiding ? 'fsh-overlay--hiding' : ''}`}
      onClick={triggerClose}
    >
      <div className="fsh-card" onClick={(e) => e.stopPropagation()}>

        {/* Title */}
        <h3 className="fsh-card__title">{texts.title}</h3>

        {/* Swipe rows */}
        <div className="fsh-rows">
          {/* Swipe left → punch */}
          <div className="fsh-row">
            <div className="fsh-row__icon fsh-row__icon--left">👊</div>
            <p className="fsh-row__text">
              <strong>Swipe left</strong> {texts.swipeLeft}{' '}
              <strong className="fsh-row__action">{texts.swipeLeftBold}</strong>
            </p>
          </div>

          {/* Swipe right → remove */}
          <div className="fsh-row">
            <div className="fsh-row__icon fsh-row__icon--right">✕</div>
            <p className="fsh-row__text">
              <strong>Swipe right</strong> {texts.swipeRight}{' '}
              <strong className="fsh-row__action">{texts.swipeRightBold}</strong>
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="fsh-divider" />

        {/* "Don't show again" checkbox */}
        <label
          className="fsh-checkbox"
          onClick={(e) => { e.stopPropagation(); setDontShow(v => !v); }}
        >
          <span className={`fsh-checkbox__box ${dontShow ? 'fsh-checkbox__box--checked' : ''}`}>
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
          <span className="fsh-checkbox__label">{texts.dontShow}</span>
        </label>

        {/* Got it button */}
        <button
          className="fsh-card__btn"
          onClick={(e) => { e.stopPropagation(); triggerClose(); }}
          type="button"
        >
          {texts.gotIt}
        </button>

      </div>
    </div>
  );
};

export default FriendSwipeHint;
