import React, { useState, useEffect, useRef } from 'react';
import './WeekNavigation.css';

const WeekNavigation = ({ selectedDate, onDateSelect }) => {
  const [weekDates, setWeekDates] = useState([]);
  const scrollContainerRef = useRef(null);
  
  // Получаем начало недели (понедельник)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
  
  // Генерируем даты текущей недели
  const generateWeekDates = () => {
    const today = new Date();
    const weekStart = getWeekStart(today);
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  // Форматирование даты для отображения
  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };
  
  // Форматирование числа месяца
  const formatDay = (date) => {
    return date.getDate();
  };
  
  // Проверка, можно ли редактировать день
  const isEditableDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    return compareDate >= yesterday && compareDate <= today;
  };
  
  // Проверка, является ли день будущим
  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  };
  
  // Проверка, является ли день прошедшим (кроме вчера)
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    return compareDate < yesterday;
  };
  
  // Инициализация недели
  useEffect(() => {
    const dates = generateWeekDates();
    setWeekDates(dates);
    
    // Обновляем неделю при наступлении нового понедельника
    const checkNewWeek = setInterval(() => {
      const today = new Date();
      if (today.getDay() === 1 && today.getHours() === 0 && today.getMinutes() === 0) {
        const newDates = generateWeekDates();
        setWeekDates(newDates);
      }
    }, 60000);
    
    return () => clearInterval(checkNewWeek);
  }, []);
  
  // Автоскролл к сегодняшнему дню при загрузке
  useEffect(() => {
    if (scrollContainerRef.current && weekDates.length > 0) {
      const today = new Date();
      const todayIndex = weekDates.findIndex(d => 
        d.toISOString().split('T')[0] === today.toISOString().split('T')[0]
      );
      
      if (todayIndex !== -1) {
        const dayElement = scrollContainerRef.current.children[todayIndex];
        if (dayElement) {
          setTimeout(() => {
            dayElement.scrollIntoView({ 
              behavior: 'smooth', 
              inline: 'center',
              block: 'nearest'
            });
          }, 100);
        }
      }
    }
  }, [weekDates]);
  
  const handleDateClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const isEditable = isEditableDate(date);
    onDateSelect(dateStr, isEditable);
  };
  
  const isDateSelected = (date) => {
    return date.toISOString().split('T')[0] === selectedDate;
  };
  
  const isToday = (date) => {
    const today = new Date();
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
  };
  
  return (
    <div className="week-navigation">
      <div className="week-navigation__scroll" ref={scrollContainerRef}>
        {weekDates.map((date, index) => {
          const isSelected = isDateSelected(date);
          const isTodayDate = isToday(date);
          const isFuture = isFutureDate(date);
          const isPast = isPastDate(date);
          const isEditable = isEditableDate(date);
          
          // Формируем классы для стилизации
          const classNames = [
            'week-navigation__day',
            isSelected && 'selected',
            isTodayDate && 'today',
            isPast && 'disabled',
            isFuture && 'future'
          ].filter(Boolean).join(' ');
          
          return (
            <button
              key={index}
              className={classNames}
              onClick={() => handleDateClick(date)}
              disabled={isFuture}
            >
              <span className="week-navigation__day-name">
                {formatDate(date)}
              </span>
              <span className="week-navigation__day-number">
                {formatDay(date)}
              </span>
              {isTodayDate && <span className="week-navigation__today-dot"></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeekNavigation;