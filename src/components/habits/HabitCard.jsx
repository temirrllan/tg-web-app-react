import React, { useState } from 'react';
import Button from '../common/Button';
import { HABIT_STATUSES } from '../../utils/constants';
import './HabitCard.css';

const HabitCard = ({ habit, onMark, onUnmark }) => {
  const [loading, setLoading] = useState(false);
  
  const isCompleted = habit.today_status === HABIT_STATUSES.COMPLETED;
  const isFailed = habit.today_status === HABIT_STATUSES.FAILED;
  const isSkipped = habit.today_status === HABIT_STATUSES.SKIPPED;
  
  const handleToggle = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isCompleted) {
        await onUnmark(habit.id);
      } else {
        await onMark(habit.id, HABIT_STATUSES.COMPLETED);
      }
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFail = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await onMark(habit.id, HABIT_STATUSES.FAILED);
    } catch (error) {
      console.error('Failed to mark as failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`habit-card ${isCompleted ? 'habit-card--completed' : ''} ${isFailed ? 'habit-card--failed' : ''}`}>
      <div className="habit-card__content">
        <div className="habit-card__icon">
          {habit.icon || habit.category_icon || '📌'}
        </div>
        
        <div className="habit-card__info">
          <h3 className="habit-card__title">{habit.title}</h3>
          {habit.goal && (
            <p className="habit-card__goal">Goal: {habit.goal}</p>
          )}
          {habit.streak_current > 0 && (
            <p className="habit-card__streak">🔥 {habit.streak_current} days</p>
          )}
        </div>
      </div>

      <div className="habit-card__actions">
        {!isCompleted && !isFailed && !isSkipped && (
          <>
            <Button
              variant="success"
              size="medium"
              onClick={handleToggle}
              disabled={loading}
            >
              {loading ? '...' : '✓ Done'}
            </Button>
            {habit.is_bad_habit && (
              <Button
                variant="danger"
                size="small"
                onClick={handleFail}
                disabled={loading}
              >
                ✗
              </Button>
            )}
          </>
        )}
        
        {isCompleted && (
          <Button
            variant="secondary"
            size="medium"
            onClick={handleToggle}
            disabled={loading}
          >
            {loading ? '...' : '↶ Undone'}
          </Button>
        )}
        
        {isFailed && (
          <div className="habit-card__status habit-card__status--failed">
            Failed
          </div>
        )}
        
        {isSkipped && (
          <div className="habit-card__status habit-card__status--skipped">
            Skipped
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitCard;