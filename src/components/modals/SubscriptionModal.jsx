import React, { useState, useEffect } from 'react';
import './SubscriptionModal.css';
import sub from "../../../public/images/sub.png";
import { useNavigation } from '../../hooks/useNavigation';
import { habitService } from '../../services/habits';
import { useTranslation } from '../../hooks/useTranslation';

const SubscriptionModal = ({ isOpen, onClose, onSelectPlan }) => {
  const { t } = useTranslation();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  
  useNavigation(onClose, { isVisible: isOpen });

  useEffect(() => {
    if (isOpen) {
      loadSubscriptionInfo();
      setSelectedPlan(null);
    }
  }, [isOpen]);

  const loadSubscriptionInfo = async () => {
    try {
      const status = await habitService.checkSubscriptionLimits();
      setCurrentSubscription(status.subscription);
    } catch (error) {
      console.error('Failed to load subscription info:', error);
    }
  };

  if (!isOpen) return null;

  const handleContinue = () => {
    if (!selectedPlan) return;
    
    onSelectPlan(selectedPlan);
    onClose();
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handleClose = () => {
    setSelectedPlan(null);
    onClose();
  };

  const renderExistingSubscription = () => {
    if (!currentSubscription || !currentSubscription.isActive) return null;
    const daysLeft = currentSubscription.daysLeft;
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
        {daysLeft != null
          ? t('subscriptionModal.alreadyHaveWithDays', {
              plan: currentSubscription.planName,
              days: daysLeft
            })
          : t('subscriptionModal.alreadyHave', { plan: currentSubscription.planName })
        }
      </div>
    );
  };

  return (
    <div className="subscription-modal-overlay" onClick={handleClose}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
        <div className="subscription-modal__content">
          <div className="subscription-modal__illustration">
            <img src={sub} alt={t('subscriptionModal.illustrationAlt')} />
          </div>

          <div className="subscription-modal__info">
            <h1 className="subscription-modal__main-title">Start Like a PRO</h1>
            <p className="subscription-modal__subtitle">Unlock All Features</p>

            <div className="subscription-modal__features">
              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="14" fill="#A7D96C"/>
                    <path d="M9 14l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">Make New Habits</span>
              </div>

              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="14" fill="#A7D96C"/>
                    <path d="M9 14l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">Remove All Limitations</span>
              </div>

              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="14" fill="#A7D96C"/>
                    <path d="M9 14l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">Focus Mode</span>
              </div>
            </div>

            {renderExistingSubscription()}

            <div className="subscription-modal__plans">
              {/* 6 months - 600 stars total, 100 per month */}
              <div 
                className={`subscription-modal__plan ${selectedPlan === '6_months' ? 'subscription-modal__plan--selected' : ''}`}
                onClick={() => handlePlanSelect('6_months')}
              >
                <div className="subscription-modal__plan-radio">
                  {selectedPlan === '6_months' && (
                    <div className="subscription-modal__plan-radio-inner">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="subscription-modal__plan-details">
                  <div className="subscription-modal__plan-name">For 6 Month</div>
                  <div className="subscription-modal__plan-total">
                    600 ⭐
                  </div>
                </div>
                <div className="subscription-modal__plan-price">
                  100 ⭐/month
                </div>
              </div>

              {/* 1 year - 350 stars total, 117 per month */}
              <div 
                className={`subscription-modal__plan ${selectedPlan === '1_year' ? 'subscription-modal__plan--selected' : ''}`}
                onClick={() => handlePlanSelect('1_year')}
              >
                <div className="subscription-modal__plan-radio">
                  {selectedPlan === '1_year' && (
                    <div className="subscription-modal__plan-radio-inner">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="subscription-modal__plan-details">
                  <div className="subscription-modal__plan-name">Per Year</div>
                  <div className="subscription-modal__plan-total">
                    350 ⭐
                  </div>
                </div>
                <div className="subscription-modal__plan-price">
                  117 ⭐/month
                </div>
              </div>
            </div>

            <div className="subscription-modal__links">
              <a href="#" className="subscription-modal__link">Privacy Policy</a>
              <a href="#" className="subscription-modal__link">Terms of Use</a>
            </div>

            <button 
              className={`subscription-modal__continue ${!selectedPlan ? 'subscription-modal__continue--disabled' : ''}`}
              onClick={handleContinue}
              disabled={!selectedPlan}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;