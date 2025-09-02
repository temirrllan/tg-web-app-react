import React, { useState, useRef, useEffect } from 'react';
import { HABIT_STATUSES } from '../../utils/constants';
import './HabitCard.css';

const HabitCard = ({ habit, onMark, onUnmark, readOnly = false, onClick }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const cardRef = useRef(null);

  const SWIPE_THRESHOLD = 80;
  const SWIPE_VELOCITY_THRESHOLD = 0.3;

  // Получаем статус карточки
  const getCardState = () => {
    switch (habit.today_status) {
      case HABIT_STATUSES.COMPLETED:
        return 'completed';
      case HABIT_STATUSES.FAILED:
        return 'failed';
      case HABIT_STATUSES.SKIPPED:
        return 'skipped';
      default:
        return '';
    }
  };

  // Получаем иконку статуса
  const getStatusIcon = () => {
    switch (habit.today_status) {
      case HABIT_STATUSES.COMPLETED:
        return '✓';
      case HABIT_STATUSES.FAILED:
        return '✗';
      case HABIT_STATUSES.SKIPPED:
        return '→';
      default:
        return null;
    }
  };

  // Определяем доступные кнопки свайпа
  const getSwipeButtons = () => {
    const buttons = { left: null, right: null };
    
    if (readOnly) return buttons;

    switch (habit.today_status) {
      case HABIT_STATUSES.COMPLETED:
        buttons.right = {
          action: 'undone',
          text: 'Undone',
          icon: '↺',
          className: 'undone-button'
        };
        break;
      case HABIT_STATUSES.FAILED:
        buttons.left = {
          action: 'done',
          text: 'Done',
          icon: '✓',
          className: 'done-button'
        };
        break;
      case HABIT_STATUSES.SKIPPED:
        buttons.left = {
          action: 'done',
          text: 'Done',
          icon: '✓',
          className: 'done-button'
        };
        buttons.right = {
          action: 'undone',
          text: 'Undone',
          icon: '✗',
          className: 'undone-button'
        };
        break;
      default: // PENDING
        buttons.left = {
          action: 'done',
          text: 'Done',
          icon: '✓',
          className: 'done-button'
        };
        buttons.right = {
          action: 'skip',
          text: 'Skip',
          icon: '→',
          className: 'skip-button'
        };
        break;
    }

    return buttons;
  };

  const handleTouchStart = (e) => {
    if (readOnly) return;
    
    setIsSwiping(false);
    setIsAnimating(false);
    startXRef.current = e.touches[0].clientX;
    startTimeRef.current = Date.now();
  };

  const handleTouchMove = (e) => {
    if (readOnly) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Начинаем свайп только после минимального движения
    if (Math.abs(diff) > 5) {
      setIsSwiping(true);
    }
    
    if (isSwiping) {
      e.preventDefault(); // Предотвращаем скролл при свайпе
      
      const buttons = getSwipeButtons();
      const maxSwipe = 120;
      
      // Ограничиваем свайп в зависимости от доступных кнопок
      let newOffset = diff;
      if (!buttons.left && diff < 0) {
        newOffset = 0;
      } else if (!buttons.right && diff > 0) {
        newOffset = 0;
      } else {
        newOffset = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
      }
      
      setSwipeOffset(newOffset);
    }
  };

  const handleTouchEnd = () => {
    if (readOnly || !isSwiping) {
      setSwipeOffset(0);
      return;
    }
    
    const endTime = Date.now();
    const timeDiff = endTime - startTimeRef.current;
    const velocity = Math.abs(swipeOffset) / timeDiff;
    
    const buttons = getSwipeButtons();
    const shouldTrigger = Math.abs(swipeOffset) > SWIPE_THRESHOLD || 
                          velocity > SWIPE_VELOCITY_THRESHOLD;
    
    if (shouldTrigger) {
      if (swipeOffset < 0 && buttons.left) {
        triggerAction(buttons.left.action);
      } else if (swipeOffset > 0 && buttons.right) {
        triggerAction(buttons.right.action);
      } else {
        resetSwipe();
      }
    } else {
      resetSwipe();
    }
    
    setIsSwiping(false);
  };

  const triggerAction = (action) => {
    setIsAnimating(true);
    
    // Анимация возврата карточки
    setTimeout(() => {
      setSwipeOffset(0);
      
      // Выполняем действие
      switch (action) {
        case 'done':
          onMark && onMark(habit.id, HABIT_STATUSES.COMPLETED);
          break;
        case 'undone':
          if (habit.today_status === HABIT_STATUSES.COMPLETED) {
            onUnmark && onUnmark(habit.id);
          } else {
            onMark && onMark(habit.id, HABIT_STATUSES.FAILED);
          }
          break;
        case 'skip':
          onMark && onMark(habit.id, HABIT_STATUSES.SKIPPED);
          break;
      }
      
      setIsAnimating(false);
    }, 200);
  };

  const resetSwipe = () => {
    setIsAnimating(true);
    setSwipeOffset(0);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleCardClick = (e) => {
    // Только если не было свайпа и есть обработчик
    if (!isSwiping && onClick && Math.abs(swipeOffset) < 5) {
      e.stopPropagation();
      onClick(habit);
    }
  };

  // Сброс при изменении привычки
  useEffect(() => {
    setSwipeOffset(0);
    setIsSwiping(false);
    setIsAnimating(false);
  }, [habit.id, habit.today_status]);

  const buttons = getSwipeButtons();
  const showLeftButton = swipeOffset < -20 && buttons.left;
  const showRightButton = swipeOffset > 20 && buttons.right;
  const leftButton = buttons.left;
  const rightButton = buttons.right;

  const getCategoryEmoji = () => {
    return habit.category_icon || habit.icon || '🎯';
  };

  return (
    <div className="habit-card-container">
      {/* Правая кнопка (для свайпа вправо) */}
      {rightButton && (
        <div 
          className={`swipe-action-button ${rightButton.className} ${showRightButton ? 'visible' : ''}`}
          style={{
            left: 0,
            opacity: showRightButton ? Math.min(swipeOffset / SWIPE_THRESHOLD, 1) : 0,
            transform: `scale(${showRightButton ? Math.min(swipeOffset / SWIPE_THRESHOLD, 1) : 0.8})`
          }}
        >
          <span className="swipe-action-icon">{rightButton.icon}</span>
          <span className="swipe-action-text">{rightButton.text}</span>
        </div>
      )}

      {/* Основная карточка */}
      <div 
        ref={cardRef}
        className={`habit-card ${getCardState()} ${isAnimating ? 'animating' : ''} ${isSwiping ? 'swiping' : ''}`}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: isAnimating ? 'transform 0.3s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        <div className="habit-card-content">
          <div className={`habit-icon ${getCardState()}`}>
            <span className="habit-emoji">{getCategoryEmoji()}</span>
          </div>
          <div className="habit-info">
            <h3 className="habit-title">{habit.title}</h3>
            <p className="habit-goal">{habit.goal || 'No specific goal'}</p>
          </div>
          {habit.today_status !== HABIT_STATUSES.PENDING && (
            <div className={`status-indicator ${getCardState()}`}>
              {getStatusIcon()}
            </div>
          )}
        </div>
      </div>

      {/* Левая кнопка (для свайпа влево) */}
      {leftButton && (
        <div 
          className={`swipe-action-button ${leftButton.className} ${showLeftButton ? 'visible' : ''}`}
          style={{
            right: 0,
            opacity: showLeftButton ? Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1) : 0,
            transform: `scale(${showLeftButton ? Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1) : 0.8})`
          }}
        >
          <span className="swipe-action-icon">{leftButton.icon}</span>
          <span className="swipe-action-text">{leftButton.text}</span>
        </div>
      )}
    </div>
  );
};

export default HabitCard;