import React, { useRef, useEffect } from 'react';
import './WeekNavigation.css';

const WeekNavigation = ({ selectedDate, onDateSelect }) => {
  const scrollRef = useRef(null);
  const todayRef = useRef(null);
  
  // Получаем дни относительно сегодня (показываем окно в 7 дней с Today в центре)
  const getDaysAroundToday = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Показываем 3 дня до и 3 дня после сегодня
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const isToday = i === 0;
      const isYesterday = i === -1;
      
      days.push({
        date: date,
        dayName: date.toLocaleDateString('en', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: isToday,
        isYesterday: isYesterday,
        isPast: i < -1,
        isFuture: i > 0,
        isEditable: isToday || isYesterday,
        dateString: date.toISOString().split('T')[0]
      });
    }
    
    return days;
  };
  
  const days = getDaysAroundToday();
  
  // Автоматический скролл к Today при загрузке
  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      setTimeout(() => {
        const container = scrollRef.current;
        const todayElement = todayRef.current;
        const containerWidth = container.offsetWidth;
        const todayWidth = todayElement.offsetWidth;
        const todayLeft = todayElement.offsetLeft;
        
        // Центрируем Today
        container.scrollLeft = todayLeft - (containerWidth / 2) + (todayWidth / 2);
      }, 100);
    }
  }, []);
  
  const formatDayLabel = (day) => {
    if (day.isToday) return 'Today';
    return `${day.dayName} ${day.dayNumber}`;
  };
  
  const handleDayClick = (day) => {
    onDateSelect(day.dateString, day.isEditable);
  };
  
  return (
    <div className="week-navigation" ref={scrollRef}>
      <div className="week-navigation__scroll">
        {days.map((day) => (
          <button
            key={day.dateString}
            ref={day.isToday ? todayRef : null}
            className={`week-navigation__day ${
              selectedDate === day.dateString ? 'week-navigation__day--active' : ''
            } ${
              day.isToday ? 'week-navigation__day--today' : ''
            } ${
              !day.isEditable && !day.isFuture ? 'week-navigation__day--past' : ''
            }`}
            onClick={() => handleDayClick(day)}
          >
            {formatDayLabel(day)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WeekNavigation;