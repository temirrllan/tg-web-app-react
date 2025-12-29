import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = ({ user, onProfileClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Обработчик ошибки загрузки изображения
  const handleImageError = () => {
    console.warn('Failed to load user avatar, using fallback');
    setImageError(true);
    setImageLoading(false);
  };

  // Обработчик успешной загрузки
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Сброс состояния при смене пользователя
  useEffect(() => {
    if (user?.photo_url) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [user?.photo_url]);

  // Функция для получения инициалов
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

  // Функция для генерации консистентного цвета на основе user ID
  const getAvatarColor = () => {
    if (!user?.id) return '#0088cc';
    
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#FFA07A', // Salmon
      '#98D8C8', // Mint
      '#F7DC6F', // Yellow
      '#BB8FCE', // Purple
      '#85C1E2', // Sky Blue
      '#F8B739', // Orange
      '#52C97F', // Green
    ];
    
    // Используем user ID для выбора консистентного цвета
    const index = user.id % colors.length;
    return colors[index];
  };

  // Функция для безопасного отображения имени
  const getDisplayName = () => {
    if (!user) return 'User';
    
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) return firstName;
    if (lastName) return lastName;
    if (user.username) return user.username;
    
    return 'User';
  };

  return (
    <header className="header">
      <div className="header__user" onClick={onProfileClick}>
        {user?.photo_url && !imageError ? (
          <>
            {/* Показываем placeholder пока загружается */}
            {imageLoading && (
              <div 
                className="header__avatar header__avatar--placeholder header__avatar--loading"
                style={{ backgroundColor: getAvatarColor() }}
              >
                {getInitials()}
              </div>
            )}
            <img 
              src={user.photo_url} 
              alt={getDisplayName()} 
              className="header__avatar"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
          </>
        ) : (
          <div 
            className="header__avatar header__avatar--placeholder"
            style={{ backgroundColor: getAvatarColor() }}
          >
            {getInitials()}
          </div>
        )}
        <div className="header__info">
          <h1 className="header__name">
            {getDisplayName()}
          </h1>
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