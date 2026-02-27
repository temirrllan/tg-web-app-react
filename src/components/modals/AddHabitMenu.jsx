// src/components/modals/AddHabitMenu.jsx
import React, { useEffect } from 'react';
import './AddHabitMenu.css';

/**
 * Bottom-sheet that appears when the user taps the "+" FAB.
 * Background is blurred. Two options:
 *   ❤️  Custom Habit   → navigates to CreateHabitForm
 *   ✨  Special Habits  → navigates to SpecialHabitsShop
 */
const AddHabitMenu = ({ isOpen, onClose, onCustomHabit, onSpecialHabits }) => {
  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="add-habit-menu__overlay" onClick={onClose}>
      <div
        className="add-habit-menu__sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="add-habit-menu__handle" />

        <p className="add-habit-menu__title">Add Habit</p>

        <button
          className="add-habit-menu__option add-habit-menu__option--custom"
          onClick={onCustomHabit}
        >
          <span className="add-habit-menu__option-icon">❤️</span>
          <div className="add-habit-menu__option-text">
            <span className="add-habit-menu__option-label">Custom Habit</span>
            <span className="add-habit-menu__option-desc">Create your own habit</span>
          </div>
          <span className="add-habit-menu__option-arrow">›</span>
        </button>

        <button
          className="add-habit-menu__option add-habit-menu__option--special"
          onClick={onSpecialHabits}
        >
          <span className="add-habit-menu__option-icon">✨</span>
          <div className="add-habit-menu__option-text">
            <span className="add-habit-menu__option-label">Special Habits</span>
            <span className="add-habit-menu__option-desc">Celebrity habit packs store</span>
          </div>
          <span className="add-habit-menu__option-arrow">›</span>
        </button>

        <button className="add-habit-menu__cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddHabitMenu;
