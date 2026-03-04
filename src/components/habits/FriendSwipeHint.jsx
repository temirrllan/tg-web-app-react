// src/components/habits/FriendSwipeHint.jsx
import React, { useEffect, useState } from 'react';
import './FriendSwipeHint.css';
import { useTranslation } from '../../hooks/useTranslation';

const translations = {
  en: {
    title: 'Friend Actions',
    swipeLeft: 'to send a',
    swipeLeftBold: 'punch reminder',
    swipeRight: 'to',
    swipeRightBold: 'remove friend',
    gotIt: 'Got it!'
  },
  ru: {
    title: 'Действия с другом',
    swipeLeft: '— отправить',
    swipeLeftBold: 'напоминание (панч)',
    swipeRight: '—',
    swipeRightBold: 'удалить друга',
    gotIt: 'Понятно!'
  },
  kk: {
    title: 'Дос әрекеттері',
    swipeLeft: '—',
    swipeLeftBold: 'еске салу жіберу',
    swipeRight: '—',
    swipeRightBold: 'досты жою',
    gotIt: 'Түсінікті!'
  }
};

/**
 * FriendSwipeHint — показывается один раз новым пользователям.
 * Props:
 *   show    {boolean}   - показывать или нет
 *   onClose {function}  - вызывается при закрытии
 */
const FriendSwipeHint = ({ show, onClose }) => {
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
      className={`fsh-overlay ${isHiding ? 'fsh-overlay--hiding' : ''}`}
      onClick={triggerClose}
    >
      <div className="fsh-card" onClick={(e) => e.stopPropagation()}>

        <h3 className="fsh-card__title">{texts.title}</h3>

        <div className="fsh-rows">
          <div className="fsh-row">
            <div className="fsh-row__icon fsh-row__icon--left">👊</div>
            <p className="fsh-row__text">
              <strong>Swipe left</strong> {texts.swipeLeft}{' '}
              <strong className="fsh-row__action">{texts.swipeLeftBold}</strong>
            </p>
          </div>

          <div className="fsh-row">
            <div className="fsh-row__icon fsh-row__icon--right">✕</div>
            <p className="fsh-row__text">
              <strong>Swipe right</strong> {texts.swipeRight}{' '}
              <strong className="fsh-row__action">{texts.swipeRightBold}</strong>
            </p>
          </div>
        </div>

        <div className="fsh-divider" />

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
