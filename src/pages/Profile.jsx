import React from 'react';
import './Profile.css';

const Profile = ({ onClose }) => {
  // user берём из Telegram WebApp на самом экране Today,
  // здесь не нужен хук, чтобы избежать двойной инициализации
  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;

  const menuItems = [
    { id: 'subscription', label: 'Subscription', value: 'Free', icon: '›' },
    { id: 'settings', label: 'Settings', icon: '›' },
    { id: 'support', label: 'Support', icon: '›' },
  ];

  const legalItems = [
    { id: 'terms', label: 'Term of Use', icon: '›' },
    { id: 'privacy', label: 'Privacy Policy', icon: '›' },
    { id: 'payment', label: 'Payment Policy', icon: '›' },
  ];

  return (
    <div className="profile">
      <div className="profile__header">
        <button className="profile__close" onClick={onClose}>
          Cancel
        </button>
        <h2>Habit Tracker</h2>
        <div className="profile__menu">⋯</div>
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
          <h3 className="profile__name">{user?.first_name} {user?.last_name}</h3>
          {user?.username && (
            <p className="profile__username">@{user.username}</p>
          )}
        </div>

        <div className="profile__section">
          {menuItems.map(item => (
            <button key={item.id} className="profile__item">
              <span className="profile__item-label">{item.label}</span>
              <span className="profile__item-value">
                {item.value && <span className="profile__item-badge">{item.value}</span>}
                {item.icon}
              </span>
            </button>
          ))}
        </div>

        <div className="profile__section">
          {legalItems.map(item => (
            <button key={item.id} className="profile__item">
              <span className="profile__item-label">{item.label}</span>
              <span className="profile__item-value">{item.icon}</span>
            </button>
          ))}
        </div>

        <div className="profile__version">
          <p>App Version</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
