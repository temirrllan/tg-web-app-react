// src/components/modals/AchievementUnlockedPopup.jsx
import React, { useEffect } from 'react';
import './AchievementUnlockedPopup.css';

/**
 * Full-screen popup shown when a pack achievement is unlocked.
 * Accepts a queue of achievements and shows one at a time.
 *
 * Props:
 *   achievement  – { title, icon, description, required_count }
 *   onClose      – called when user taps "Thanks"
 */
const AchievementUnlockedPopup = ({ achievement, onClose }) => {
  useEffect(() => {
    if (!achievement) return;
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  }, [achievement]);

  if (!achievement) return null;

  const isEmoji = achievement.icon && !achievement.icon.startsWith('http');

  return (
    <div className="achievement-popup__overlay">
      <div className="achievement-popup__card">
        <div className="achievement-popup__stars">✨ ✨ ✨</div>

        <div className="achievement-popup__icon-wrap">
          {isEmoji ? (
            <span className="achievement-popup__emoji">{achievement.icon || '🏆'}</span>
          ) : (
            <img
              src={achievement.icon}
              alt={achievement.title}
              className="achievement-popup__img"
            />
          )}
        </div>

        <p className="achievement-popup__congrats">Congratulations!</p>
        <p className="achievement-popup__won">You have won an award!</p>

        <h2 className="achievement-popup__title">{achievement.title}</h2>

        {achievement.description && (
          <p className="achievement-popup__desc">{achievement.description}</p>
        )}

        <button className="achievement-popup__btn" onClick={onClose}>
          Thanks! 🙏
        </button>
      </div>
    </div>
  );
};

export default AchievementUnlockedPopup;
