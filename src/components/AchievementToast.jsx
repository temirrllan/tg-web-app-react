// frontend/src/components/AchievementToast.jsx - Всплывающее уведомление о достижении

import React, { useEffect, useState } from 'react';
import './AchievementToast.css';

const AchievementToast = ({ achievement, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Анимация появления
    setTimeout(() => setVisible(true), 100);

    // Автоматическое закрытие через 5 секунд
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  return (
    <div className={`achievement-toast ${visible ? 'visible' : ''}`}>
      <div className="toast-content">
        <div className="toast-icon">🏆</div>
        <div className="toast-text">
          <h4>Achievement Unlocked!</h4>
          <p>{achievement.title}</p>
          {achievement.description && (
            <span className="toast-description">{achievement.description}</span>
          )}
        </div>
        <button className="toast-close" onClick={handleClose}>×</button>
      </div>
    </div>
  );
};

export default AchievementToast;