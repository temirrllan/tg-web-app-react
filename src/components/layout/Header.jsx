import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = ({ user, onProfileClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Обработчик ошибки загрузки изображения
  const handleImageError = (e) => {
    console.warn('❌ Failed to load user avatar:', {
      url: user?.photo_url,
      userId: user?.id,
      error: e.type
    });
    setImageError(true);
    setImageLoading(false);
  };

  // Обработчик успешной загрузки
  const handleImageLoad = () => {
    console.log('✅ Avatar loaded successfully');
    setImageLoading(false);
  };

  // Сброс состояния при смене пользователя или URL
  useEffect(() => {
    if (user?.photo_url && !imageError) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [user?.photo_url, user?.id]);

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

  // Проверяем валидность URL
  const isValidImageUrl = (url) => {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    if (url.trim() === '') return false;
    // Проверяем что это HTTP/HTTPS URL
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const shouldShowImage = user?.photo_url && 
                          isValidImageUrl(user.photo_url) && 
                          !imageError;

  return (
    <header className="header">
      <div className="header__user" onClick={onProfileClick}>
        {shouldShowImage ? (
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
              crossOrigin="anonymous"
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