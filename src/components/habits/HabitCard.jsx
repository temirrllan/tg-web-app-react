import React, { useState } from 'react';
import { HABIT_STATUSES } from '../../utils/constants';

const HabitCard = ({ habit, onMark, onUnmark }) => {
  const [loading, setLoading] = useState(false);
  
  const isCompleted = habit.today_status === HABIT_STATUSES.COMPLETED;
  const isFailed = habit.today_status === HABIT_STATUSES.FAILED;
  
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
    <div className="flex items-center gap-3">
      {/* Левая часть карточки */}
      <div className={`flex-1 bg-white rounded-2xl p-4 flex items-center gap-3 ${
        isCompleted ? 'bg-[#E8F5E9]' : isFailed ? 'bg-[#FFEBEE]' : ''
      }`}>
        {/* Иконка */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
          isCompleted ? 'bg-[#4CAF50]' : 'bg-[#E3F2FD]'
        }`}>
          {habit.icon || habit.category_icon || '🏃'}
        </div>

        {/* Информация */}
        <div className="flex-1">
          <h3 className="font-semibold text-black text-base">{habit.title}</h3>
          <p className="text-gray-500 text-sm">Goal: {habit.goal}</p>
        </div>
      </div>

      {/* Кнопки действий */}
      {!isCompleted && !isFailed && (
        <button
          onClick={handleToggle}
          disabled={loading}
          className="bg-[#4CAF50] text-white px-6 py-3 rounded-2xl font-semibold shadow-sm"
        >
          ✓ Done
        </button>
      )}

      {isCompleted && (
        <button
          onClick={handleToggle}
          disabled={loading}
          className="bg-[#546E7A] text-white px-4 py-3 rounded-2xl font-semibold flex items-center gap-2"
        >
          <span className="text-xl">↶</span> Undone
        </button>
      )}

      {isFailed && (
        <div className="bg-gray-600 text-white px-6 py-3 rounded-2xl font-semibold">
          ✗
        </div>
      )}
    </div>
  );
};

export default HabitCard;