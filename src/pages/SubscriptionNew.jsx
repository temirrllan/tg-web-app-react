import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import './SubscriptionNew.css';
import { telegramStarsService } from '../services/telegramStars';

const SubscriptionNew = ({ onClose, preselectedPlan = null }) => {
  useNavigation(onClose);
  
  const [selectedPlan, setSelectedPlan] = useState('6_months');
  const [quantity, setQuantity] = useState(1);
  const [buyAsGift, setBuyAsGift] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  useEffect(() => {
    if (preselectedPlan === '1_year' || preselectedPlan === 'year') {
      setSelectedPlan('1_year');
    } else if (preselectedPlan === '6_months') {
      setSelectedPlan('6_months');
    } else if (preselectedPlan === 'month') {
      setSelectedPlan('month');
    } else if (preselectedPlan === 'test') {
      setSelectedPlan('test');
    }
  }, [preselectedPlan]);

  useEffect(() => {
    const handlePaymentSuccess = () => {
      console.log('🎉 Payment success event received');
      onClose();
    };

    window.addEventListener('payment_success', handlePaymentSuccess);
    
    return () => {
      window.removeEventListener('payment_success', handlePaymentSuccess);
    };
  }, [onClose]);

  // 🔥 ИСПРАВЛЕННЫЕ ТАРИФЫ - все 4 плана с правильными ценами
  const plans = [
    { 
      id: 'test',
      name: '⚠️ TEST PLAN', 
      total: 1,
      perMonth: 1,
      badge: 'TEST ONLY',
      testMode: true,
      description: 'For testing purposes only'
    },
    { 
      id: 'month',
      name: 'Per Month', 
      total: 59,
      perMonth: 59,
      badge: null
    },
    { 
      id: '6_months', 
      name: 'For 6 Months', 
      total: 299,
      perMonth: 49,
      badge: null,
      selected: true 
    },
    { 
      id: '1_year', 
      name: 'Per Year', 
      total: 500,
      perMonth: 41,
      badge: 'SAVE 42%'
    }
  ];

  const benefits = [
    'Unlimited habits',
    'Unlimited friends to habit',
    'Priority Support',
    'Personal insights'
  ];

  const getSelectedPlanPrice = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    return plan ? plan.total * quantity : 0;
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleSubscribe = async () => {
    if (!agreedToTerms || isProcessing) {
      console.log('⚠️ Cannot subscribe: terms not agreed or already processing');
      return;
    }
    
    console.log('🔄 Starting subscription process...');
    setIsProcessing(true);
    
    try {
      const tg = window.Telegram?.WebApp;
      const selectedPrice = getSelectedPlanPrice();
      
      // Показываем предупреждение для тестового плана
      if (selectedPlan === 'test') {
        if (tg?.showPopup) {
          const shouldContinue = await new Promise((resolve) => {
            tg.showPopup({
              title: '⚠️ Test Mode',
              message: `This is a TEST purchase for 1 Star.\n\nIn production, real plans cost from 59 to 500 Stars.\n\nContinue with test purchase?`,
              buttons: [
                { id: 'continue', type: 'default', text: 'Continue' },
                { id: 'cancel', type: 'cancel', text: 'Cancel' }
              ]
            }, (button_id) => {
              resolve(button_id === 'continue');
            });
          });
          
          if (!shouldContinue) {
            setIsProcessing(false);
            return;
          }
        }
      }
      
      // 🔥 КРИТИЧНО: НЕ МЕНЯЕМ plan ID - отправляем как есть
      const backendPlan = selectedPlan; // Не модифицируем!
      
      console.log('💳 Opening payment form for plan:', {
        frontendPlan: selectedPlan,
        backendPlan: backendPlan,
        price: selectedPrice
      });

      // Открываем форму оплаты
      await telegramStarsService.purchaseSubscription(backendPlan);
      
      console.log('✅ Payment form opened');
      
    } catch (error) {
      if (error === 'cancelled') {
        console.log('User cancelled test purchase');
        setIsProcessing(false);
        return;
      }
      
      console.error('Payment error:', error);
      
      let errorMessage = 'Failed to open payment form.';
      
      if (error.message === 'bot_blocked') {
        errorMessage = 'Please start a chat with @CheckHabitlyBot first.\n\nTap OK to open the bot.';
      } else if (error.message.includes('not available')) {
        errorMessage = 'Please open the app through Telegram to make a purchase.';
      } else if (error.message.includes('insufficient')) {
        const price = getSelectedPlanPrice();
        errorMessage = `Insufficient Telegram Stars balance.\n\nRequired: ${price} ⭐\n\nYou can buy Stars starting from 50 ⭐ in Telegram Settings.`;
      } else {
        errorMessage = 'Failed to open payment form. Please try again.';
      }
      
      const tg = window.Telegram?.WebApp;
      
      if (tg?.showPopup) {
        if (error.message === 'bot_blocked') {
          tg.showPopup({
            title: '🤖 Bot Required',
            message: errorMessage,
            buttons: [
              { id: 'open_bot', type: 'default', text: 'Open Bot' },
              { id: 'cancel', type: 'close', text: 'Cancel' }
            ]
          }, (button_id) => {
            if (button_id === 'open_bot') {
              tg.openTelegramLink('https://t.me/CheckHabitlyBot');
            }
          });
        } else if (error.message.includes('insufficient')) {
          tg.showPopup({
            title: '💫 Insufficient Stars',
            message: errorMessage,
            buttons: [
              { id: 'buy_stars', type: 'default', text: 'Buy Stars' },
              { id: 'cancel', type: 'close', text: 'Cancel' }
            ]
          }, (button_id) => {
            if (button_id === 'buy_stars') {
              tg.openTelegramLink('https://t.me/PremiumBot');
            }
          });
        } else {
          tg.showAlert(errorMessage);
        }
      } else {
        alert(errorMessage);
      }
      
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    }
  };

  const selectedPrice = getSelectedPlanPrice();
  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <div className="subscription-new">
      <div className="subscription-new__content">
        <div className="subscription-new__hero">
          <h2 className="subscription-new__title">Start Like a PRO</h2>
          <p className="subscription-new__subtitle">Unlock All Features</p>
        </div>

        {/* Test Mode Warning */}
        {selectedPlanData?.testMode && (
          <div style={{
            background: '#FFE4B5',
            border: '1px solid #FFA500',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#8B4513',
            textAlign: 'center'
          }}>
            ⚠️ <strong>TEST MODE:</strong> This plan is set to 1 Star for testing.<br/>
            Production prices: 59/299/500 Stars
          </div>
        )}

        {/* Payment Method */}
        <div className="subscription-new__section">
          <h3 className="subscription-new__section-title">Payment Method</h3>
          <div className="subscription-new__payment-method">
            <span className="subscription-new__payment-icon">⭐</span>
            <div className="subscription-new__payment-info">
              <span className="subscription-new__payment-title">Telegram Stars</span>
              <span className="subscription-new__payment-subtitle">
                Internal Telegram Currency
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Quantity (для подарков) */}
        {buyAsGift && (
          <div className="subscription-new__section">
            <h3 className="subscription-new__section-title">Subscription Quantity</h3>
            
            <div className="subscription-new__quantity">
              <span className="subscription-new__quantity-label">Quantity</span>
              <div className="subscription-new__quantity-controls">
                <button 
                  className="subscription-new__quantity-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="subscription-new__quantity-value">{quantity}</span>
                <button 
                  className="subscription-new__quantity-btn"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= 10}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gift Option */}
        {/* <div className="subscription-new__section">
          <label className="subscription-new__checkbox-container">
            <span className="subscription-new__checkbox-label">Buy as a gift</span>
            <input
              type="checkbox"
              className="subscription-new__checkbox"
              checked={buyAsGift}
              onChange={(e) => setBuyAsGift(e.target.checked)}
            />
            <span className="subscription-new__checkbox-custom"></span>
          </label>

          {buyAsGift && (
            <p className="subscription-new__gift-note">
              Purchase licenses for the whole team or as a gift<br/>
              A discount applies when purchasing multiple at once
            </p>
          )}
        </div> */}

        {/* Subscription Plans */}
        <div className="subscription-new__section">
          <h3 className="subscription-new__section-title">Subscription Plans</h3>
          
          {plans.map((plan) => (
            <label 
              key={plan.id} 
              className={`subscription-new__plan ${selectedPlan === plan.id ? 'subscription-new__plan--selected' : ''}`}
            >
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={selectedPlan === plan.id}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="subscription-new__plan-radio"
              />
              <span className="subscription-new__plan-checkmark">
                {selectedPlan === plan.id && '✓'}
              </span>
              <div className="subscription-new__plan-info">
                <div>
                  <span className="subscription-new__plan-name">{plan.name}</span>
                  {plan.badge && (
                    <span style={{ 
                      marginLeft: '8px', 
                      padding: '2px 6px', 
                      background: plan.testMode ? '#FFA500' : '#FF9500', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <span className="subscription-new__plan-total">
                  {plan.total} ⭐ total
                  {plan.description && (
                    <span style={{ marginLeft: '8px', fontSize: '11px', color: '#999' }}>
                      ({plan.description})
                    </span>
                  )}
                </span>
              </div>
              <span className="subscription-new__plan-price">
                {plan.perMonth < 1 ? '<1' : Math.round(plan.perMonth)} ⭐/month
              </span>
            </label>
          ))}
        </div>

        {/* Promo Code */}
        <div className="subscription-new__section">
          <input
            type="text"
            className="subscription-new__promo"
            placeholder="Promo code (optional)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
        </div>

        {/* Plan Benefits */}
        <div className="subscription-new__section">
          <h3 className="subscription-new__section-title">What You Get</h3>
          <div className="subscription-new__benefits">
            {benefits.map((benefit, index) => (
              <div key={index} className="subscription-new__benefit">
                <span className="subscription-new__benefit-icon">✓</span>
                <span className="subscription-new__benefit-text">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About Subscription */}
        <div className="subscription-new__section">
          <h3 className="subscription-new__section-title">About Subscription</h3>
          <p className="subscription-new__about">
            Premium subscription will take your personalized habit tracking to the next level.
            You'll gain insight into yourself, but most importantly, motivate your loved ones to achieve their goals.
            Step by step, every day, you'll become the best version of yourself, and we're happy to help!
            {selectedPlanData?.testMode && '\n\n⚠️ TEST MODE: Real prices are 59/299/500 Stars in production.'}
          </p>
        </div>

        {/* Agreement */}
        <label className="subscription-new__agreement">
          <input
            type="checkbox"
            className="subscription-new__agreement-checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
          />
          <span className="subscription-new__agreement-checkmark">
            {agreedToTerms && '✓'}
          </span>
          <span className="subscription-new__agreement-text">
            I agree to the user agreement, payment policy, and privacy policy.
          </span>
        </label>

        {/* Subscribe Button */}
        <button 
          className={`subscription-new__subscribe ${!agreedToTerms ? 'subscription-new__subscribe--disabled' : ''}`}
          onClick={handleSubscribe}
          disabled={!agreedToTerms || isProcessing}
        >
          {isProcessing ? 'Opening payment...' : `Subscribe for ${selectedPrice} ⭐`}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionNew;