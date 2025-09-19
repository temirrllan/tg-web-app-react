import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';

const Profile = ({ onClose }) => {
  useNavigation(onClose);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user || {
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser'
  };

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

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
    if (loading) return 'Loading...';
    
    if (!subscription || !subscription.subscription || !subscription.subscription.isActive) {
      return 'Free';
    }
    
    const sub = subscription.subscription;
    
    // Форматируем label в зависимости от типа подписки
    // Обрабатываем оба варианта: с подчеркиванием и с пробелом
    const planType = sub.planType || '';
    
    if (planType === '6_months' || planType === '6 months') {
      return 'For 6 Month';
    }
    
    if (planType === '1_year' || planType === '1 year') {
      return 'For 1 Year';
    }
    
    if (planType === 'lifetime') {
      return 'Lifetime';
    }
    
    // Для trial или других типов
    if (sub.isTrial) {
      return `Trial (${sub.daysLeft || 0} days)`;
    }
    
    return 'Premium';
  };

  const isSubscriptionActive = () => {
    return subscription && subscription.subscription && subscription.subscription.isActive;
  };

  const menuItems = [
    { 
      id: 'subscription', 
      label: 'Subscription', 
      icon: '⭐',
      showBadge: true
    },
    { 
      id: 'purchase_history', 
      label: 'Purchase History',
      icon: '📋'
    }
  ];

  const specialItems = [
    { 
      id: 'special_habits', 
      label: 'Special Habits',
      icon: '✨',
      highlight: true
    }
  ];

  const settingsItems = [
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'support', label: 'Support', icon: '🎯' }
  ];

  const legalItems = [
    { id: 'terms', label: 'Term of Use' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'payment', label: 'Payment Policy' }
  ];

  const handleMenuClick = (itemId) => {
    console.log('Menu item clicked:', itemId);
    
    switch(itemId) {
      case 'subscription':
        if (subscription && subscription.subscription && subscription.subscription.isActive) {
          const sub = subscription.subscription;
          const message = `Plan: ${sub.planName}\n` +
                         `Started: ${new Date(sub.startsAt).toLocaleDateString()}\n` +
                         (sub.expiresAt ? `Expires: ${new Date(sub.expiresAt).toLocaleDateString()}` : 'Lifetime access');
          
          if (tg?.showAlert) {
            tg.showAlert(message);
          } else {
            alert(message);
          }
        }
        break;
      case 'settings':
        break;
      case 'support':
        if (tg) {
          tg.openLink('https://t.me/your_support_bot');
        }
        break;
      case 'terms':
        if (tg) {
          tg.openLink('https://yoursite.com/terms');
        }
        break;
      case 'privacy':
        if (tg) {
          tg.openLink('https://yoursite.com/privacy');
        }
        break;
      case 'payment':
        if (tg) {
          tg.openLink('https://yoursite.com/payment-policy');
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="profile">
      <div className="profile__header">
        <button className="profile__back" onClick={onClose}>
          Back
        </button>
        <div className="profile__title">
          <h2>Habit Tracker</h2>
          <span className="profile__subtitle">mini-app</span>
        </div>
        <button className="profile__menu">
          ⋯
        </button>
      </div>

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
              <span className="profile__item-label">Subscription</span>
            </div>
            <div className="profile__item-right">
              <span className={`profile__subscription-badge ${isSubscriptionActive() ? 'profile__subscription-badge--active' : 'profile__subscription-badge--free'}`}>
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
              <span className="profile__item-label">Purchase History</span>
            </div>
            <span className="profile__item-arrow">›</span>
          </button>
        </div>

        <div className="profile__section profile__section--special">
          {specialItems.map(item => (
            <button 
              key={item.id} 
              className="profile__item profile__item--special"
              onClick={() => handleMenuClick(item.id)}
            >
              <div className="profile__item-left">
                <span className="profile__item-icon">{item.icon}</span>
                <span className="profile__item-label">{item.label}</span>
              </div>
              <span className="profile__item-arrow">›</span>
            </button>
          ))}
        </div>

        <div className="profile__section">
          {settingsItems.map(item => (
            <button 
              key={item.id} 
              className="profile__item"
              onClick={() => handleMenuClick(item.id)}
            >
              <div className="profile__item-left">
                <span className="profile__item-icon">{item.icon}</span>
                <span className="profile__item-label">{item.label}</span>
              </div>
              <span className="profile__item-arrow">›</span>
            </button>
          ))}
        </div>

        <div className="profile__section">
          {legalItems.map(item => (
            <button 
              key={item.id} 
              className="profile__item profile__item--legal"
              onClick={() => handleMenuClick(item.id)}
            >
              <span className="profile__item-label">{item.label}</span>
              <span className="profile__item-arrow">›</span>
            </button>
          ))}
        </div>

        <div className="profile__version">
          <p>App Version</p>
          <p>v1.20.6-00-kz.2L - v1.20.11B</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;