// src/pages/Profile.jsx - С АВТОМАТИЧЕСКИМ ОБНОВЛЕНИЕМ

import React, { useState, useEffect, useCallback } from 'react';
import './Profile.css';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import PurchaseHistory from './PurchaseHistory';
import Subscription from './Subscription';
import Settings from './Settings';
import { useTranslation } from '../hooks/useTranslation';
import { useTelegramTheme } from '../hooks/useTelegramTheme';

const Profile = ({ onClose }) => {
  const { t } = useTranslation();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  useTelegramTheme();
const [avatarError, setAvatarError] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const childOpen = showPurchaseHistory || showSubscriptionPage || showSettings;
  useNavigation(onClose, { isVisible: !childOpen });

  // 🔥 МЕМОИЗИРОВАННАЯ функция загрузки
  const loadSubscriptionStatus = useCallback(async (forceRefresh = false) => {
    try {
      console.log(`📊 Loading subscription status (force: ${forceRefresh})...`);
      
      const status = await habitService.checkSubscriptionLimits(forceRefresh);
      
      setSubscription(status);
      
      console.log('✅ Subscription status loaded:', {
        isPremium: status.isPremium,
        plan: status.subscription?.planType,
        active: status.subscription?.isActive
      });
      
      return status;
    } catch (error) {
      console.error('Failed to load subscription:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔥 НОВЫЙ: Слушатель события payment_success
  useEffect(() => {
    const handlePaymentSuccess = async (event) => {
      console.log('🎉 Profile: Payment success event received');
      
      // Принудительно обновляем статус подписки
      await loadSubscriptionStatus(true);
      
      // Вибрация успеха
      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    };

    window.addEventListener('payment_success', handlePaymentSuccess);
    
    return () => {
      window.removeEventListener('payment_success', handlePaymentSuccess);
    };
  }, [loadSubscriptionStatus]);

  // Начальная загрузка
  useEffect(() => {
    loadSubscriptionStatus(false);

    const handleFocus = () => {
      console.log('👀 Profile became visible, refreshing...');
      loadSubscriptionStatus(true);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadSubscriptionStatus]);

  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user || {
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser'
  };
const handleAvatarError = (e) => {
    console.warn('❌ Failed to load profile avatar:', {
      url: user?.photo_url,
      error: e.type
    });
    setAvatarError(true);
    setAvatarLoading(false);
  };
   const handleAvatarLoad = () => {
    console.log('✅ Profile avatar loaded');
    setAvatarLoading(false);
  };

  const getInitials = () => {
    if (!user) return '?';
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    
    if (user.username) {
      return user.username[0].toUpperCase();
    }
    
    return '?';
  };

  const getAvatarColor = () => {
    // Используем telegram_id если есть, иначе простой хеш от имени
    const id = user?.id || 0;
    
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C97F'
    ];
    
    const index = id % colors.length;
    return colors[index];
  };

  const isValidImageUrl = (url) => {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    if (url.trim() === '') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };
  const shouldShowAvatar = user?.photo_url && 
                          isValidImageUrl(user.photo_url) && 
                          !avatarError;
  const getSubscriptionLabel = () => {
    if (loading) return t('common.loading');

    if (!subscription || !subscription.isPremium || !subscription.subscription) {
      return t('profile.plan.free');
    }

    const sub = subscription.subscription;
    if (!sub.isActive) {
      return t('profile.plan.free');
    }

    if (sub.planName) {
      return sub.planName;
    }

    const planType = sub.planType || '';
    switch (planType) {
      case '6_months':
        return t('profile.plan.sixMonths');
      case '1_year':
        return t('profile.plan.oneYear');
      case 'lifetime':
        return t('profile.plan.lifetime');
      case 'trial_7_days':
        return t('profile.plan.trial', { days: sub.daysLeft || 0 });
      default:
        return t('profile.plan.premium');
    }
  };

  const isSubscriptionActive = () =>
    subscription?.isPremium && subscription?.subscription?.isActive;

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
        setShowSubscriptionPage(true);
        break;
      case 'purchase_history':
        setShowPurchaseHistory(true);
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'support':
        tg?.openLink?.('https://t.me/Migin_Sergey');
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

  if (showSubscriptionPage) {
    return (
      <Subscription
        onClose={() => {
          setShowSubscriptionPage(false);
          loadSubscriptionStatus(true); // 🔥 Принудительное обновление
        }}
      />
    );
  }

  if (showPurchaseHistory) {
    return (
      <PurchaseHistory
        onClose={() => {
          setShowPurchaseHistory(false);
          loadSubscriptionStatus(true);
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
          {shouldShowAvatar ? (
            <>
              {avatarLoading && (
                <div 
                  className="profile__avatar profile__avatar--placeholder"
                  style={{ backgroundColor: getAvatarColor() }}
                >
                  {getInitials()}
                </div>
              )}
              <img
                src={user.photo_url}
                alt={user.first_name}
                className="profile__avatar"
                onError={handleAvatarError}
                onLoad={handleAvatarLoad}
                loading="lazy"
                style={{ display: avatarLoading ? 'none' : 'block' }}
                crossOrigin="anonymous"
              />
            </>
          ) : (
            <div 
              className="profile__avatar profile__avatar--placeholder"
              style={{ backgroundColor: getAvatarColor() }}
            >
              {getInitials()}
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