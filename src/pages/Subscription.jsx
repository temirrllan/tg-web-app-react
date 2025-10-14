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
  const [isCancelling, setIsCancelling] = useState(false);
  
  useEffect(() => {
    loadSubscriptionData();
  }, []);
  
  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const status = await habitService.checkSubscriptionLimits();
      console.log('Subscription status loaded:', status);
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
    const confirmMessage = 'Are you sure you want to cancel your subscription? You will lose all premium features.';
    
    if (window.Telegram?.WebApp?.showConfirm) {
      window.Telegram.WebApp.showConfirm(confirmMessage, async (confirmed) => {
        if (confirmed) {
          await performCancelSubscription();
        }
      });
    } else {
      if (window.confirm(confirmMessage)) {
        await performCancelSubscription();
      }
    }
  };
  
  const performCancelSubscription = async () => {
  try {
    setIsCancelling(true);
    console.log('Starting subscription cancellation...');
    
    const result = await habitService.cancelSubscription();
    console.log('Cancellation result:', result);
    
    if (result.success) {
      // Показываем уведомление об успешной отмене
      const message = 'Subscription cancelled successfully! You are now on the free plan.';
      
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(message);
      } else {
        alert(message);
      }
      
      // Небольшая задержка перед перезагрузкой данных
      setTimeout(async () => {
        await loadSubscriptionData();
      }, 500);
      
    } else {
      // Показываем конкретную ошибку
      const errorMessage = result.error || 'Failed to cancel subscription';
      console.error('Cancellation failed:', errorMessage);
      
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(`Error: ${errorMessage}`);
      } else {
        alert(`Error: ${errorMessage}`);
      }
    }
  } catch (error) {
    console.error('Unexpected error during cancellation:', error);
    
    const errorMessage = 'An unexpected error occurred. Please try again.';
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(errorMessage);
    } else {
      alert(errorMessage);
    }
  } finally {
    setIsCancelling(false);
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
      {/* <div className="subscription-page__header">
        <button className="subscription-page__close" onClick={onClose}>
          Close
        </button>
        <h2>Subscription</h2>
        <div style={{ width: '50px' }}></div>
      </div> */}
      
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
        
        {/* Показываем кнопку отмены только если подписка не lifetime */}
        {subscription?.subscription?.expiresAt && (
          <button 
            className="subscription-page__cancel-btn"
            onClick={handleCancelSubscription}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
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