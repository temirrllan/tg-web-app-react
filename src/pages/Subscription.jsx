import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import Loader from '../components/common/Loader';
import './Subscription.css';
import sub from "../../public/images/sub.png";
import { useTranslation } from '../hooks/useTranslation';

const Subscription = ({ onClose, preselectedPlan = null, onActivate }) => {
  const { t } = useTranslation();
  useNavigation(onClose);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlan);
  const [processing, setProcessing] = useState(false);
  
  console.log('═════════════════════════════════════════');
  console.log('🎬 [Component] Subscription mounted');
  console.log('📦 [Component] Props:', { 
    preselectedPlan, 
    hasOnActivate: !!onActivate,
    hasOnClose: !!onClose 
  });
  console.log('═════════════════════════════════════════');
  
  useEffect(() => {
    console.log('🔄 [Component] useEffect triggered - loading data');
    loadSubscriptionData();
  }, []);
  
  useEffect(() => {
    if (preselectedPlan) {
      console.log('✅ [Component] Setting preselected plan:', preselectedPlan);
      setSelectedPlan(preselectedPlan);
    }
  }, [preselectedPlan]);
  
  const loadSubscriptionData = async () => {
    try {
      console.log('📡 [Component] Starting subscription data fetch...');
      setLoading(true);
      setError(null);
      
      const status = await habitService.checkSubscriptionLimits();
      
      console.log('═════════════════════════════════════════');
      console.log('📊 [Component] Subscription data received:');
      console.log(JSON.stringify(status, null, 2));
      console.log('═════════════════════════════════════════');
      
      if (!status) {
        throw new Error('No data returned from API');
      }
      
      if (status.error) {
        throw new Error(status.error);
      }
      
      setSubscription(status);
      console.log('✅ [Component] Subscription state updated successfully');
      
    } catch (err) {
      console.error('═════════════════════════════════════════');
      console.error('❌ [Component] Failed to load subscription:');
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('═════════════════════════════════════════');
      setError(err.message);
    } finally {
      console.log('✅ [Component] Setting loading to false');
      setLoading(false);
    }
  };
  
  const handlePlanSelect = (plan) => {
    if (processing) {
      console.log('⚠️ [Component] Cannot select plan - processing in progress');
      return;
    }
    console.log('📝 [Component] Plan selected:', plan);
    setSelectedPlan(plan);
  };
  
  const handleSubscribe = async () => {
    if (!selectedPlan || processing) {
      console.log('⚠️ [Component] Cannot subscribe:', { selectedPlan, processing });
      return;
    }
    
    console.log('💳 [Component] Starting subscription process for plan:', selectedPlan);
    setProcessing(true);
    
    try {
      if (onActivate) {
        console.log('🔧 [Component] Using onActivate callback');
        await onActivate(selectedPlan);
      } else {
        console.log('🔧 [Component] Using direct API call');
        const result = await habitService.activatePremium(selectedPlan);
        console.log('✅ [Component] Premium activation result:', result);
        
        if (result.success) {
          await loadSubscriptionData();
          
          if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert('Premium activated! 🎉');
          }
        }
      }
    } catch (error) {
      console.error('❌ [Component] Failed to activate premium:', error);
      
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert('Failed to activate premium. Please try again.');
      }
    } finally {
      setProcessing(false);
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
  
  console.log('═════════════════════════════════════════');
  console.log('🎨 [Component] Current render state:');
  console.log('  - loading:', loading);
  console.log('  - error:', error);
  console.log('  - hasSubscription:', !!subscription);
  console.log('  - subscriptionData:', subscription);
  console.log('  - selectedPlan:', selectedPlan);
  console.log('  - processing:', processing);
  console.log('═════════════════════════════════════════');
  
  // СОСТОЯНИЕ 1: ЗАГРУЗКА
  if (loading) {
    console.log('⏳ [Component] RENDERING: LOADER');
    return (
      <div className="subscription-page subscription-page--loading">
        <Loader size="large" />
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Loading subscription data...
        </p>
      </div>
    );
  }
  
  // СОСТОЯНИЕ 2: ОШИБКА
  if (error) {
    console.log('❌ [Component] RENDERING: ERROR STATE');
    return (
      <div className="subscription-page">
        <div className="subscription-page__content" style={{ 
          padding: '40px 20px', 
          textAlign: 'center' 
        }}>
          <h2 style={{ color: '#FF3B30', marginBottom: '16px' }}>
            ⚠️ Error Loading Subscription
          </h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            {error}
          </p>
          <button 
            onClick={loadSubscriptionData}
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
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // СОСТОЯНИЕ 3: НЕТ ДАННЫХ
  if (!subscription) {
    console.log('❌ [Component] RENDERING: NO DATA STATE');
    return (
      <div className="subscription-page">
        <div className="subscription-page__content" style={{ 
          padding: '40px 20px', 
          textAlign: 'center' 
        }}>
          <h2 style={{ marginBottom: '16px' }}>📭 No Subscription Data</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Failed to load subscription information.
          </p>
          <button 
            onClick={loadSubscriptionData}
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
            Reload
          </button>
        </div>
      </div>
    );
  }
  
  // Определяем статус подписки
  const isPremium = subscription?.isPremium || false;
  const isActive = subscription?.subscription?.isActive || false;
  
  console.log('═════════════════════════════════════════');
  console.log('🔍 [Component] Render decision:');
  console.log('  - isPremium:', isPremium);
  console.log('  - isActive:', isActive);
  console.log('  - Will show:', (!isPremium || !isActive) ? 'PURCHASE PAGE' : 'PREMIUM STATUS');
  console.log('═════════════════════════════════════════');
  
  // СОСТОЯНИЕ 4: СТРАНИЦА ОФОРМЛЕНИЯ (бесплатный пользователь)
  if (!isPremium || !isActive) {
    console.log('✅ [Component] RENDERING: PURCHASE PAGE');
    
    return (
      <div className="subscription-page subscription-page--purchase">
        <div className="subscription-purchase">
          <div className="subscription-purchase__illustration">
            <img 
              src={sub} 
              alt="PRO Features" 
              className="subscription-purchase__image"
              onError={(e) => {
                console.error('❌ Failed to load image:', e);
                e.target.style.display = 'none';
              }}
            />
          </div>
          
          <div className="subscription-purchase__content">
            <h1 className="subscription-purchase__title">Start Like a PRO</h1>
            <p className="subscription-purchase__subtitle">Unlock All Features</p>
            
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
            
            <div className="subscription-purchase__plans">
              <h3 className="subscription-purchase__section-title">Subscription Plans</h3>
              
              {/* Plan 1: 1 Year */}
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
              
              {/* Plan 2: 6 Months */}
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
              
              {/* Plan 3: 3 Months */}
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
              
              {/* Plan 4: 1 Month */}
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
            
            <input 
              type="text" 
              placeholder="Promo code" 
              className="subscription-purchase__promo"
              disabled
            />
            
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
            
            <div className="subscription-purchase__about">
              <h3 className="subscription-purchase__section-title">About Subscription</h3>
              <p className="subscription-purchase__about-text">
                It is a long established fact that a reader will be distracted by the readable content 
                of a page when looking at its layout. The point of using Lorem Ipsum is that it has a 
                more-or-less normal distribution of letters, as opposed to using 'Content here, content here', 
                making it look like readable English.
              </p>
            </div>
            
            <div className="subscription-purchase__agreement">
              <label className="subscription-purchase__agreement-label">
                <input type="checkbox" defaultChecked />
                <span>
                  I agree to <a href="#">the user agreement</a>, <a href="#">payment policy</a>, 
                  and <a href="#">privacy policy</a>.
                </span>
              </label>
            </div>
            
            <button 
              className={`subscription-purchase__subscribe-btn ${!selectedPlan || processing ? 'subscription-purchase__subscribe-btn--disabled' : ''}`}
              onClick={handleSubscribe}
              disabled={!selectedPlan || processing}
            >
              {processing ? 'Processing...' : selectedPlan === '1_year' ? 'Subscribe for 1000 ⭐ per year' : 'Subscribe'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // СОСТОЯНИЕ 5: ИНФОРМАЦИЯ О ПОДПИСКЕ (премиум пользователь)
  console.log('✅ [Component] RENDERING: PREMIUM STATUS PAGE');
  
  const sub = subscription.subscription;
  
  return (
    <div className="subscription-page">
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