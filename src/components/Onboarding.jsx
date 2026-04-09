import React, { useState, useRef, useEffect } from 'react';
import './Onboarding.css';
import illustration from '../../public/images/onboarding.png';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import kk from '../locales/kk.json';

const locales = { en, ru, kk };

const Onboarding = ({ user, onComplete }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef(null);
  useTelegramTheme();

  // Берём язык напрямую из user prop (приходит из auth response)
  const lang = ['ru', 'kk', 'en'].includes(user?.language) ? user.language : 'en';
  const t = (key) => {
    const keys = key.split('.');
    let val = locales[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    return val || key;
  };

  useEffect(() => {
    if (imgRef.current?.complete) {
      setImageLoaded(true);
    }
  }, []);

  return (
    <div className="onboarding ob-enter">
      <div className="onboarding__top">
        <img
          ref={imgRef}
          src={illustration}
          alt="Habit Tracker"
          className={`onboarding__img${imageLoaded ? ' onboarding__img--riding' : ''}`}
          loading="eager"
          onLoad={() => setImageLoaded(true)}
        />
      </div>
      <div className="onboarding__card ob-card-enter">
        <h2 className="onboarding__title">
          {t('onboarding.title1')}<br />
          {t('onboarding.title2')}
        </h2>
        <p className="onboarding__desc">
          {t('onboarding.desc')}
        </p>
        <button className="onboarding__btn ob-btn-enter" onClick={onComplete}>
          {t('onboarding.button')}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
