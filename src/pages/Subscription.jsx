import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import Loader from '../components/common/Loader';
import SubscriptionModal from '../components/modals/SubscriptionModal';
import './Subscription.css';

const Subscription = ({ onClose }) => {
  useNavigation(onClose);
  
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  useEffect(() => {
    loadSubscriptionData();
  }, []);
  
  const loadSubscriptionData = async () => {
    try {
      const status = await habitService.checkSubscriptionLimits();
      setSubscription(status);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpgradeClick = () => {
    setShowSubscriptionModal(true);
  };
  
  const handleSubscriptionActivate = async (plan) => {
    try {
      const result = await habitService.activatePremium(plan);
      
      if (result.success) {
        console.log('Premium activated successfully');
        
        // Обновляем статус подписки
        await loadSubscriptionData();
        
        // Закрываем модалку
        setShowSubscriptionModal(false);
        
        // Показываем уведомление
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert('Premium activated! Now you can create unlimited habits! 🎉');
        }
      }
    } catch (error) {
      console.error('Failed to activate premium:', error);
      
      setShowSubscriptionModal(false);
      
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert('Failed to activate premium. Please try again.');
      }
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
  
  // Проверяем статус подписки
  const isPremium = subscription?.isPremium || false;
  const isActive = subscription?.subscription?.isActive || false;
  
  // Если у пользователя нет премиум-подписки - показываем страницу оформления
  if (!isPremium || !isActive) {
    return (
      <>
        <div className="subscription-page subscription-page--upgrade">
          <div className="subscription-upgrade">
            <div className="subscription-upgrade__illustration">
              <img 
                src="/images/sub.png" 
                alt="PRO Features" 
                className="subscription-upgrade__image"
              />
            </div>
            
            <div className="subscription-upgrade__content">
              <h1 className="subscription-upgrade__title">Start Like a PRO</h1>
              <p className="subscription-upgrade__subtitle">Unlock All Features</p>
              
              <div className="subscription-upgrade__features">
                <div className="subscription-upgrade__feature">
                  <div className="subscription-upgrade__feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                      <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="subscription-upgrade__feature-text">Unlimited Habits</span>
                </div>
                
                <div className="subscription-upgrade__feature">
                  <div className="subscription-upgrade__feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                      <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="subscription-upgrade__feature-text">Advanced Statistics</span>
                </div>
                
                <div className="subscription-upgrade__feature">
                  <div className="subscription-upgrade__feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                      <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="subscription-upgrade__feature-text">Priority Support</span>
                </div>
              </div>
              
              <button 
                className="subscription-upgrade__button"
                onClick={handleUpgradeClick}
              >
                Upgrade to Premium
              </button>
              
              <p className="subscription-upgrade__note">
                Currently on Free plan: {subscription?.habitCount || 0} of {subscription?.limit || 3} habits used
              </p>
            </div>
          </div>
        </div>
        
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onContinue={handleSubscriptionActivate}
        />
      </>
    );
  }
  
  // Если у пользователя есть премиум - показываем стандартный интерфейс
  /* КОММЕНТИРОВАННЫЙ КОД - СТАРЫЙ ДИЗАЙН ДЛЯ ПРЕМИУМ-ПОЛЬЗОВАТЕЛЕЙ
  return (
    <div className="subscription-page">
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
      </div>
    </div>
  );
  */
  
  // ВРЕМЕННО: Показываем стандартный интерфейс для премиум-пользователей
  const renderSubscriptionStatus = () => {
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
      </div>
    </div>
  );
};

export default Subscription;