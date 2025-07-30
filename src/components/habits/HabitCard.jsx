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

  return (
    <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center">
        {/* Иконка */}
        <div className="w-[48px] h-[48px] bg-[#E8F4F9] rounded-[14px] flex items-center justify-center mr-3">
          <span className="text-[24px]">{habit.icon || habit.category_icon || '🏃'}</span>
        </div>

        {/* Информация */}
        <div className="flex-1">
          <h3 className="font-semibold text-black text-[17px] mb-1">{habit.title}</h3>
          <p className="text-gray-400 text-[14px]">Goal: {habit.goal}</p>
        </div>
      </div>
    </div>
  );
};

export default HabitCard;