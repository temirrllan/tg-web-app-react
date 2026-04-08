import React, { useState, useEffect } from 'react';
import './SubscriptionModal.css';
import sub from "../../../public/images/sub.png";
import { useNavigation } from '../../hooks/useNavigation';
import { habitService } from '../../services/habits';
import { useTranslation } from '../../hooks/useTranslation';
import { telegramStarsService } from '../../services/telegramStars';

const SubscriptionModal = ({ isOpen, onClose, onSelectPlan }) => {
  const { t, language } = useTranslation();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [plans, setPlans] = useState([]);

  useNavigation(onClose, { isVisible: isOpen });

  useEffect(() => {
    if (isOpen) {
      loadSubscriptionInfo();
      loadPlans();
      setSelectedPlan(null);
    }
  }, [isOpen]);

  const loadPlans = async () => {
    const apiPlans = await telegramStarsService.getPlans();
    if (apiPlans && apiPlans.length > 0) {
      setPlans(apiPlans.map(p => ({
        id: p.id,
        name: p.displayName?.[language] || p.displayName?.en || p.name,
        total: p.priceStars,
        perMonth: p.perMonth,
        durationMonths: p.durationMonths,
      })));
    } else {
      // Fallback
      setPlans([
        { id: 'month', name: t('subscriptionModal.plans.month.name'), total: 59, perMonth: 59, durationMonths: 1 },
        { id: '6_months', name: t('subscriptionModal.plans.sixMonths.name'), total: 299, perMonth: 49, durationMonths: 6 },
        { id: '1_year', name: t('subscriptionModal.plans.oneYear.name'), total: 500, perMonth: 41, durationMonths: 12 },
      ]);
    }
  };

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
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className={`subscription-modal__plan ${selectedPlan === plan.id ? 'subscription-modal__plan--selected' : ''}`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  <div className="subscription-modal__plan-radio">
                    {selectedPlan === plan.id && (
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
                      {plan.name}
                    </div>
                    <div className="subscription-modal__plan-total">
                      {plan.total} {t('subscriptionModal.stars') || 'Stars'}
                    </div>
                  </div>

                  <div className="subscription-modal__plan-price">
                    {plan.perMonth} ⭐/{t('subscriptionModal.month') || 'mo'}
                  </div>
                </div>
              ))}
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
