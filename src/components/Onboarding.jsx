import React from 'react';
import './Onboarding.css';
import illustration from '../../public/images/onboarding.png';

const Onboarding = ({ user, onComplete }) => {
  return (
    <div className="onboarding">
      {/* Header */}
      <header className="onboarding__header">
        <button className="onboarding__btn onboarding__btn--text">
          Cancel
        </button>

        <div className="onboarding__title">
          <h1>Habit Tracker</h1>
          <p>mini‑app</p>
        </div>

        <button className="onboarding__btn onboarding__btn--icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="4"  cy="10" r="1.5" fill="white"/>
            <circle cx="10" cy="10" r="1.5" fill="white"/>
            <circle cx="16" cy="10" r="1.5" fill="white"/>
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <div className="onboarding__content">
        <div className="onboarding__illustration">
          <img
            src={illustration}
            alt="Habit Tracker Illustration"
          />
        </div>

        <div className="onboarding__text">
          <h2>
            Welcome to the<br/>
            Habit Tracker!
          </h2>
          <p>
            Create healthy habits and achieve<br/>
            your goals with our easy-to-use<br/>
            tracker.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="onboarding__footer">
        <button
          onClick={onComplete}
          className="onboarding__btn onboarding__btn--primary"
        >
          Create a New Habit
        </button>

        <div className="onboarding__tabs">
          <button className="onboarding__tab onboarding__tab--active">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1L1 8L8 15"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Onboarding
          </button>

          <button className="onboarding__tab">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M18 0H2C0.9 0 0 0.9 0 2V14C0 15.1 0.9 16 2 16H6L10 20L14 16H18C19.1 16 20 15.1 20 14V2C20 0.9 19.1 0 18 0ZM18 14H13.2L10 17.2L6.8 14H2V2H18V14Z"
              />
            </svg>
          </button>

          <button className="onboarding__tab">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M10 6V10L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <button className="onboarding__tab">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M15.5 8.5C15.5 8.5 14.5 6.5 12 6.5C9.5 6.5 8.5 8.5 8.5 8.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="8"  cy="12" r="1.5" fill="currentColor"/>
              <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </button>
        </div>

        <div className="onboarding__home-indicator">
          <div className="onboarding__home-indicator-bar"></div>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
