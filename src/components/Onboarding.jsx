import React, { useState, useRef, useEffect } from 'react';
import './Onboarding.css';
import illustration from '../../public/images/onboarding.png';
import { useTelegramTheme } from '../hooks/useTelegramTheme';

const Onboarding = ({ onComplete }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef(null);
  useTelegramTheme();

  useEffect(() => {
    // If image is already cached it won't fire onLoad, handle it here
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
          Welcome to the<br />
          Habit Tracker!
        </h2>
        <p className="onboarding__desc">
          Create healthy habits and achieve<br />
          your goals with our easy-to-use<br />
          tracker.
        </p>
        <button className="onboarding__btn ob-btn-enter" onClick={onComplete}>
          Create a New Habit
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
