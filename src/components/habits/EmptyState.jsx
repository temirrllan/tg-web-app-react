import React from 'react';
import Button from '../common/Button';
import './EmptyState.css';

const EmptyState = ({ onCreateClick }) => {
  return (
    <div className="empty-state">
      <div className="empty-state__image">
        <img src="/images/Lazy_Bear.png" alt="No habits" />
      </div>
      
      <h2 className="empty-state__title">No Habits Yet</h2>
      <p className="empty-state__text">
        All your habits will show up here.<br />
        Tap to + to add a Habit.
      </p>
      
      <Button
        variant="primary"
        size="large"
        onClick={onCreateClick}
      >
        Create First Habit
      </Button>
    </div>
  );
};

export default EmptyState;