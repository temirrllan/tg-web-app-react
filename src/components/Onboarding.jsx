import React from 'react';
import './Onboarding.css';
import illustration from '../../public/images/onboarding.png';

const Onboarding = ({ onComplete }) => {
  return (
    <div className="onboarding">
      <div className="onboarding__top">
        <img src={illustration} alt="Habit Tracker Illustration" className="onboarding__img" />
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
