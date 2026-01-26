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
          
          {/* Illustration */}
          <div className="subscription-modal__illustration">
            <img src={sub} alt={t('subscriptionModal.illustrationAlt')} />
          </div>

          {/* Info */}
          <div className="subscription-modal__info">
            <h1 className="subscription-modal__main-title">
              {t('subscriptionModal.title')}
            </h1>

            <p className="subscription-modal__subtitle">
              {t('subscriptionModal.subtitle')}
            </p>

            {/* Features */}
            <div className="subscription-modal__features">
              
              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="14" fill="#A7D96C"/>
                    <path d="M9 14l3 3 7-7" 
                      stroke="white" strokeWidth="2.5" 
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">
                  {t('subscriptionModal.features.unlimited')}
                </span>
              </div>

              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="14" fill="#A7D96C"/>
                    <path d="M9 14l3 3 7-7" 
                      stroke="white" strokeWidth="2.5" 
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">
                  {t('subscriptionModal.features.stats')}
                </span>
              </div>

              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="14" fill="#A7D96C"/>
                    <path d="M9 14l3 3 7-7" 
                      stroke="white" strokeWidth="2.5" 
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">
                  {t('subscriptionModal.features.support')}
                </span>
              </div>

            </div>

            {renderExistingSubscription()}

            {/* Plans */}
            <div className="subscription-modal__plans">
<div 
                className={`subscription-modal__plan ${selectedPlan === 'month' ? 'subscription-modal__plan--selected' : ''}`}
                onClick={() => handlePlanSelect('month')}
              >
                <div className="subscription-modal__plan-radio">
                  {selectedPlan === 'month' && (
                    <div className="subscription-modal__plan-radio-inner">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L19 7" 
                          stroke="white" strokeWidth="3" 
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="subscription-modal__plan-details">
                  <div className="subscription-modal__plan-name">
                    {t('subscriptionModal.plans.month.name')}
                  </div>
                  <div className="subscription-modal__plan-total">
                    {t('subscriptionModal.plans.month.total', { stars: 59 })}
                  </div>
                </div>

                <div className="subscription-modal__plan-price">
                  {t('subscriptionModal.plans.month.perMonth', { stars: 59 })}
                </div>
              </div>
              {/* 6 months */}
              <div 
                className={`subscription-modal__plan ${selectedPlan === '6_months' ? 'subscription-modal__plan--selected' : ''}`}
                onClick={() => handlePlanSelect('6_months')}
              >
                <div className="subscription-modal__plan-radio">
                  {selectedPlan === '6_months' && (
                    <div className="subscription-modal__plan-radio-inner">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L19 7" 
                          stroke="white" strokeWidth="3" 
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="subscription-modal__plan-details">
                  <div className="subscription-modal__plan-name">
                    {t('subscriptionModal.plans.sixMonths.name')}
                  </div>
                  <div className="subscription-modal__plan-total">
                    {t('subscriptionModal.plans.sixMonths.total', { stars: 299 })}
                  </div>
                </div>

                <div className="subscription-modal__plan-price">
                  {t('subscriptionModal.plans.sixMonths.perMonth', { stars: 49 })}
                </div>
              </div>

              {/* 1 year */}
              <div 
                className={`subscription-modal__plan ${selectedPlan === '1_year' ? 'subscription-modal__plan--selected' : ''}`}
                onClick={() => handlePlanSelect('1_year')}
              >
                <div className="subscription-modal__plan-radio">
                  {selectedPlan === '1_year' && (
                    <div className="subscription-modal__plan-radio-inner">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L19 7" 
                          stroke="white" strokeWidth="3" 
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="subscription-modal__plan-details">
                  <div className="subscription-modal__plan-name">
                    {t('subscriptionModal.plans.oneYear.name')}
                  </div>
                  <div className="subscription-modal__plan-total">
                    {t('subscriptionModal.plans.oneYear.total', { stars: 500 })}
                  </div>
                </div>

                <div className="subscription-modal__plan-price">
                  {t('subscriptionModal.plans.oneYear.perMonth', { stars: 41 })}
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="subscription-modal__links">
              <a href="#" className="subscription-modal__link">
                {t('subscriptionModal.links.privacy')}
              </a>
              <a href="#" className="subscription-modal__link">
                {t('subscriptionModal.links.terms')}
              </a>
            </div>

            {/* Continue */}
            <button 
              className={`subscription-modal__continue ${!selectedPlan ? 'subscription-modal__continue--disabled' : ''}`}
              onClick={handleContinue}
              disabled={!selectedPlan}
            >
              {t('subscriptionModal.continue')}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
