import React, { useRef, useEffect } from 'react';
import './WeekNavigation.css';

const WeekNavigation = ({ selectedDate, onDateSelect }) => {
  const scrollRef = useRef(null);
  const todayRef = useRef(null);
  
  // Получаем дни недели относительно сегодня
  const getDaysOfWeek = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Получаем начало недели (понедельник)
    const currentDay = today.getDay();
    const monday = new Date(today);
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    monday.setDate(today.getDate() + daysToMonday);
    
    // Генерируем 7 дней недели
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      
      const isToday = date.toDateString() === today.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();
      
      days.push({
        date: date,
        dayName: date.toLocaleDateString('en', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: isToday,
        isYesterday: isYesterday,
        isPast: date < yesterday,
        isFuture: date > today,
        isEditable: isToday || isYesterday,
        dateString: date.toISOString().split('T')[0]
      });
    }
    
    return days;
  };
  
  const days = getDaysOfWeek();
  
  // Автоматический скролл к сегодняшнему дню при загрузке
  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      setTimeout(() => {
        todayRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }, 100);
    }
  }, []);
  
  const formatDayLabel = (day) => {
    if (day.isToday) return 'Today';
    if (day.isYesterday) return 'Yesterday';
    return `${day.dayName} ${day.dayNumber}`;
  };
  
  const handleDayClick = (day) => {
    onDateSelect(day.dateString, day.isEditable);
  };
  
  return (
    <div className="week-navigation" ref={scrollRef}>
      <div className="week-navigation__scroll">
        {days.map((day, index) => (
          <button
            key={day.dateString}
            ref={day.isToday ? todayRef : null}
            className={`week-navigation__day ${
              selectedDate === day.dateString ? 'week-navigation__day--active' : ''
            } ${
              day.isToday ? 'week-navigation__day--today' : ''
            } ${
              day.isYesterday ? 'week-navigation__day--yesterday' : ''
            } ${
              !day.isEditable ? 'week-navigation__day--readonly' : ''
            }`}
            onClick={() => handleDayClick(day)}
          >
            <span className="week-navigation__day-label">
              {formatDayLabel(day)}
            </span>
            {day.isEditable && (
              <span className="week-navigation__day-badge">✏️</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WeekNavigation;