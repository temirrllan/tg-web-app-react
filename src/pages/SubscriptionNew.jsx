import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import './SubscriptionNew.css';
import { telegramStarsService } from '../services/telegramStars';
const SubscriptionNew = ({ onClose, preselectedPlan = null }) => {
  useNavigation(onClose);
  
  const [selectedPlan, setSelectedPlan] = useState('6_months');
  const [quantity, setQuantity] = useState(3);
  const [buyAsGift, setBuyAsGift] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  useEffect(() => {
    if (preselectedPlan === '1_year') {
      setSelectedPlan('year');
    } else if (preselectedPlan === '6_months') {
      setSelectedPlan('6_months');
    }
  }, [preselectedPlan]);

  const plans = [
    { 
      id: 'year', 
      name: 'Per Year', 
      total: 1000, 
      perMonth: 83,
      badge: null 
    },
    { 
      id: '6_months', 
      name: 'For 6 Month', 
      total: 600, 
      perMonth: 100,
      badge: null,
      selected: true 
    },
    { 
      id: '3_months', 
      name: 'For 3 Month', 
      total: 350, 
      perMonth: 117,
      badge: null 
    },
    { 
      id: 'month', 
      name: 'Per Month', 
      total: 1, 
      perMonth: 150,
      badge: null 
    }
  ];

  const benefits = [
    'benefit 1',
    'benefit 2',
    'benefit 3',
    'benefit 4'
  ];

  const getSelectedPlanPrice = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    return plan ? plan.total : 0;
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
    // Маппинг планов
    let backendPlan = selectedPlan;
    if (selectedPlan === 'year') {
      backendPlan = '1_year';
    } else if (selectedPlan === '6_months') {
      backendPlan = '6_months';
    } else if (selectedPlan === '3_months') {
      backendPlan = '6_months';
    } else if (selectedPlan === 'month') {
      backendPlan = '6_months';
    }
    
    console.log('💳 Sending invoice to bot for plan:', backendPlan);

    // Отправляем запрос на отправку invoice кнопки
    const result = await telegramStarsService.purchaseSubscription(backendPlan);
    
    if (result.success) {
      console.log('✅ Invoice sent to bot');
      
      // Показываем инструкцию пользователю
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          title: '💳 Payment',
          message: 'Check your chat with @trackeryourhabitbot for the payment button.\n\nTap "Pay" to complete your purchase.',
          buttons: [
            { id: 'open_bot', type: 'default', text: 'Open Bot' },
            { id: 'ok', type: 'close', text: 'OK' }
          ]
        }, (button_id) => {
          if (button_id === 'open_bot') {
            // Открываем бота
            window.Telegram.WebApp.openTelegramLink('https://t.me/trackeryourhabitbot');
          }
        });
      } else if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(
          '💳 Check your chat with @trackeryourhabitbot for the payment button.\n\nTap "Pay" to complete your purchase.'
        );
      }
      
    }
    
  } catch (error) {
    console.error('Payment error:', error);
    
    let errorMessage = 'Failed to send payment request.';
    
    if (error.message === 'bot_blocked') {
      errorMessage = 'Please start a chat with @trackeryourhabitbot first.\n\nTap OK to open the bot.';
    } else if (error.message.includes('not available')) {
      errorMessage = 'Please open the app through Telegram to make a purchase.';
    } else {
      errorMessage = 'Failed to send payment request. Please try again.';
    }
    
    if (window.Telegram?.WebApp?.showPopup && error.message === 'bot_blocked') {
      window.Telegram.WebApp.showPopup({
        title: '🤖 Bot Required',
        message: errorMessage,
        buttons: [
          { id: 'open_bot', type: 'default', text: 'Open Bot' },
          { id: 'cancel', type: 'close', text: 'Cancel' }
        ]
      }, (button_id) => {
        if (button_id === 'open_bot') {
          window.Telegram.WebApp.openTelegramLink('https://t.me/trackeryourhabitbot');
        }
      });
    } else if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(errorMessage);
    } else {
      alert(errorMessage);
    }
    
  } finally {
    // Задержка перед разблокировкой кнопки (защита от спама)
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  }
};
    //

  return (
    <div className="subscription-new">
      

      <div className="subscription-new__content">
        <div className="subscription-new__hero">
          <h2 className="subscription-new__title">Start Like a PRO</h2>
          <p className="subscription-new__subtitle">Unlock All Features</p>
        </div>

        {/* Payment Method */}
        <div className="subscription-new__section">
          <h3 className="subscription-new__section-title">Payment Method</h3>
          <div className="subscription-new__payment-method">
            <span className="subscription-new__payment-icon">⭐</span>
            <div className="subscription-new__payment-info">
              <span className="subscription-new__payment-title">Telegram Stars</span>
              <span className="subscription-new__payment-subtitle">Internal Telegram Currency</span>
            </div>
          </div>
        </div>

        {/* Subscription Quantity */}
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

          <p className="subscription-new__gift-note">
            Purchase licenses for the whole team or as a gift<br/>
            A discount applies when purchasing multiple at once
          </p>
        </div>

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
                <span className="subscription-new__plan-name">{plan.name}</span>
                <span className="subscription-new__plan-total">{plan.total} ⭐</span>
              </div>
              <span className="subscription-new__plan-price">
                {plan.perMonth} ⭐/month
              </span>
            </label>
          ))}
        </div>

        {/* Promo Code */}
        <div className="subscription-new__section">
          <input
            type="text"
            className="subscription-new__promo"
            placeholder="Promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
        </div>

        {/* Plan Benefits */}
        <div className="subscription-new__section">
          <h3 className="subscription-new__section-title">Plan Benefits</h3>
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
            t is a long established fact that a reader will be distracted by the readable content 
            of a page when looking at its layout. The point of using Lorem Ipsum is that it has a 
            more-or-less normal distribution of letters, as opposed to using 'Content here, 
            content here', making it look like readable English.
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
          {isProcessing ? 'Processing...' : `Subscribe for ${getSelectedPlanPrice()} ⭐ per year`}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionNew;