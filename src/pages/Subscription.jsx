import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import Loader from '../components/common/Loader';
import './Subscription.css';
import sub from "../../public/images/sub.png";

const Subscription = ({ onClose, preselectedPlan = null }) => {
  useNavigation(onClose);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlan);
  const [processing, setProcessing] = useState(false);
  
  console.log('═══════════════════════════════════════════════');
  console.log('🎬 Subscription Component Loaded');
  console.log('═══════════════════════════════════════════════');
  
  useEffect(() => {
    console.log('🔄 Loading subscription status...');
    loadStatus();
  }, []);
  
  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Requesting status from API...');
      const data = await habitService.getSubscriptionStatus();
      
      console.log('═══════════════════════════════════════════════');
      console.log('📦 Status received:', JSON.stringify(data, null, 2));
      console.log('═══════════════════════════════════════════════');
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load status');
      }
      
      setIsPremium(data.isPremium);
      setSubscriptionData(data);
      
      console.log('✅ State updated:', {
        isPremium: data.isPremium,
        habitCount: data.habitCount
      });
      
    } catch (err) {
      console.error('❌ Error loading status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlanSelect = (plan) => {
    console.log('📝 Plan selected:', plan);
    setSelectedPlan(plan);
  };
  
  const handleSubscribe = async () => {
    if (!selectedPlan || processing) return;
    
    console.log('💳 Activating plan:', selectedPlan);
    setProcessing(true);
    
    try {
      const result = await habitService.activatePremium(selectedPlan);
      console.log('✅ Activation result:', result);
      
      if (result.success) {
        await loadStatus();
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert('Premium activated! 🎉');
        }
      }
    } catch (error) {
      console.error('❌ Activation failed:', error);
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert('Failed to activate. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };
  
  const handleCancel = async () => {
    if (!window.confirm('Cancel subscription?')) return;
    
    try {
      await habitService.cancelSubscription();
      await loadStatus();
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert('Subscription cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };
  
  console.log('═══════════════════════════════════════════════');
  console.log('🎨 Rendering decision:');
  console.log('  Loading:', loading);
  console.log('  Error:', error);
  console.log('  isPremium:', isPremium);
  console.log('  Will render:', loading ? 'LOADER' : error ? 'ERROR' : isPremium ? 'PREMIUM INFO' : 'PURCHASE PAGE');
  console.log('═══════════════════════════════════════════════');
  
  // 1. LOADING
  if (loading) {
    console.log('⏳ RENDERING: Loader');
    return (
      <div className="subscription-page subscription-page--loading">
        <Loader size="large" />
        <p style={{ marginTop: '20px', color: '#666' }}>Loading...</p>
      </div>
    );
  }
  
  // 2. ERROR
  if (error) {
    console.log('❌ RENDERING: Error state');
    return (
      <div className="subscription-page">
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <h2 style={{ color: '#FF3B30', marginBottom: '16px' }}>Error</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>{error}</p>
          <button 
            onClick={loadStatus}
            style={{
              padding: '12px 24px',
              background: '#A7D96C',
              color: '#1D1D1F',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // 3. FREE USER - PURCHASE PAGE
  if (!isPremium) {
    console.log('✅ RENDERING: Purchase page (FREE user)');
    
    return (
      <div className="subscription-page subscription-page--purchase">
        <div className="subscription-purchase">
          {/* Illustration */}
          <div className="subscription-purchase__illustration">
            <img 
              src={sub} 
              alt="PRO Features" 
              className="subscription-purchase__image"
            />
          </div>
          
          {/* Content */}
          <div className="subscription-purchase__content">
            <h1 className="subscription-purchase__title">Start Like a PRO</h1>
            <p className="subscription-purchase__subtitle">Unlock All Features</p>
            
            {/* Payment Method */}
            <div className="subscription-purchase__method">
              <h3 className="subscription-purchase__section-title">Payment Method</h3>
              <div className="subscription-purchase__payment-card">
                <div className="subscription-purchase__payment-icon">⭐</div>
                <div className="subscription-purchase__payment-info">
                  <div className="subscription-purchase__payment-name">Telegram Stars</div>
                  <div className="subscription-purchase__payment-desc">Internal Telegram Currency</div>
                </div>
              </div>
            </div>
            
            {/* Subscription Quantity */}
            <div className="subscription-purchase__quantity">
              <h3 className="subscription-purchase__section-title">Subscription Quantity</h3>
              <div className="subscription-purchase__quantity-row">
                <span className="subscription-purchase__quantity-label">Quantity</span>
                <div className="subscription-purchase__quantity-controls">
                  <button className="subscription-purchase__quantity-btn" disabled>−</button>
                  <span className="subscription-purchase__quantity-value">3</span>
                  <button className="subscription-purchase__quantity-btn" disabled>+</button>
                </div>
              </div>
              <div className="subscription-purchase__quantity-row">
                <label className="subscription-purchase__gift-label">
                  <input type="checkbox" disabled />
                  <span>Buy as a gift</span>
                </label>
              </div>
              <p className="subscription-purchase__quantity-note">
                Purchase licenses for the whole team or as a gift. 
                A discount applies when purchasing multiple at once
              </p>
            </div>
            
            {/* Plans */}
            <div className="subscription-purchase__plans">
              <h3 className="subscription-purchase__section-title">Subscription Plans</h3>
              
              {/* Per Year */}
              <div 
                className={`subscription-purchase__plan ${selectedPlan === '1_year' ? 'subscription-purchase__plan--selected' : ''}`}
                onClick={() => handlePlanSelect('1_year')}
              >
                <div className="subscription-purchase__plan-radio">
                  {selectedPlan === '1_year' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="subscription-purchase__plan-info">
                  <div className="subscription-purchase__plan-name">Per Year</div>
                  <div className="subscription-purchase__plan-total">1,000 ⭐</div>
                </div>
                <div className="subscription-purchase__plan-price">83 ⭐/month</div>
              </div>
              
              {/* For 6 Month */}
              <div 
                className={`subscription-purchase__plan ${selectedPlan === '6_months' ? 'subscription-purchase__plan--selected' : ''}`}
                onClick={() => handlePlanSelect('6_months')}
              >
                <div className="subscription-purchase__plan-radio">
                  {selectedPlan === '6_months' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="subscription-purchase__plan-info">
                  <div className="subscription-purchase__plan-name">For 6 Month</div>
                  <div className="subscription-purchase__plan-total">600 ⭐</div>
                </div>
                <div className="subscription-purchase__plan-price">100 ⭐/month</div>
              </div>
              
              {/* For 3 Month */}
              <div 
                className={`subscription-purchase__plan ${selectedPlan === '3_months' ? 'subscription-purchase__plan--selected' : ''}`}
                onClick={() => handlePlanSelect('3_months')}
              >
                <div className="subscription-purchase__plan-radio">
                  {selectedPlan === '3_months' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="subscription-purchase__plan-info">
                  <div className="subscription-purchase__plan-name">For 3 Month</div>
                  <div className="subscription-purchase__plan-total">350 ⭐</div>
                </div>
                <div className="subscription-purchase__plan-price">117 ⭐/month</div>
              </div>
              
              {/* Per Month */}
              <div 
                className={`subscription-purchase__plan ${selectedPlan === 'month' ? 'subscription-purchase__plan--selected' : ''}`}
                onClick={() => handlePlanSelect('month')}
              >
                <div className="subscription-purchase__plan-radio">
                  {selectedPlan === 'month' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="subscription-purchase__plan-info">
                  <div className="subscription-purchase__plan-name">Per Month</div>
                  <div className="subscription-purchase__plan-total">-</div>
                </div>
                <div className="subscription-purchase__plan-price">150 ⭐/month</div>
              </div>
            </div>
            
            {/* Promo Code */}
            <input 
              type="text" 
              placeholder="Promo code" 
              className="subscription-purchase__promo"
              disabled
            />
            
            {/* Benefits */}
            <div className="subscription-purchase__benefits">
              <h3 className="subscription-purchase__section-title">Plan Benefits</h3>
              <div className="subscription-purchase__benefit-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                  <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2"/>
                </svg>
                <span>benefit 1</span>
              </div>
              <div className="subscription-purchase__benefit-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                  <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2"/>
                </svg>
                <span>benefit 2</span>
              </div>
              <div className="subscription-purchase__benefit-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                  <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2"/>
                </svg>
                <span>benefit 3</span>
              </div>
              <div className="subscription-purchase__benefit-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#A7D96C"/>
                  <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2"/>
                </svg>
                <span>benefit 4</span>
              </div>
            </div>
            
            {/* About */}
            <div className="subscription-purchase__about">
              <h3 className="subscription-purchase__section-title">About Subscription</h3>
              <p className="subscription-purchase__about-text">
                It is a long established fact that a reader will be distracted by the readable content 
                of a page when looking at its layout. The point of using Lorem Ipsum is that it has a 
                more-or-less normal distribution of letters, as opposed to using 'Content here, content here', 
                making it look like readable English.
              </p>
            </div>
            
            {/* Agreement */}
            <div className="subscription-purchase__agreement">
              <label className="subscription-purchase__agreement-label">
                <input type="checkbox" defaultChecked />
                <span>
                  I agree to <a href="#">the user agreement</a>, <a href="#">payment policy</a>, 
                  and <a href="#">privacy policy</a>.
                </span>
              </label>
            </div>
            
            {/* Subscribe Button */}
            <button 
              className={`subscription-purchase__subscribe-btn ${!selectedPlan || processing ? 'subscription-purchase__subscribe-btn--disabled' : ''}`}
              onClick={handleSubscribe}
              disabled={!selectedPlan || processing}
            >
              {processing ? 'Processing...' : 'Subscribe'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // 4. PREMIUM USER - INFO PAGE
  console.log('✅ RENDERING: Premium info page (PREMIUM user)');
  
  return (
    <div className="subscription-page">
      <div className="subscription-page__content">
        <div className="subscription-status subscription-status--premium">
          <h3>Premium Active</h3>
          <p>Type: {subscriptionData?.subscriptionType || 'Premium'}</p>
          {subscriptionData?.expiresAt && (
            <p>Expires: {new Date(subscriptionData.expiresAt).toLocaleDateString()}</p>
          )}
          <p className="subscription-usage">
            {subscriptionData?.habitCount || 0} habits created (unlimited)
          </p>
        </div>
        
        {subscriptionData?.expiresAt && (
          <button 
            className="subscription-page__cancel-btn"
            onClick={handleCancel}
          >
            Cancel Subscription
          </button>
        )}
      </div>
    </div>
  );
};

export default Subscription;