import React, { useEffect, useState } from 'react';
import './FriendSwipeHint.css';

const FriendSwipeHint = ({ show, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    if (!show) return;
    
    setIsVisible(true);
    setIsHiding(false);

    // Автоматически скрываем через 5 секунд
    const hideTimer = setTimeout(() => {
      setIsHiding(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, 5000);

    return () => clearTimeout(hideTimer);
  }, [show, onClose]);

  const handleOverlayClick = () => {
    setIsHiding(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!show || !isVisible) return null;

  return (
    <div 
      className={`friend-hint-overlay ${isHiding ? 'friend-hint-overlay--hiding' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="friend-hint" onClick={(e) => e.stopPropagation()}>
        <h3 className="friend-hint__title">Friend Actions</h3>
        
        <div className="friend-hint__content">
          <div className="friend-hint__item">
            <div className="friend-hint__arrow friend-hint__arrow--left">
              👊
            </div>
            <div className="friend-hint__text">
              <strong>Swipe left</strong> to send a friendly reminder (Punch) to complete the habit
            </div>
          </div>
          
          <div className="friend-hint__item">
            <div className="friend-hint__arrow friend-hint__arrow--right">
              ✕
            </div>
            <div className="friend-hint__text">
              <strong>Swipe right</strong> to remove friend from this habit
            </div>
          </div>
        </div>
        
        <button className="friend-hint__button" onClick={handleOverlayClick}>
          Got it!
        </button>
      </div>
    </div>
  );
};

export default FriendSwipeHint;