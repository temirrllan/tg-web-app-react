import React from 'react';
import './EmptyState.css';
import bear3 from '../../../public/images/bear3.svg?url';
const EmptyState = () => {
  return (
    <div className="empty-state">
      <div className="empty-state__image">
        <img src={bear3} alt="No habits" />
      </div>
      
      <h2 className="empty-state__title">No Habits Yet</h2>
      <p className="empty-state__text">
        All your habits will show up here.<br />
        Tap to + to add a Habit.
      </p>
      
      
    </div>
  );
};

export default EmptyState;