import React from 'react';
import './Onboarding.css';
import illustration from '../../public/images/onboarding.png';

const Onboarding = ({ onComplete }) => {
  return (
    <div className="onboarding">
      <div className="onboarding__illustration">
        <img src={illustration} alt="Habit Tracker Illustration" />
      </div>
      <div className="onboarding__text">
        <h2>
          Welcome to the<br />
          Habit Tracker!
        </h2>
        <p>
          Create healthy habits and achieve<br />
          your goals with our easy-to-use<br />
          tracker.
        </p>
      </div>
      <button
        onClick={onComplete}
        className="onboarding__btn"
      >
        Create a New Habit
      </button>
    </div>
  );
};

export default Onboarding;
