import React, { useState } from 'react';
import { HABIT_STATUSES } from '../../utils/constants';

const HabitCard = ({ habit, onMark, onUnmark, category = 'morning' }) => {
  const [loading, setLoading] = useState(false);
  
  const isCompleted = habit.today_status === HABIT_STATUSES.COMPLETED;
  const isFailed = habit.today_status === HABIT_STATUSES.FAILED;
  
  // Цвета для разных категорий согласно макету
  const categoryColors = {
    morning: 'bg-[#E8F4F9]', // Голубой для утренних привычек
    afternoon: 'bg-[#F3E8FF]', // Фиолетовый для дневных привычек
    evening: 'bg-[#FFE8F5]' // Розовый для вечерних привычек
  };
  
  // Иконки для разных категорий
  const getCategoryIcon = (habitTitle) => {
    const title = habitTitle.toLowerCase();
    if (title.includes('run') || title.includes('бег')) return '🏃';
    if (title.includes('water') || title.includes('вода')) return '💧';
    if (title.includes('read') || title.includes('читать')) return '📖';
    if (title.includes('yoga') || title.includes('йога')) return '🧘';
    return habit.icon || habit.category_icon || '🏃';
  };
  
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
        {/* Иконка с цветом категории */}
        <div className={`w-[48px] h-[48px] ${categoryColors[category]} rounded-[14px] flex items-center justify-center mr-3`}>
          <span className="text-[24px]">{getCategoryIcon(habit.title)}</span>
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