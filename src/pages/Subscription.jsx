import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import Loader from '../components/common/Loader';
import SubscriptionNew from './SubscriptionNew';
import './Subscription.css';

const Subscription = ({ onClose, preselectedPlan = null }) => {
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
      
      // Если у пользователя уже есть подписка, загружаем историю
      if (status?.isPremium && status?.subscription?.isActive) {
        try {
          const historyData = await habitService.getSubscriptionHistory();
          setHistory(historyData.history || []);
        } catch (err) {
          console.log('History not available');
        }
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
  
  // Если у пользователя нет активной подписки - показываем новый интерфейс
  if (!subscription?.isPremium || !subscription?.subscription?.isActive) {
    return <SubscriptionNew onClose={onClose} preselectedPlan={preselectedPlan} />;
  }
  
  // Если у пользователя есть активная подписка - показываем текущий интерфейс
  const sub = subscription.subscription;
  
  return (
    <div className="subscription-page">
      <div className="subscription-page__content">
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
        
        {subscription?.subscription?.expiresAt && (
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