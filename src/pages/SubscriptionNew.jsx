// src/pages/SubscriptionNew.jsx - С ПОДДЕРЖКОЙ ПРОМОКОДОВ

import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import './SubscriptionNew.css';
import { telegramStarsService } from '../services/telegramStars';
import { useTranslation } from '../hooks/useTranslation';
import { useTelegramTheme } from '../hooks/useTelegramTheme';

const SubscriptionNew = ({ onClose, preselectedPlan = null }) => {
  const { t } = useTranslation();
  useNavigation(onClose);

  const [selectedPlan, setSelectedPlan] = useState('6_months');
  const [quantity, setQuantity] = useState(1);
  const [buyAsGift, setBuyAsGift] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoValidation, setPromoValidation] = useState(null); // { valid, discount_stars, bonus_days, final_price, error }
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  useTelegramTheme();

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

  // Сбрасываем промо-валидацию при смене плана
  useEffect(() => {
    if (promoValidation?.valid) {
      // Перевалидируем для нового плана
      handleApplyPromo(true);
    }
  }, [selectedPlan]);

  // Слушатель события payment_success
  useEffect(() => {
    const handlePaymentSuccess = async (event) => {
      console.log('🎉 Payment success event received:', event.detail);
      setTimeout(() => {
        onClose();
      }, 500);
    };

    window.addEventListener('payment_success', handlePaymentSuccess);
    return () => {
      window.removeEventListener('payment_success', handlePaymentSuccess);
    };
  }, [onClose]);

  const plans = [
    {
      id: 'month',
      name: t('subscriptionNew.plans.month.name'),
      total: 59,
      perMonth: 59,
      badge: null
    },
    {
      id: '6_months',
      name: t('subscriptionNew.plans.sixMonths.name'),
      total: 299,
      perMonth: 49,
      badge: null,
      selected: true
    },
    {
      id: '1_year',
      name: t('subscriptionNew.plans.oneYear.name'),
      total: 500,
      perMonth: 41,
      badge: t('subscriptionNew.plans.oneYear.badge')
    }
  ];

  const benefits = [
    t('subscriptionNew.benefits.unlimited'),
    t('subscriptionNew.benefits.friends'),
    t('subscriptionNew.benefits.support'),
    t('subscriptionNew.benefits.insights')
  ];

  const getSelectedPlanPrice = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    return plan ? plan.total * quantity : 0;
  };

  const getDiscountedPrice = () => {
    if (promoValidation?.valid && promoValidation.discount_stars > 0) {
      const originalPrice = getSelectedPlanPrice();
      return Math.max(0, originalPrice - promoValidation.discount_stars);
    }
    return getSelectedPlanPrice();
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleApplyPromo = async (silent = false) => {
    const code = promoCode.trim();
    if (!code) {
      if (!silent) setPromoValidation({ valid: false, error: 'empty_code' });
      return;
    }

    setIsValidatingPromo(true);
    try {
      const result = await telegramStarsService.validatePromoCode(code, selectedPlan);

      if (result.success && result.valid) {
        setPromoValidation({
          valid: true,
          discount_stars: result.discount_stars,
          bonus_days: result.bonus_days,
          final_price: result.final_price,
          original_price: result.original_price,
          promo_id: result.promo_id
        });
      } else {
        setPromoValidation({
          valid: false,
          error: result.error || 'not_found'
        });
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      setPromoValidation({ valid: false, error: 'server_error' });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleClearPromo = () => {
    setPromoCode('');
    setPromoValidation(null);
  };

  const getPromoErrorMessage = (error) => {
    const messages = {
      not_found: t('subscriptionNew.promo.invalid'),
      expired: t('subscriptionNew.promo.expired'),
      already_used: t('subscriptionNew.promo.used'),
      max_used: t('subscriptionNew.promo.maxUsed'),
      inactive: t('subscriptionNew.promo.invalid'),
      not_started: t('subscriptionNew.promo.invalid'),
      empty_code: '',
      server_error: t('subscriptionNew.promo.error')
    };
    return messages[error] || t('subscriptionNew.promo.invalid');
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

      if (tg?.MainButton) {
        tg.MainButton.showProgress();
      }

      const discountedPrice = getDiscountedPrice();
      const appliedPromoCode = promoValidation?.valid ? promoCode.trim() : null;

      // Если цена = 0 (100% скидка) — бесплатная активация
      if (discountedPrice === 0 && appliedPromoCode) {
        console.log('🎁 Free activation with promo code');
        const result = await telegramStarsService.activateFreeSubscription(selectedPlan, appliedPromoCode);
        console.log('✅ Free activation completed:', result);

        if (tg?.showAlert) {
          tg.showAlert(t('subscriptionNew.promo.activatedFree'));
        }
        return;
      }

      // Обычная оплата (возможно со скидкой)
      console.log('💳 Opening payment form for plan:', selectedPlan);
      const result = await telegramStarsService.purchaseSubscription(selectedPlan, appliedPromoCode);
      console.log('✅ Payment completed:', result);

    } catch (error) {
      console.error('💥 Payment error:', error);

      setIsProcessing(false);

      const tg = window.Telegram?.WebApp;
      if (tg?.MainButton) {
        tg.MainButton.hideProgress();
      }

      if (error.message === 'Payment cancelled') {
        console.log('User cancelled payment');
        return;
      }

      let errorMessage = t('subscriptionNew.errors.failed');

      if (error.message === 'bot_blocked') {
        errorMessage = t('subscriptionNew.errors.botBlocked.message');
      } else if (error.message.includes('not available')) {
        errorMessage = t('subscriptionNew.errors.notAvailable');
      } else if (error.message.includes('insufficient')) {
        const price = getDiscountedPrice();
        errorMessage = t('subscriptionNew.errors.insufficientStars.message', { price });
      } else if (error.message.includes('promo_')) {
        // Ошибка промокода при оплате
        errorMessage = t('subscriptionNew.promo.invalidOnPayment');
      }

      if (tg?.showPopup) {
        if (error.message === 'bot_blocked') {
          tg.showPopup({
            title: t('subscriptionNew.errors.botBlocked.title'),
            message: errorMessage,
            buttons: [
              { id: 'open_bot', type: 'default', text: t('subscriptionNew.errors.botBlocked.openBot') },
              { id: 'cancel', type: 'close', text: t('subscriptionNew.errors.botBlocked.cancel') }
            ]
          }, (button_id) => {
            if (button_id === 'open_bot') {
              tg.openTelegramLink('https://t.me/CheckHabitlyBot');
            }
          });
        } else if (error.message.includes('insufficient')) {
          tg.showPopup({
            title: t('subscriptionNew.errors.insufficientStars.title'),
            message: errorMessage,
            buttons: [
              { id: 'buy_stars', type: 'default', text: t('subscriptionNew.errors.insufficientStars.buyStars') },
              { id: 'cancel', type: 'close', text: t('subscriptionNew.errors.insufficientStars.cancel') }
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
    }
  };

  const selectedPrice = getSelectedPlanPrice();
  const discountedPrice = getDiscountedPrice();
  const hasDiscount = promoValidation?.valid && discountedPrice < selectedPrice;
  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <div className="subscription-new">
      <div className="subscription-new__content">
        <div className="subscription-new__hero">
          <h2 className="subscription-new__title">{t('subscriptionNew.title')}</h2>
          <p className="subscription-new__subtitle">{t('subscriptionNew.subtitle')}</p>
        </div>

        {/* Payment Method */}
        <div className="subscription-new__section">
          <h3 className="subscription-new__section-title">{t('subscriptionNew.sections.paymentMethod')}</h3>
          <div className="subscription-new__payment-method">
            <span className="subscription-new__payment-icon">⭐</span>
            <div className="subscription-new__payment-info">
              <span className="subscription-new__payment-title">{t('subscriptionNew.paymentMethod.telegramStars')}</span>
              <span className="subscription-new__payment-subtitle">
                {t('subscriptionNew.paymentMethod.internalCurrency')}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="subscription-new__section">
          <h3 className="subscription-new__section-title">{t('subscriptionNew.sections.subscriptionPlans')}</h3>

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
                      background: '#FF9500',
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
                  {t('subscriptionNew.plans.total', { stars: plan.total })}
                </span>
              </div>
              <span className="subscription-new__plan-price">
                {t('subscriptionNew.plans.perMonth', {
                  stars: plan.perMonth < 1 ? '<1' : Math.round(plan.perMonth)
                })}
              </span>
            </label>
          ))}
        </div>

        {/* Promo Code */}
        <div className="subscription-new__section">
          <h3 className="subscription-new__section-title">{t('subscriptionNew.promo.title')}</h3>
          <div className="subscription-new__promo">
            <div className="subscription-new__promo-input-row">
              <input
                type="text"
                className="subscription-new__promo-input"
                placeholder={t('subscriptionNew.promo.placeholder')}
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  if (promoValidation) setPromoValidation(null);
                }}
                disabled={isProcessing}
                maxLength={50}
              />
              {promoValidation?.valid ? (
                <button
                  className="subscription-new__promo-btn subscription-new__promo-btn--clear"
                  onClick={handleClearPromo}
                  disabled={isProcessing}
                >
                  ✕
                </button>
              ) : (
                <button
                  className="subscription-new__promo-btn"
                  onClick={() => handleApplyPromo(false)}
                  disabled={isProcessing || isValidatingPromo || !promoCode.trim()}
                >
                  {isValidatingPromo ? '...' : t('subscriptionNew.promo.apply')}
                </button>
              )}
            </div>

            {/* Promo result message */}
            {promoValidation && (
              <div className={`subscription-new__promo-result ${promoValidation.valid ? 'subscription-new__promo-result--success' : 'subscription-new__promo-result--error'}`}>
                {promoValidation.valid ? (
                  <>
                    {promoValidation.bonus_days > 0
                      ? t('subscriptionNew.promo.validWithBonus', {
                          stars: promoValidation.discount_stars,
                          days: promoValidation.bonus_days
                        })
                      : t('subscriptionNew.promo.valid', {
                          stars: promoValidation.discount_stars
                        })
                    }
                  </>
                ) : (
                  promoValidation.error !== 'empty_code' && getPromoErrorMessage(promoValidation.error)
                )}
              </div>
            )}
          </div>
        </div>

        {/* Plan Benefits */}
        <div className="subscription-new__section">
          <h3 className="subscription-new__section-title">{t('subscriptionNew.sections.whatYouGet')}</h3>
          <div className="subscription-new__benefits">
            {benefits.map((benefit, index) => (
              <div key={index} className="subscription-new__benefit">
                <span className="subscription-new__benefit-icon">✓</span>
                <span className="subscription-new__benefit-text">{benefit}</span>
              </div>
            ))}
          </div>
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
            {t('subscriptionNew.agreement')}
          </span>
        </label>

        {/* Subscribe Button */}
        <button
          className={`subscription-new__subscribe ${!agreedToTerms || isProcessing ? 'subscription-new__subscribe--disabled' : ''}`}
          onClick={handleSubscribe}
          disabled={!agreedToTerms || isProcessing}
        >
          {isProcessing
            ? '⏳ ' + t('subscriptionNew.processing')
            : hasDiscount
              ? (discountedPrice === 0
                  ? t('subscriptionNew.promo.free')
                  : <>
                      <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: '6px', fontSize: '14px' }}>
                        {selectedPrice} ⭐
                      </span>
                      {t('subscriptionNew.subscribe', { price: discountedPrice })}
                    </>
                )
              : t('subscriptionNew.subscribe', { price: selectedPrice })
          }
        </button>
      </div>
    </div>
  );
};

export default SubscriptionNew;
