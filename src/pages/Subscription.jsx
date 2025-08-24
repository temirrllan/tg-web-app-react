import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../services/subscription';
import './Subscription.css';

const Subscription = ({ onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [quantity, setQuantity] = useState(1);
  const [isGift, setIsGift] = useState(false);
  const [giftUsername, setGiftUsername] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [agreement, setAgreement] = useState(false);
  const [loading, setLoading] = useState(false);

  const plans = {
    monthly: { 
      name: 'Monthly', 
      stars: 100, 
      duration: '1 month',
      save: null 
    },
    quarterly: { 
      name: '3 Months', 
      stars: 270, 
      duration: '3 months',
      save: '10%' 
    },
    yearly: { 
      name: 'Yearly', 
      stars: 1000, 
      duration: '12 months',
      save: '17%' 
    }
  };

  const getTotalStars = () => {
    return plans[selectedPlan].stars * quantity;
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handlePromoCheck = async () => {
    if (!promoCode.trim()) {
      setPromoStatus('error');
      return;
    }

    setPromoLoading(true);
    try {
      const result = await subscriptionService.checkPromoCode(promoCode);
      if (result.valid) {
        setPromoStatus('success');
      } else {
        setPromoStatus('error');
      }
    } catch (error) {
      setPromoStatus('error');
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!agreement) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const purchaseData = {
        plan: selectedPlan,
        quantity: quantity,
        isGift: isGift,
        giftUsername: isGift ? giftUsername : null,
        promoCode: promoStatus === 'success' ? promoCode : null,
        totalStars: getTotalStars()
      };

      // Здесь будет интеграция с Telegram Stars API
      await subscriptionService.createSubscription(purchaseData);
      
      // Telegram Stars payment
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openInvoice(
          `stars_${getTotalStars()}`,
          (status) => {
            if (status === 'paid') {
              alert('Payment successful!');
              onClose();
            } else {
              alert('Payment cancelled');
            }
          }
        );
      }
    } catch (error) {
      alert('Purchase failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription">
      <div className="subscription__header">
        <button className="subscription__back" onClick={onClose}>
          ← Back
        </button>
        <h2 className="subscription__title">Subscription</h2>
        <div className="subscription__spacer"></div>
      </div>

      <div className="subscription__content">
        {/* Payment Method */}
        <div className="subscription__section">
          <h3 className="subscription__section-title">Payment Method</h3>
          <div className="subscription__payment-method">
            <div className="payment-method-card payment-method-card--selected">
              <div className="payment-method-icon">⭐</div>
              <span className="payment-method-name">Telegram Stars</span>
              <div className="payment-method-check">✓</div>
            </div>
          </div>
        </div>

        {/* Quantity */}
        <div className="subscription__section">
          <h3 className="subscription__section-title">Quantity</h3>
          <div className="subscription__quantity">
            <button 
              className="quantity-btn quantity-btn--minus"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="quantity-value">{quantity}</span>
            <button 
              className="quantity-btn quantity-btn--plus"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= 10}
            >
              +
            </button>
          </div>
        </div>

        {/* Buy as a gift */}
        <div className="subscription__section">
          <div className="subscription__gift">
            <label className="gift-checkbox">
              <input
                type="checkbox"
                checked={isGift}
                onChange={(e) => setIsGift(e.target.checked)}
              />
              <span className="gift-checkbox-custom"></span>
              <span className="gift-label">Buy as a gift</span>
            </label>
            {isGift && (
              <input
                type="text"
                className="gift-input"
                placeholder="Enter username"
                value={giftUsername}
                onChange={(e) => setGiftUsername(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="subscription__section">
          <h3 className="subscription__section-title">Subscription Plans</h3>
          <div className="subscription__plans">
            {Object.entries(plans).map(([key, plan]) => (
              <div
                key={key}
                className={`plan-card ${selectedPlan === key ? 'plan-card--selected' : ''}`}
                onClick={() => setSelectedPlan(key)}
              >
                {plan.save && (
                  <div className="plan-badge">Save {plan.save}</div>
                )}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-stars">⭐ {plan.stars}</div>
                <div className="plan-duration">{plan.duration}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Promo code */}
        <div className="subscription__section">
          <h3 className="subscription__section-title">Promo code</h3>
          <div className="subscription__promo">
            <div className="promo-input-wrapper">
              <input
                type="text"
                className={`promo-input ${promoStatus}`}
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  setPromoStatus('');
                }}
              />
              <button 
                className="promo-btn"
                onClick={handlePromoCheck}
                disabled={promoLoading}
              >
                {promoLoading ? '...' : 'Apply'}
              </button>
            </div>
            {promoStatus === 'error' && (
              <div className="promo-error">Invalid promo code</div>
            )}
            {promoStatus === 'success' && (
              <div className="promo-success">Promo code applied!</div>
            )}
          </div>
        </div>

        {/* Plan Benefits */}
        <div className="subscription__section">
          <h3 className="subscription__section-title">Plan Benefits</h3>
          <div className="subscription__benefits">
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span className="benefit-text">Unlimited habits</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span className="benefit-text">Advanced statistics</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span className="benefit-text">Custom categories</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span className="benefit-text">Priority support</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span className="benefit-text">Export data</span>
            </div>
          </div>
        </div>

        {/* About Subscription */}
        <div className="subscription__section">
          <h3 className="subscription__section-title">About Subscription</h3>
          <div className="subscription__about">
            <p>Premium subscription gives you access to all features of Habit Tracker.</p>
            <p>• Track unlimited habits</p>
            <p>• Get detailed analytics</p>
            <p>• Sync across all devices</p>
            <p>• Premium support</p>
          </div>
        </div>

        {/* Agreement */}
        <div className="subscription__section">
          <label className="subscription__agreement">
            <input
              type="checkbox"
              checked={agreement}
              onChange={(e) => setAgreement(e.target.checked)}
            />
            <span className="agreement-text">
              I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
            </span>
          </label>
        </div>
      </div>

      {/* Purchase Button */}
      <div className="subscription__footer">
        <button 
          className="subscription__purchase-btn"
          onClick={handlePurchase}
          disabled={loading || !agreement}
        >
          {loading ? 'Processing...' : `Pay ⭐ ${getTotalStars()} Stars`}
        </button>
      </div>
    </div>
  );
};

export default Subscription;