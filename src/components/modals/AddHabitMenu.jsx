// src/components/modals/AddHabitMenu.jsx
import React, { useEffect } from 'react';
import './AddHabitMenu.css';

const AddHabitMenu = ({ isOpen, onClose, onCustomHabit, onSpecialHabits }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop — closes menu on outside tap */}
      <div
        className={`ahm-backdrop ${isOpen ? 'ahm-backdrop--visible' : ''}`}
        onClick={onClose}
      />

      {/* Floating cards above FAB */}
      <div className={`ahm-container ${isOpen ? 'ahm-container--open' : ''}`}>

        {/* Custom Habit — slides up second (delay 0ms) */}
        <div className={`ahm-row ahm-row--custom ${isOpen ? 'ahm-row--visible' : ''}`}>
          <span className="ahm-label">Custom Habit</span>
          <button className="ahm-btn ahm-btn--custom" onClick={onCustomHabit}>
            <span>🩷</span>
          </button>
        </div>

        {/* Special Habits — slides up first (delay 60ms) */}
        <div className={`ahm-row ahm-row--special ${isOpen ? 'ahm-row--visible' : ''}`}>
          <span className="ahm-label">Special Habits</span>
          <button className="ahm-btn ahm-btn--special" onClick={onSpecialHabits}>
            <span className="ahm-sparkle">✦</span>
          </button>
        </div>

      </div>
    </>
  );
};

export default AddHabitMenu;
