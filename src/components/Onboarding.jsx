import React from 'react';
import './Onboarding.css';
import illustration from '../../public/images/onboarding.png'; // или актуальный путь

const Onboarding = ({ onComplete }) => (
  <div className="onboarding">
    <div className="onboarding__top">
      <img src={illustration} alt="Habit Tracker" className="onboarding__img" />
      <div className="onboarding__wave">
        {/* SVG — скопируй отсюда или экспортируй из Figma */}
        <svg viewBox="0 0 375 60" width="100%" height="60" preserveAspectRatio="none">
          <path d="M0,40 Q60,55 187,40 Q310,25 375,60 L375,0 L0,0 Z" fill="#fff"/>
        </svg>
      </div>
    </div>
    <div className="onboarding__card">
      <h2 className="onboarding__title">
        Welcome to the<br />
        Habit Tracker!
      </h2>
      <p className="onboarding__desc">
        Create healthy habits and achieve<br />
        your goals with our easy-to-use<br />
        tracker.
      </p>
      <button className="onboarding__btn" onClick={onComplete}>
        Create a New Habit
      </button>
    </div>
  </div>
);
export default Onboarding;
