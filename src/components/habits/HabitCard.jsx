import React, { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { HABIT_STATUSES, STATUS_LABELS } from '../../utils/constants';
import './HabitCard.css';

const HabitCard = ({ habit, onMark, onUnmark }) => {
  const [loading, setLoading] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const cardRef = useRef(null);
  
  const currentStatus = habit.today_status || HABIT_STATUSES.PENDING;
  const isCompleted = currentStatus === HABIT_STATUSES.COMPLETED;
  const isFailed = currentStatus === HABIT_STATUSES.FAILED;
  const isSkipped = currentStatus === HABIT_STATUSES.SKIPPED;
  const isPending = currentStatus === HABIT_STATUSES.PENDING;
  
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 120;

  // Сброс offset при изменении статуса
  useEffect(() => {
    setSwipeOffset(0);
  }, [habit.today_status]);

  const getNextStatusLeft = () => {
    // Свайп влево (к Done)
    switch(currentStatus) {
      case HABIT_STATUSES.PENDING:
      case HABIT_STATUSES.SKIPPED:
        return HABIT_STATUSES.COMPLETED;
      case HABIT_STATUSES.FAILED:
        return HABIT_STATUSES.SKIPPED;
      case HABIT_STATUSES.COMPLETED:
        return null; // Нельзя свайпнуть влево из Done
      default:
        return null;
    }
  };

  const getNextStatusRight = () => {
    // Свайп вправо (к Undone)
    switch(currentStatus) {
      case HABIT_STATUSES.PENDING:
      case HABIT_STATUSES.SKIPPED:
        return HABIT_STATUSES.FAILED;
      case HABIT_STATUSES.COMPLETED:
        return HABIT_STATUSES.SKIPPED;
      case HABIT_STATUSES.FAILED:
        return null; // Нельзя свайпнуть вправо из Undone
      default:
        return null;
    }
  };

  const handleSwipeComplete = async (direction) => {
    if (loading) return;
    
    let nextStatus = null;
    
    if (direction === 'left') {
      nextStatus = getNextStatusLeft();
    } else if (direction === 'right') {
      nextStatus = getNextStatusRight();
    }
    
    if (!nextStatus) {
      // Если нет следующего статуса, просто сбрасываем свайп
      setSwipeOffset(0);
      return;
    }
    
    setLoading(true);
    setIsAnimating(true);
    
    try {
      // Отправляем новый статус на сервер
      if (nextStatus === HABIT_STATUSES.PENDING) {
        // Если возвращаемся в pending, используем unmark
        await onUnmark(habit.id);
      } else {
        // Для всех остальных статусов используем mark
        await onMark(habit.id, nextStatus);
      }
      
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
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
      
      const { deltaX, dir } = eventData;
      
      // Проверяем, можем ли свайпать в эту сторону
      if (dir === 'Left' && !getNextStatusLeft()) {
        return; // Блокируем свайп влево если нет следующего статуса
      }
      
      if (dir === 'Right' && !getNextStatusRight()) {
        return; // Блокируем свайп вправо если нет следующего статуса
      }
      
      const limitedDelta = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
      setSwipeOffset(limitedDelta);
      setIsTouching(true);
    },
    onSwipedLeft: () => {
      if (loading || isAnimating || !getNextStatusLeft()) {
        setSwipeOffset(0);
        setIsTouching(false);
        return;
      }
      
      if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
        handleSwipeComplete('left');
      } else {
        setSwipeOffset(0);
      }
      setIsTouching(false);
    },
    onSwipedRight: () => {
      if (loading || isAnimating || !getNextStatusRight()) {
        setSwipeOffset(0);
        setIsTouching(false);
        return;
      }
      
      if (swipeOffset >= SWIPE_THRESHOLD) {
        handleSwipeComplete('right');
      } else {
        setSwipeOffset(0);
      }
      setIsTouching(false);
    },
    onSwiped: () => {
      if (Math.abs(swipeOffset) < SWIPE_THRESHOLD) {
        setSwipeOffset(0);
      }
      setIsTouching(false);
    },
    onTouchEndOrOnMouseUp: () => {
      setIsTouching(false);
      if (Math.abs(swipeOffset) < SWIPE_THRESHOLD) {
        setSwipeOffset(0);
      }
    },
    trackMouse: true,
    trackTouch: true,
    delta: 6,
    preventScrollOnSwipe: true,
    rotationAngle: 0,
    swipeDuration: 500,
    touchEventOptions: { passive: false },
  });

  // Показываем кнопки в зависимости от направления свайпа и текущего статуса
  const showLeftButton = swipeOffset < -20 && getNextStatusLeft();
  const showRightButton = swipeOffset > 20 && getNextStatusRight();

  // Определяем какую кнопку показывать слева
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

  // Определяем какую кнопку показывать справа
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

  // Определяем визуальное состояние карточки
  const getCardState = () => {
    switch(currentStatus) {
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
        className={`habit-card ${getCardState()} ${isAnimating ? 'animating' : ''} ${isTouching ? 'touching' : ''}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isTouching ? 'none' : 'transform 0.3s ease-out'
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
  );
};

export default HabitCard;