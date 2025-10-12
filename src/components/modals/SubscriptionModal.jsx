import React, { useState, useEffect } from 'react';
import './SubscriptionModal.css';
import sub from "../../../public/images/sub.png";
import { useNavigation } from '../../hooks/useNavigation';
import { habitService } from '../../services/habits';
import { useTranslation } from '../../hooks/useTranslation';

const SubscriptionModal = ({ isOpen, onClose, onContinue }) => {
  const { t } = useTranslation();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useNavigation(onClose, { isVisible: isOpen });

  useEffect(() => {
    if (isOpen) {
      loadSubscriptionInfo();
      setSelectedPlan(null);
      setLoading(false);
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
    if (!selectedPlan || loading) return;
    
    // Вместо активации подписки - переходим на страницу Subscription
    console.log('Opening Subscription page with selected plan:', selectedPlan);
    
    // Передаем выбранный план и закрываем модалку
    if (onContinue) {
      onContinue(selectedPlan);
    }
  };

  const handlePlanSelect = (plan) => {
    if (loading) return;
    setSelectedPlan(plan);
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedPlan(null);
    setLoading(false);
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
            <h1 className="subscription-modal__main-title">{t('subscriptionModal.title')}</h1>
            <p className="subscription-modal__subtitle">{t('subscriptionModal.subtitle')}</p>

            <div className="subscription-modal__features">
              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                    <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">{t('subscriptionModal.features.unlimited')}</span>
              </div>

              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                    <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">{t('subscriptionModal.features.stats')}</span>
              </div>

              <div className="subscription-modal__feature">
                <div className="subscription-modal__feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                    <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="subscription-modal__feature-text">{t('subscriptionModal.features.support')}</span>
              </div>
            </div>

            {renderExistingSubscription()}

            <div className="subscription-modal__plans">
              {/* 6 months */}
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
                  <div className="subscription-modal__plan-name">{t('subscriptionModal.plans.sixMonths.name')}</div>
                  <div className="subscription-modal__plan-total">
                    {t('subscriptionModal.plans.sixMonths.total', { stars: 600 })}
                  </div>
                </div>
                <div className="subscription-modal__plan-price">
                  {t('subscriptionModal.plans.sixMonths.perMonth', { stars: 100 })}
                </div>
              </div>

              {/* 1 year */}
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
                  <div className="subscription-modal__plan-name">{t('subscriptionModal.plans.oneYear.name')}</div>
                  <div className="subscription-modal__plan-total">
                    {t('subscriptionModal.plans.oneYear.total', { stars: 350 })}
                    <span style={{ 
                      marginLeft: '8px', 
                      padding: '2px 6px', 
                      background: '#FF9500', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {t('subscriptionModal.plans.oneYear.save', { percent: 42 })}
                    </span>
                  </div>
                </div>
                <div className="subscription-modal__plan-price">
                  {t('subscriptionModal.plans.oneYear.perMonth', { stars: 29 })}
                </div>
              </div>
            </div>

            <div className="subscription-modal__links">
              <a href="#" className="subscription-modal__link">{t('subscriptionModal.links.privacy')}</a>
              <a href="#" className="subscription-modal__link">{t('subscriptionModal.links.terms')}</a>
            </div>

            <button 
              className={`subscription-modal__continue ${(!selectedPlan || loading) ? 'subscription-modal__continue--disabled' : ''}`}
              onClick={handleContinue}
              disabled={!selectedPlan || loading}
            >
              {loading ? t('subscriptionModal.processing') : t('subscriptionModal.continue')}
            </button>

            <p style={{ 
              fontSize: '12px', 
              color: '#8E8E93', 
              textAlign: 'center', 
              marginTop: '12px' 
            }}>
              {t('subscriptionModal.testNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;