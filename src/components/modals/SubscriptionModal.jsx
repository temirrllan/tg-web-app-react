import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import './SubscriptionModal.css';
import sub from "../../../public/images/sub.png";

const SubscriptionModal = ({ isOpen, onClose, onContinue }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Используем существующий хук навигации для кнопки "Назад"
  useNavigation(isOpen ? onClose : null, { isVisible: isOpen });

  if (!isOpen) return null;

  const handleContinue = () => {
    if (selectedPlan) {
      onContinue(selectedPlan);
    }
  };

  return (
    <div className="subscription-modal-overlay">
      <div className="subscription-modal">
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
              <span className="subscription-modal__feature-text">Make New Habits</span>
            </div>

            <div className="subscription-modal__feature">
              <div className="subscription-modal__feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                  <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="subscription-modal__feature-text">Remove All Limitations</span>
            </div>

            <div className="subscription-modal__feature">
              <div className="subscription-modal__feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                  <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="subscription-modal__feature-text">Focus Mode</span>
            </div>
          </div>

          <div className="subscription-modal__plans">
            <div 
              className={`subscription-modal__plan ${selectedPlan === 'month' ? 'subscription-modal__plan--selected' : ''}`}
              onClick={() => setSelectedPlan('month')}
            >
              <div className="subscription-modal__plan-radio">
                {selectedPlan === 'month' && (
                  <div className="subscription-modal__plan-radio-inner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="subscription-modal__plan-details">
                <div className="subscription-modal__plan-name">For 6 Month</div>
                <div className="subscription-modal__plan-total">
                  600 <span className="subscription-modal__star">⭐</span>
                </div>
              </div>
              <div className="subscription-modal__plan-price">
                100 <span className="subscription-modal__star">⭐</span>/month
              </div>
            </div>

            <div 
              className={`subscription-modal__plan ${selectedPlan === 'year' ? 'subscription-modal__plan--selected' : ''}`}
              onClick={() => setSelectedPlan('year')}
            >
              <div className="subscription-modal__plan-radio">
                {selectedPlan === 'year' && (
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
                  350 <span className="subscription-modal__star">⭐</span>
                </div>
              </div>
              <div className="subscription-modal__plan-price">
                117 <span className="subscription-modal__star">⭐</span>/month
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
  );
};

export default SubscriptionModal;