import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import PurchaseHistory from './PurchaseHistory';
import Subscription from './Subscription';
import Settings from './Settings';
import { useTranslation } from '../hooks/useTranslation';

const Profile = ({ onClose }) => {
  const { t } = useTranslation();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
const [showSubscriptionPage, setShowSubscriptionPage] = useState(false); // ДОЛЖНА БЫТЬ ЭТА СТРОКА

  const childOpen = showPurchaseHistory || showSubscriptionPage || showSettings;
  useNavigation(onClose, { isVisible: !childOpen });

  useEffect(() => {
    setSubscription(null);
    setLoading(true);
    loadSubscriptionStatus();

    const handleFocus = () => {
      loadSubscriptionStatus();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user || {
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser'
  };

  const loadSubscriptionStatus = async () => {
    try {
      const status = await habitService.checkSubscriptionLimits();
      setSubscription(status);
      console.log('Loaded subscription status:', status);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionLabel = () => {
    if (loading) return t('common.loading');

    if (!subscription || !subscription.isPremium || !subscription.subscription) {
      return t('profile.plan.free');
    }

    const sub = subscription.subscription;
    if (!sub.isActive) {
      return t('profile.plan.free');
    }

    const planType = sub.planType || '';

    // используем t с интерполяцией
    switch (planType) {
      case '6_months':
        return t('profile.plan.sixMonths'); // "For 6 Months"
      case '1_year':
        return t('profile.plan.oneYear');   // "For 1 Year"
      case 'lifetime':
        return t('profile.plan.lifetime');  // "Lifetime"
      case 'trial_7_days':
        return t('profile.plan.trial', { days: sub.daysLeft || 0 }); // "Trial ({{days}} days)"
      default:
        return t('profile.plan.premium');   // "Premium"
    }
  };

  const isSubscriptionActive = () =>
    subscription?.isPremium && subscription?.subscription?.isActive;

  // только id/иконки, лейблы возьмём через t при рендере
  const menuItems = [
    { id: 'subscription', icon: '⭐', showBadge: true },
    { id: 'purchase_history', icon: '📋' }
  ];

  const specialItems = [
    { id: 'special_habits', icon: '✨', highlight: true }
  ];

  const settingsItems = [
    { id: 'settings', icon: '⚙️' },
    { id: 'support', icon: '🎯' }
  ];

  const legalItems = [
    { id: 'terms' },
    { id: 'privacy' },
    { id: 'payment' }
  ];

const handleMenuClick = (itemId) => {
  console.log('Menu item clicked:', itemId);

  switch (itemId) {
    case 'subscription':
      console.log('Opening subscription page...');
      // ВАЖНО: Сначала закрываем профиль, потом открываем подписку
      setShowSubscriptionPage(true);
      break;
    case 'purchase_history':
      setShowPurchaseHistory(true);
      break;
    case 'settings':
      setShowSettings(true);
      break;
    case 'support':
      tg?.openLink?.('https://t.me/your_support_bot');
      break;
    case 'terms':
      tg?.openLink?.('https://yoursite.com/terms');
      break;
    case 'privacy':
      tg?.openLink?.('https://yoursite.com/privacy');
      break;
    case 'payment':
      tg?.openLink?.('https://yoursite.com/payment-policy');
      break;
    default:
      break;
  }
};

  // ДОБАВЬ ЭТУ ПРОВЕРКУ ПЕРЕД ОСНОВНЫМ RETURN
if (showSubscriptionPage) {
  return (
    <Subscription
      onClose={() => {
        setShowSubscriptionPage(false);
        loadSubscriptionStatus();
      }}
    />
  );
}

if (showPurchaseHistory) {
  return (
    <PurchaseHistory
      onClose={() => {
        setShowPurchaseHistory(false);
        loadSubscriptionStatus();
      }}
    />
  );
}

if (showSettings) {
  return (
    <Settings
      onClose={() => {
        setShowSettings(false);
      }}
    />
  );
}

  return (
    <div className="profile">
      <div className="profile__content">
        <div className="profile__user">
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.first_name}
              className="profile__avatar"
            />
          ) : (
            <div className="profile__avatar profile__avatar--placeholder">
              {user?.first_name?.[0] || '?'}
            </div>
          )}
          <h3 className="profile__name">
            {user?.first_name} {user?.last_name}
          </h3>
          {user?.username && (
            <p className="profile__username">@{user.username}</p>
          )}
        </div>

        <div className="profile__section profile__section--highlighted">
          <button
            className={`profile__item profile__item--subscription ${isSubscriptionActive() ? 'profile__item--active' : ''}`}
            onClick={() => handleMenuClick('subscription')}
          >
            <div className="profile__item-left">
              <span className="profile__item-icon">⭐</span>
              <span className="profile__item-label">
                {t('profile.menu.subscription')}
              </span>
            </div>
            <div className="profile__item-right">
              <span
                className={`profile__subscription-badge ${
                  isSubscriptionActive()
                    ? 'profile__subscription-badge--active'
                    : 'profile__subscription-badge--free'
                }`}
              >
                {getSubscriptionLabel()}
              </span>
              <span className="profile__item-arrow">›</span>
            </div>
          </button>

          <button
            className="profile__item"
            onClick={() => handleMenuClick('purchase_history')}
          >
            <div className="profile__item-left">
              <span className="profile__item-icon">📋</span>
              <span className="profile__item-label">
                {t('profile.menu.purchaseHistory')}
              </span>
            </div>
            <span className="profile__item-arrow">›</span>
          </button>
        </div>

        <div className="profile__section profile__section--special">
          {specialItems.map((item) => (
            <button
              key={item.id}
              className="profile__item profile__item--special"
              onClick={() => handleMenuClick(item.id)}
            >
              <div className="profile__item-left">
                <span className="profile__item-icon">{item.icon}</span>
                <span className="profile__item-label">
                  {t(`profile.menu.${item.id}`)}
                </span>
              </div>
              <span className="profile__item-arrow">›</span>
            </button>
          ))}
        </div>

        <div className="profile__section">
          {settingsItems.map((item) => (
            <button
              key={item.id}
              className="profile__item"
              onClick={() => handleMenuClick(item.id)}
            >
              <div className="profile__item-left">
                <span className="profile__item-icon">{item.icon}</span>
                <span className="profile__item-label">
                  {t(`profile.menu.${item.id}`)}
                </span>
              </div>
              <span className="profile__item-arrow">›</span>
            </button>
          ))}
        </div>

        <div className="profile__section">
          {legalItems.map((item) => (
            <button
              key={item.id}
              className="profile__item profile__item--legal"
              onClick={() => handleMenuClick(item.id)}
            >
              <span className="profile__item-label">
                {t(`profile.legal.${item.id}`)}
              </span>
              <span className="profile__item-arrow">›</span>
            </button>
          ))}
        </div>

        <div className="profile__version">
          <p>{t('profile.appVersion')}</p>
          <p>v1.20.6-00-kz.2L - v1.20.11B</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;