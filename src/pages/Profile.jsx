import React, { useState } from 'react';
import './Profile.css';
import { useNavigation } from '../hooks/useNavigation';

const Profile = ({ onClose }) => {
  useNavigation(onClose);
  const [cacheCleared, setCacheCleared] = useState(false);
  
  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user || {
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser'
  };

  const menuItems = [
    { id: 'subscription', label: 'Subscription', value: 'Free', icon: '›' },
    { id: 'settings', label: 'Settings', icon: '›' },
    { id: 'support', label: 'Support', icon: '›' },
    { id: 'clear-cache', label: 'Clear Cache', icon: '🧹' }, // Добавляем пункт очистки кэша
  ];

  const legalItems = [
    { id: 'terms', label: 'Term of Use', icon: '›' },
    { id: 'privacy', label: 'Privacy Policy', icon: '›' },
    { id: 'payment', label: 'Payment Policy', icon: '›' },
  ];

  const clearAppCache = () => {
    try {
      // Сохраняем важные данные
      const userId = localStorage.getItem('user_id');
      const hasSeenHint = localStorage.getItem('hasSeenSwipeHint');
      
      // Очищаем localStorage
      localStorage.clear();
      
      // Восстанавливаем важные данные
      if (userId) localStorage.setItem('user_id', userId);
      if (hasSeenHint) localStorage.setItem('hasSeenSwipeHint', hasSeenHint);
      
      // Устанавливаем флаг для очистки кэша привычек
      localStorage.setItem('clearHabitCache', 'true');
      
      // Очищаем sessionStorage
      sessionStorage.clear();
      
      setCacheCleared(true);
      
      // Показываем уведомление через Telegram
      if (tg?.showAlert) {
        tg.showAlert('Cache cleared successfully! The app will reload now.', () => {
          window.location.reload();
        });
      } else {
        // Для разработки
        alert('Cache cleared successfully! The app will reload now.');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      if (tg?.showAlert) {
        tg.showAlert('Error clearing cache. Please try again.');
      }
    }
  };

  const handleMenuClick = (itemId) => {
    console.log('Menu item clicked:', itemId);
    
    switch(itemId) {
      case 'clear-cache':
        clearAppCache();
        break;
      case 'subscription':
        // Открыть страницу подписки
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
      <div className="profile__header">
        <button className="profile__close" onClick={onClose}>
          Close
        </button>
        <div className="profile__title">
          <h2>Habit Tracker</h2>
          <span className="profile__subtitle">mini-app</span>
        </div>
        <button className="profile__menu">⋯</button>
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

        <div className="profile__section">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              className="profile__item"
              onClick={() => handleMenuClick(item.id)}
              disabled={item.id === 'clear-cache' && cacheCleared}
            >
              <div className="profile__item-left">
                <span className="profile__item-icon">{item.id === 'clear-cache' ? item.icon : '⚪'}</span>
                <span className="profile__item-label">
                  {item.id === 'clear-cache' && cacheCleared ? 'Cache Cleared ✓' : item.label}
                </span>
              </div>
              <span className="profile__item-value">
                {item.value && <span className="profile__item-badge">{item.value}</span>}
                {item.id !== 'clear-cache' && item.icon}
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
        </div>
      </div>
    </div>
  );
};

export default Profile;