import React, { useRef } from 'react';
import './Header.css';

const Header = ({ user, onProfileClick }) => {
  const tapRef = useRef({ count: 0, timer: null });

  const handleNameTap = (e) => {
    e.stopPropagation();
    const t = tapRef.current;
    t.count++;
    clearTimeout(t.timer);
    if (t.count >= 5) {
      t.count = 0;
      localStorage.removeItem('onboarding_done');
      localStorage.removeItem('hasSeenFabHint');
      localStorage.removeItem('hasSeenWeekHint');
      localStorage.removeItem('hint_swipe_shown');
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      window.Telegram?.WebApp?.showAlert?.('Hints reset! Restart app.');
    } else {
      t.timer = setTimeout(() => { t.count = 0; }, 1500);
    }
  };

  return (
    <header className="header">
      <div className="header__user" onClick={onProfileClick}>
        {user?.photo_url ? (
          <img 
            src={user.photo_url} 
            alt={user.first_name} 
            className="header__avatar"
          />
        ) : (
          <div className="header__avatar header__avatar--placeholder">
            {user?.first_name?.[0] || '?'}
          </div>
        )}
        <div className="header__info">
          <h1 className="header__name" onClick={handleNameTap}>{user?.first_name} {user?.last_name}</h1>
          {user?.username && (
            <p className="header__username">@{user.username}</p>
          )}
        </div>
        <div className="header__arrow">›</div>
      </div>
    </header>
  );
};

export default Header;