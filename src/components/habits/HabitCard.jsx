import React, { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { HABIT_STATUSES } from '../../utils/constants';
import './HabitCard.css';

const HabitCard = ({ habit, onMark, onUnmark, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef(null);
  
  const currentStatus = habit.today_status || HABIT_STATUSES.PENDING;
  const isCompleted = currentStatus === HABIT_STATUSES.COMPLETED;
  const isFailed = currentStatus === HABIT_STATUSES.FAILED;
  const isSkipped = currentStatus === HABIT_STATUSES.SKIPPED;
  const isPending = currentStatus === HABIT_STATUSES.PENDING;
  
  const SWIPE_THRESHOLD = 50; // Снижаем порог для лучшей отзывчивости
  const MAX_SWIPE = 100; // Уменьшаем максимальный свайп

  // Сброс offset при изменении статуса
  useEffect(() => {
    setSwipeOffset(0);
  }, [habit.today_status]);

  const getNextStatusLeft = () => {
    switch(currentStatus) {
      case HABIT_STATUSES.PENDING:
      case HABIT_STATUSES.SKIPPED:
        return HABIT_STATUSES.COMPLETED;
      case HABIT_STATUSES.FAILED:
        return HABIT_STATUSES.SKIPPED;
      case HABIT_STATUSES.COMPLETED:
        return null;
      default:
        return null;
    }
  };

  const getNextStatusRight = () => {
    switch(currentStatus) {
      case HABIT_STATUSES.PENDING:
      case HABIT_STATUSES.SKIPPED:
        return HABIT_STATUSES.FAILED;
      case HABIT_STATUSES.COMPLETED:
        return HABIT_STATUSES.SKIPPED;
      case HABIT_STATUSES.FAILED:
        return null;
      default:
        return null;
    }
  };

  const handleSwipeComplete = async (direction) => {
    if (loading || readOnly) return;
    
    let nextStatus = null;
    
    if (direction === 'left') {
      nextStatus = getNextStatusLeft();
    } else if (direction === 'right') {
      nextStatus = getNextStatusRight();
    }
    
    if (!nextStatus) {
      setSwipeOffset(0);
      return;
    }
    
    setLoading(true);
    setIsAnimating(true);
    
    try {
      if (nextStatus === HABIT_STATUSES.PENDING) {
        await onUnmark(habit.id);
      } else {
        await onMark(habit.id, nextStatus);
      }
      
      // Вибрация для обратной связи
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(10);
      }
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
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
      if (loading || isAnimating || readOnly) return;
      
      const { deltaX } = eventData;
      
      // Ограничиваем свайп в зависимости от возможных действий
      if (deltaX < 0 && !getNextStatusLeft()) return;
      if (deltaX > 0 && !getNextStatusRight()) return;
      
      const limitedDelta = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
      setSwipeOffset(limitedDelta);
    },
    onSwipedLeft: () => {
      if (loading || isAnimating || readOnly || !getNextStatusLeft()) {
        setSwipeOffset(0);
        return;
      }
      
      if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
        handleSwipeComplete('left');
      } else {
        setSwipeOffset(0);
      }
    },
    onSwipedRight: () => {
      if (loading || isAnimating || readOnly || !getNextStatusRight()) {
        setSwipeOffset(0);
        return;
      }
      
      if (swipeOffset >= SWIPE_THRESHOLD) {
        handleSwipeComplete('right');
      } else {
        setSwipeOffset(0);
      }
    },
    onTouchEndOrOnMouseUp: () => {
      // Если не достигли порога, возвращаем карточку на место
      if (Math.abs(swipeOffset) < SWIPE_THRESHOLD) {
        setSwipeOffset(0);
      }
    },
    // Критически важные настройки для мобильных устройств
    preventScrollOnSwipe: false, // Важно: false для корректной работы
    trackMouse: true,
    trackTouch: true,
    rotationAngle: 0,
    delta: 6, // Минимальное движение для начала свайпа
    touchEventOptions: { passive: true }, // Важно для производительности
  });

  // Показываем кнопки в зависимости от направления свайпа
  const showLeftButton = swipeOffset < -20 && getNextStatusLeft();
  const showRightButton = swipeOffset > 20 && getNextStatusRight();

  const getLeftButtonInfo = () => {
    const nextStatus = getNextStatusLeft();
    if (!nextStatus) return null;
    
    switch(nextStatus) {
      case HABIT_STATUSES.COMPLETED:
        return { icon: '✓', text: 'Done', className: 'done-button' };
      case HABIT_STATUSES.SKIPPED:
        return { icon: '⟳', text: 'Skip', className: 'skip-button' };
      default:
        return null;
    }
  };

  const getRightButtonInfo = () => {
    const nextStatus = getNextStatusRight();
    if (!nextStatus) return null;
    
    switch(nextStatus) {
      case HABIT_STATUSES.FAILED:
        return { icon: '✗', text: 'Undone', className: 'undone-button' };
      case HABIT_STATUSES.SKIPPED:
        return { icon: '⟳', text: 'Skip', className: 'skip-button' };
      default:
        return null;
    }
  };

  const leftButton = getLeftButtonInfo();
  const rightButton = getRightButtonInfo();

  const getCardState = () => {
    switch(currentStatus) {
      case HABIT_STATUSES.COMPLETED:
        return 'completed';
      case HABIT_STATUSES.FAILED:
        return 'failed';
      case HABIT_STATUSES.SKIPPED:
        return ''; // Без стилей для skipped
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch(currentStatus) {
      case HABIT_STATUSES.COMPLETED:
        return '✓';
      case HABIT_STATUSES.FAILED:
        return '✗';
      case HABIT_STATUSES.SKIPPED:
        return '⟳';
      default:
        return null;
    }
  };

  return (
    <div className="habit-card-wrapper">
      <div className="habit-card-container">
        {/* Кнопка справа (для свайпа вправо) */}
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
              </h3>
              <p className="habit-goal">Goal: {habit.goal}</p>
            </div>

            {/* Индикатор статуса */}
            {!isPending && (
              <div className={`status-indicator ${getCardState()}`}>
                {getStatusIcon()}
              </div>
            )}
          </div>
        </div>

        {/* Кнопка слева (для свайпа влево) */}
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
    </div>
  );
};

export default HabitCard;