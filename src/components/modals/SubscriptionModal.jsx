import React, { useState, useEffect } from 'react';
import './SubscriptionModal.css';
import sub from "../../../public/images/sub.png";
import { useNavigation } from '../../hooks/useNavigation';
import { habitService } from '../../services/habits';

const SubscriptionModal = ({ isOpen, onClose, onContinue }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Используем существующий хук для навигации
  useNavigation(onClose, { isVisible: isOpen });

  useEffect(() => {
    if (isOpen) {
      loadSubscriptionInfo();
      // Сбрасываем выбранный план при открытии модалки
      setSelectedPlan(null);
      setLoading(false);
    }
  }, [isOpen]);

  const loadSubscriptionInfo = async () => {
    try {
      // Загружаем текущий статус подписки
      const status = await habitService.checkSubscriptionLimits();
      setCurrentSubscription(status.subscription);
      
      console.log('Subscription modal - current status:', status);
      
      // Если у пользователя уже есть активная подписка, можно показать это
      if (status.subscription && status.subscription.isActive) {
        console.log('User already has active subscription:', status.subscription);
      }
    } catch (error) {
      console.error('Failed to load subscription info:', error);
    }
  };

  if (!isOpen) return null;

  const handleContinue = async () => {
    if (!selectedPlan || loading) {
      console.log('Cannot continue: selectedPlan=', selectedPlan, 'loading=', loading);
      return;
    }
    
    console.log('Starting subscription activation for plan:', selectedPlan);
    setLoading(true);
    
    try {
      await onContinue(selectedPlan);
      // onContinue теперь сам закроет модалку после успешной активации
    } catch (error) {
      console.error('Failed to activate subscription:', error);
      setLoading(false);
      // Показываем ошибку пользователю
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert('Failed to activate subscription. Please try again.');
      }
    }
  };

  const handlePlanSelect = (plan) => {
    if (loading) return;
    
    console.log('Plan selected:', plan);
    setSelectedPlan(plan);
  };

  const handleClose = () => {
    if (loading) return;
    
    // Сбрасываем состояние при закрытии
    setSelectedPlan(null);
    setLoading(false);
    onClose();
  };

  // Показываем сообщение если у пользователя уже есть подписка
  const renderExistingSubscription = () => {
    if (!currentSubscription || !currentSubscription.isActive) return null;
    
    return (
      <div style={{
        background: '#E8F4FD',
        border: '1px solid #007AFF',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#007AFF',
        textAlign: 'center'
      }}>
        You already have {currentSubscription.planName}
        {currentSubscription.daysLeft && ` (${currentSubscription.daysLeft} days left)`}
      </div>
    );
  };

  return (
    <div className="subscription-modal-overlay" onClick={handleClose}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
        <div className="subscription-modal__content">
          <div className="subscription-modal__illustration">
            <img src={sub} alt="PRO Features" />
          </div>

          <div className="subscription-modal__info">
            <h1 className="subscription-modal__main-title">Start Like a PRO</h1>
            <p className="subscription-modal__subtitle">Unlock All Features</p>

            <div className="subscription-modal__features">
              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                    <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">Unlimited Habits</span>
              </div>

              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                    <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">Advanced Statistics</span>
              </div>

              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                    <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">Priority Support</span>
              </div>
            </div>

            {renderExistingSubscription()}

            <div className="subscription-modal__plans">
              <div 
                className={`subscription-modal__plan ${selectedPlan === '6_months' ? 'subscription-modal__plan--selected' : ''}`}
                onClick={() => handlePlanSelect('6_months')}
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <div className="subscription-modal__plan-radio">
                  {selectedPlan === '6_months' && (
                    <div className="subscription-modal__plan-radio-inner">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="subscription-modal__plan-details">
                  <div className="subscription-modal__plan-name">For 6 Months</div>
                  <div className="subscription-modal__plan-total">
                    600 <span className="subscription-modal__star">⭐</span> total
                  </div>
                </div>
                <div className="subscription-modal__plan-price">
                  100 <span className="subscription-modal__star">⭐</span>/month
                </div>
              </div>

              <div 
                className={`subscription-modal__plan ${selectedPlan === '1_year' ? 'subscription-modal__plan--selected' : ''}`}
                onClick={() => handlePlanSelect('1_year')}
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <div className="subscription-modal__plan-radio">
                  {selectedPlan === '1_year' && (
                    <div className="subscription-modal__plan-radio-inner">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="subscription-modal__plan-details">
                  <div className="subscription-modal__plan-name">Per Year</div>
                  <div className="subscription-modal__plan-total">
                    350 <span className="subscription-modal__star">⭐</span> total
                    <span style={{ 
                      marginLeft: '8px', 
                      padding: '2px 6px', 
                      background: '#FF9500', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      SAVE 42%
                    </span>
                  </div>
                </div>
                <div className="subscription-modal__plan-price">
                  29 <span className="subscription-modal__star">⭐</span>/month
                </div>
              </div>
            </div>

            <div className="subscription-modal__links">
              <a href="#" className="subscription-modal__link">Privacy Policy</a>
              <a href="#" className="subscription-modal__link">Terms of Use</a>
            </div>

            <button 
              className={`subscription-modal__continue ${(!selectedPlan || loading) ? 'subscription-modal__continue--disabled' : ''}`}
              onClick={handleContinue}
              disabled={!selectedPlan || loading}
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
            
            {/* Временное уведомление о тестовом режиме */}
            <p style={{ 
              fontSize: '12px', 
              color: '#8E8E93', 
              textAlign: 'center', 
              marginTop: '12px' 
            }}>
              ⚠️ Test mode: Payment simulation only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;