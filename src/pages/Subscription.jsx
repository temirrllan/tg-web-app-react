import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import Loader from '../components/common/Loader';
import './Subscription.css';

const Subscription = ({ onClose }) => {
  useNavigation(onClose);
  
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    loadSubscriptionData();
  }, []);
  
  const loadSubscriptionData = async () => {
    try {
      const status = await habitService.checkSubscriptionLimits();
      setSubscription(status);
      
      // Загружаем историю если есть метод
      try {
        const historyData = await habitService.getSubscriptionHistory();
        setHistory(historyData.history || []);
      } catch (err) {
        console.log('History not available');
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await habitService.cancelSubscription();
        await loadSubscriptionData();
        
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert('Subscription cancelled');
        }
      } catch (error) {
        console.error('Failed to cancel subscription:', error);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="subscription-page subscription-page--loading">
        <Loader size="large" />
      </div>
    );
  }
  
  const renderSubscriptionStatus = () => {
    if (!subscription || !subscription.subscription || !subscription.subscription.isActive) {
      return (
        <div className="subscription-status subscription-status--free">
          <h3>Free Plan</h3>
          <p>You can create up to 3 habits</p>
          <p className="subscription-usage">
            Using {subscription?.habitCount || 0} of 3 habits
          </p>
        </div>
      );
    }
    
    const sub = subscription.subscription;
    
    return (
      <div className="subscription-status subscription-status--premium">
        <h3>{sub.planName}</h3>
        {sub.expiresAt ? (
          <>
            <p>Expires: {new Date(sub.expiresAt).toLocaleDateString()}</p>
            {sub.daysLeft !== null && (
              <p className={sub.daysLeft <= 7 ? 'days-warning' : ''}>
                {sub.daysLeft} days remaining
              </p>
            )}
          </>
        ) : (
          <p>Lifetime access</p>
        )}
        <p className="subscription-usage">
          {subscription.habitCount} habits created (unlimited)
        </p>
        
        {sub.isTrial && (
          <div className="trial-badge">TRIAL</div>
        )}
      </div>
    );
  };
  
  return (
    <div className="subscription-page">
      {/* <div className="subscription-page__header">
        <button className="subscription-page__close" onClick={onClose}>
          Close
        </button>
        <h2>Subscription</h2>
      </div> */}
      
      <div className="subscription-page__content">
        {renderSubscriptionStatus()}
        
        {subscription?.subscription?.isActive && subscription?.subscription?.expiresAt && (
          <button 
            className="subscription-page__cancel-btn"
            onClick={handleCancelSubscription}
          >
            Cancel Subscription
          </button>
        )}
        
        {history.length > 0 && (
          <div className="subscription-history">
            <h3>History</h3>
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <span className="history-action">{item.action}</span>
                <span className="history-date">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;