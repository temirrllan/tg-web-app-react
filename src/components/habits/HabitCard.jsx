import React, { useState, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { HABIT_STATUSES } from '../../utils/constants';
import './HabitCard.css';

const HabitCard = ({ habit, onMark, onUnmark }) => {
  const [loading, setLoading] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef(null);
  
  const isCompleted = habit.today_status === HABIT_STATUSES.COMPLETED;
  const isFailed = habit.today_status === HABIT_STATUSES.FAILED;
  
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 120;

  const handleSwipeComplete = async (direction) => {
    if (loading) return;
    
    setLoading(true);
    setIsAnimating(true);
    
    try {
      if (direction === 'left') {
        // Свайп влево - всегда отмечаем как выполненное
        await onMark(habit.id, HABIT_STATUSES.COMPLETED);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
      } else if (direction === 'right') {
        // Свайп вправо - всегда отмечаем как невыполненное/failed
        if (isCompleted) {
          await onUnmark(habit.id);
        } else {
          await onMark(habit.id, HABIT_STATUSES.FAILED);
        }
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      }
    } catch (error) {
      console.error('Failed to update habit:', error);
    } finally {
      setLoading(false);
      setIsAnimating(false);
      setSwipeOffset(0);
    }
  };

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (loading || isAnimating) return;
      
      const { deltaX } = eventData;
      // Теперь можно свайпать в обе стороны всегда
      const limitedDelta = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
      setSwipeOffset(limitedDelta);
    },
    onSwipedLeft: () => {
      if (loading || isAnimating) return;
      
      if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
        handleSwipeComplete('left');
      } else {
        setSwipeOffset(0);
      }
    },
    onSwipedRight: () => {
      if (loading || isAnimating) return;
      
      if (swipeOffset >= SWIPE_THRESHOLD) {
        handleSwipeComplete('right');
      } else {
        setSwipeOffset(0);
      }
    },
    onSwiped: () => {
      if (Math.abs(swipeOffset) < SWIPE_THRESHOLD) {
        setSwipeOffset(0);
      }
    },
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
  });

  // Показываем кнопки в зависимости от направления свайпа
  const showDoneButton = swipeOffset < -20;
  const showUndoneButton = swipeOffset > 20;

  // Определяем визуальное состояние карточки
  const getCardState = () => {
    if (isCompleted) return 'completed';
    if (isFailed) return 'failed';
    return '';
  };

  return (
    <div className="habit-card-container">
      {/* Кнопка Undone/Failed слева */}
      <div 
        className={`undone-button ${showUndoneButton ? 'visible' : ''} ${!isCompleted ? 'failed-variant' : ''}`}
        style={{
          opacity: showUndoneButton ? Math.min(swipeOffset / SWIPE_THRESHOLD, 1) : 0,
          transform: `scale(${showUndoneButton ? Math.min(swipeOffset / SWIPE_THRESHOLD, 1) : 0.8})`
        }}
      >
        <span className="undone-icon">
          {isCompleted ? '⟲' : '✗'}
        </span>
        <span className="undone-text">
          {isCompleted ? 'Undone' : 'Failed'}
        </span>
      </div>

      {/* Основная карточка */}
      <div 
        {...handlers}
        ref={cardRef}
        className={`habit-card ${getCardState()} ${isAnimating ? 'animating' : ''}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        <div className="habit-card-content">
          <div className={`habit-icon ${getCardState()}`}>
            <span className="habit-emoji">{habit.icon || habit.category_icon || '🏃'}</span>
          </div>
          
          <div className="habit-info">
<h3 className="habit-title">
  {habit.is_bad_habit && '😈 '}
  {habit.title}
</h3>            <p className="habit-goal">Goal: {habit.goal}</p>
          </div>

          {/* Индикатор статуса */}
          {(isCompleted || isFailed) && (
            <div className={`status-indicator ${getCardState()}`}>
              {isCompleted ? '✓' : '✗'}
            </div>
          )}
        </div>
      </div>

      {/* Кнопка Done справа */}
      <div 
        className={`done-button ${showDoneButton ? 'visible' : ''}`}
        style={{
          opacity: showDoneButton ? Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1) : 0,
          transform: `scale(${showDoneButton ? Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1) : 0.8})`
        }}
      >
        <span className="done-checkmark">✓</span>
        <span className="done-text">Done</span>
      </div>
    </div>
  );
};

export default HabitCard;