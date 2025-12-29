import React from 'react';
import './Header.css';

const Header = ({ user, onProfileClick }) => {
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
          <h1 className="header__name">{user?.first_name} {user?.last_name}</h1>
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