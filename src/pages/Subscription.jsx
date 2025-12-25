import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import { useTranslation } from '../hooks/useTranslation';
import Loader from '../components/common/Loader';
import SubscriptionNew from './SubscriptionNew';
import './Subscription.css';
import { useTelegramTheme } from '../hooks/useTelegramTheme';

const Subscription = ({ onClose, preselectedPlan = null }) => {
  const { t } = useTranslation();
  useNavigation(onClose);
    useTelegramTheme();

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
        const message = 'Subscription cancelled successfully! You are now on the free plan.';
        
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert(message);
        } else {
          alert(message);
        }
        
        setTimeout(async () => {
          await loadSubscriptionData();
        }, 500);
        
      } else {
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
  
  if (!subscription?.isPremium || !subscription?.subscription?.isActive) {
    return <SubscriptionNew onClose={onClose} preselectedPlan={preselectedPlan} />;
  }
  
  const sub = subscription.subscription;
  
  return (
    <div className="subscription-page">
      <div className="subscription-page__content">
        <div className="subscription-status subscription-status--premium">
          <h3>{sub.planName}</h3>
          {sub.expiresAt ? (
            <>
              <p>{t('subscriptionPage.premium.expires')}: {new Date(sub.expiresAt).toLocaleDateString()}</p>
              {sub.daysLeft !== null && (
                <p className={sub.daysLeft <= 7 ? 'days-warning' : ''}>
                  {t('subscriptionPage.premium.daysRemaining', { days: sub.daysLeft })}
                </p>
              )}
            </>
          ) : (
            <p>{t('subscriptionPage.premium.lifetimeAccess')}</p>
          )}
          <p className="subscription-usage">
            {t('subscriptionPage.premium.habitsCreated', { count: subscription.habitCount })}
          </p>
          
          {sub.isTrial && (
            <div className="trial-badge">{t('subscriptionPage.trial.badge')}</div>
          )}
        </div>
        
        {subscription?.subscription?.expiresAt && (
          <button 
            className="subscription-page__cancel-btn"
            onClick={handleCancelSubscription}
            disabled={isCancelling}
          >
            {isCancelling 
              ? t('subscriptionPage.buttons.cancelling') 
              : t('subscriptionPage.buttons.cancelSubscription')
            }
          </button>
        )}
        
        {/* {history.length > 0 && (
          <div className="subscription-history">
            <h3>{t('subscriptionPage.history.title')}</h3>
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <span className="history-action">{item.action}</span>
                <span className="history-date">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Subscription;