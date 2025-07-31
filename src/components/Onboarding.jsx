import React from 'react';
import './Onboarding.css';
import illustration from '../../public/images/onboarding.png'; // путь проверь!

const Onboarding = ({ onComplete }) => {
  return (
    <div className="onboarding">
      <div className="onboarding__top">
        <img src={illustration} alt="Habit Tracker Illustration" className="onboarding__img" />
      </div>
      {/* SVG-дуга для плавного перехода */}
      <div className="onboarding__wave">
        <svg viewBox="0 0 375 80" width="100%" height="80" preserveAspectRatio="none">
          <path d="M0,80 Q187.5,0 375,80 L375,0 L0,0 Z" fill="#fff"/>
        </svg>
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
};

export default Onboarding;
