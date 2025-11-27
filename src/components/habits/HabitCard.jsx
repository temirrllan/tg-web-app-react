import React, { useState, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import './HabitCard.css';
import { useTranslation } from '../../hooks/useTranslation';

const HabitCard = ({ habit, onMark, onUnmark, onClick, readOnly = false }) => {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  // 🔥 НОВОЕ: Отслеживание движения для предотвращения ложных кликов
  const touchStartRef = useRef(null);
  const touchMoveRef = useRef(false);
  const swipeStartTimeRef = useRef(null);

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 150;
  const CLICK_MAX_MOVEMENT = 10; // Максимальное движение для клика (пикселей)
  const CLICK_MAX_DURATION = 300; // Максимальная длительность для клика (мс)

  const status = habit.today_status || 'pending';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isSkipped = status === 'skipped';

  // 🎯 Обработчик начала касания
  const handleTouchStart = (e) => {
    if (readOnly) return;
    
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
    touchMoveRef.current = false;
    swipeStartTimeRef.current = Date.now();
    setIsSwiping(true);
  };

  // 🎯 Обработчик движения
  const handleTouchMove = (e) => {
    if (!isSwiping || readOnly || !touchStartRef.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;
    
    // Определяем направление свайпа
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    
    if (isHorizontalSwipe) {
      // Это горизонтальный свайп - блокируем вертикальный скролл
      e.preventDefault();
      touchMoveRef.current = true;
      
      const limitedOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
      setOffset(limitedOffset);
    } else {
      // Это вертикальный скролл - не мешаем
      setIsSwiping(false);
      setOffset(0);
      touchStartRef.current = null;
    }
  };

  // 🎯 Обработчик конца касания
  const handleTouchEnd = () => {
    if (readOnly) {
      resetSwipe();
      return;
    }

    const swipeDuration = Date.now() - (swipeStartTimeRef.current || 0);

    // 🔥 ПРОВЕРКА: Был ли это клик или свайп?
    if (touchStartRef.current && !touchMoveRef.current) {
      // Это был клик (не было движения)
      handleCardClick();
    } else if (Math.abs(offset) >= SWIPE_THRESHOLD) {
      // Это был свайп (достаточное расстояние)
      handleSwipe();
    }

    resetSwipe();
  };

  // 🎯 Обработчик клика по карточке
  const handleCardClick = () => {
    console.log('Card clicked (not swiped):', habit.title);
    if (onClick && !readOnly) {
      onClick(habit);
    }
  };

  // 🎯 Обработчик свайпа
  const handleSwipe = () => {
    console.log('Swipe detected:', { offset, status });
    
    if (offset < -SWIPE_THRESHOLD) {
      // Свайп влево - выполнено
      if (status === 'pending' || status === 'failed' || status === 'skipped') {
        onMark?.(habit.id, 'completed');
      }
    } else if (offset > SWIPE_THRESHOLD) {
      // Свайп вправо - не выполнено
      if (status === 'completed') {
        onUnmark?.(habit.id);
      } else if (status === 'pending') {
        onMark?.(habit.id, 'failed');
      }
    }
  };

  // 🎯 Сброс состояния свайпа
  const resetSwipe = () => {
    setOffset(0);
    setIsSwiping(false);
    touchStartRef.current = null;
    touchMoveRef.current = false;
    swipeStartTimeRef.current = null;
  };

  // 🎯 Клик по кнопке Skip
  const handleSkipClick = (e) => {
    e.stopPropagation();
    if (!readOnly && status === 'pending') {
      onMark?.(habit.id, 'skipped');
    }
  };

  const getCategoryEmoji = () => {
    return habit.category_icon || habit.icon || '🎯';
  };

  const getMembersDisplay = () => {
    const count = habit.members_count || 0;
    if (count === 0) return null;
    return `👥 ${count}`;
  };

  return (
    <div className="habit-card-container">
      {/* Кнопка UNDONE (справа) */}
      {offset < -20 && (
        <div 
          className={`swipe-action-button done-button ${offset < -SWIPE_THRESHOLD ? 'visible' : ''}`}
          style={{ right: 0 }}
        >
          <span className="swipe-action-icon">✓</span>
          <span className="swipe-action-text">{t('button.done')}</span>
        </div>
      )}

      {/* Карточка привычки */}
      <div
        className={`habit-card ${status} ${isSwiping ? 'touching' : 'animating'}`}
        style={{
          transform: `translateX(${offset}px)`,
          cursor: readOnly ? 'default' : 'pointer'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="habit-card-content">
          <div className={`habit-icon ${status}`}>
            <span className="habit-emoji">{getCategoryEmoji()}</span>
          </div>

          <div className="habit-info">
            <h3 className="habit-title">
              {habit.title}
              {getMembersDisplay() && (
                <span style={{ 
                  marginLeft: '8px', 
                  fontSize: '14px',
                  color: '#8E8E93'
                }}>
                  {getMembersDisplay()}
                </span>
              )}
            </h3>
            {habit.goal && (
              <p className="habit-goal">{habit.goal}</p>
            )}
          </div>

          {!readOnly && status === 'pending' && (
            <button 
              className="skip-button-small"
              onClick={handleSkipClick}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#FF9500'
              }}
            >
              ⏭
            </button>
          )}

          {(isCompleted || isFailed || isSkipped) && (
            <div className={`status-indicator ${status}`}>
              {isCompleted && '✓'}
              {isFailed && '✗'}
              {isSkipped && '⏭'}
            </div>
          )}
        </div>
      </div>

      {/* Кнопка FAILED (слева) */}
      {offset > 20 && (
        <div 
          className={`swipe-action-button undone-button ${offset > SWIPE_THRESHOLD ? 'visible' : ''}`}
          style={{ left: 0 }}
        >
          <span className="swipe-action-icon">✗</span>
          <span className="swipe-action-text">{t('button.unDone')}</span>
        </div>
      )}
    </div>
  );
};

export default HabitCard;