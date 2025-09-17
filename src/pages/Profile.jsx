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
      console.log('Subscription status:', status);
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
    
    if (sub.planType === 'lifetime') {
      return 'Lifetime';
    }
    
    if (sub.daysLeft !== null) {
      if (sub.daysLeft <= 7) {
        return `Premium (${sub.daysLeft} days left)`;
      }
      return 'Premium';
    }
    
    return 'Premium';
  };

  const getSubscriptionColor = () => {
    if (!subscription || !subscription.subscription || !subscription.subscription.isActive) {
      return '#8E8E93';
    }
    
    const sub = subscription.subscription;
    
    if (sub.daysLeft !== null && sub.daysLeft <= 7) {
      return '#FF9500'; // Оранжевый для скорого истечения
    }
    
    return '#34C759'; // Зеленый для активной подписки
  };

  const menuItems = [
    { 
      id: 'subscription', 
      label: 'Subscription', 
      value: getSubscriptionLabel(), 
      icon: '›',
      valueColor: getSubscriptionColor()
    },
    { id: 'settings', label: 'Settings', icon: '›' },
    { id: 'support', label: 'Support', icon: '›' },
  ];

  const legalItems = [
    { id: 'terms', label: 'Term of Use', icon: '›' },
    { id: 'privacy', label: 'Privacy Policy', icon: '›' },
    { id: 'payment', label: 'Payment Policy', icon: '›' },
  ];

  const handleMenuClick = (itemId) => {
    console.log('Menu item clicked:', itemId);
    
    switch(itemId) {
      case 'subscription':
        // Можно добавить страницу управления подпиской
        if (subscription && subscription.subscription && subscription.subscription.isActive) {
          // Показать информацию о текущей подписке
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
        // Открыть настройки
        break;
      case 'support':
        // Открыть поддержку
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

        <div className="profile__section">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              className="profile__item"
              onClick={() => handleMenuClick(item.id)}
            >
              <div className="profile__item-left">
                <span className="profile__item-icon">⚪</span>
                <span className="profile__item-label">{item.label}</span>
              </div>
              <span className="profile__item-value">
                {item.value && (
                  <span 
                    className="profile__item-badge" 
                    style={{ color: item.valueColor || '#8E8E93' }}
                  >
                    {item.value}
                  </span>
                )}
                {item.icon}
              </span>
            </button>
          ))}
        </div>

        <div className="profile__section">
          {legalItems.map(item => (
            <button 
              key={item.id} 
              className="profile__item"
              onClick={() => handleMenuClick(item.id)}
            >
              <span className="profile__item-label">{item.label}</span>
              <span className="profile__item-value">{item.icon}</span>
            </button>
          ))}
        </div>

        <div className="profile__version">
          <p>App Version</p>
          <p>v1.20.6-00-kz.2L - v1.20.11B</p>
          {subscription && subscription.habitCount !== undefined && (
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#8E8E93' }}>
              Habits: {subscription.habitCount}/{subscription.limit}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;