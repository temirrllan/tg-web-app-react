import React from 'react';
import Button from './common/Button';
import './Onboarding.css';

const Onboarding = ({ user, onComplete }) => {
  return (
    <div className="onboarding">
      <div className="onboarding__image">
        <img src="/images/welcome.svg" alt="Welcome" />
      </div>
      
      <h1 className="onboarding__title">
        Welcome to the<br />Habit Tracker!
      </h1>
      
      <p className="onboarding__text">
        Create healthy habits and achieve<br />
        your goals with our easy-to-use<br />
        tracker.
      </p>
      
      <Button
        variant="success"
        size="large"
        fullWidth
        onClick={onComplete}
        className="onboarding__button"
      >
        Create a New Habit
      </Button>
    </div>
  );
};

export default Onboarding;