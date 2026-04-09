import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Onboarding.css';
import illustration from '../../public/images/onboarding.png';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import kk from '../locales/kk.json';

// Определяем язык напрямую из Telegram — не зависим от LanguageContext,
// который может ещё не обновиться к моменту первого рендера Onboarding
function detectLanguage() {
  try {
    const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    if (tgLang) {
      const code = tgLang.toLowerCase();
      if (code === 'ru' || code.startsWith('ru')) return 'ru';
      if (code === 'kk' || code === 'kz' || code.startsWith('kk') || code.startsWith('kz')) return 'kk';
    }
  } catch {}
  return 'en';
}

const locales = { en, ru, kk };

const Onboarding = ({ onComplete }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef(null);
  useTelegramTheme();

  const lang = useMemo(() => detectLanguage(), []);
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
