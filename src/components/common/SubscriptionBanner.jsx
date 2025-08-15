import React from 'react';
import Button from './Button';
import './SubscriptionBanner.css';

const SubscriptionBanner = ({ currentHabits, limit, onUpgrade }) => {
  const isAtLimit = currentHabits >= limit;

  return (
    <div className={`subscription-banner ${isAtLimit ? 'subscription-banner--warning' : ''}`}>
      <div className="subscription-banner__content">
        <p className="subscription-banner__text">
          {isAtLimit
            ? `You've reached the limit of ${limit} habits for free users`
            : `${currentHabits} of ${limit} habits used (Free plan)`}
        </p>
        {isAtLimit && (
          <Button
            size="small"
            variant="primary"
            onClick={onUpgrade}
          >
            Upgrade to Premium
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionBanner;
