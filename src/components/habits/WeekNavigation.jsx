import React, { useState, useEffect, useRef } from 'react';
import './WeekNavigation.css';

const WeekNavigation = ({ selectedDate, onDateSelect }) => {
  const [weekDates, setWeekDates] = useState([]);
  const scrollContainerRef = useRef(null);
  
  // Получаем начало недели (понедельник)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Корректировка для воскресенья
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
    
    // Для остальных дней показываем день недели и число
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = date.getDate();
    return `${dayName} ${dayNumber}`;
  };
  
  // Проверка, можно ли редактировать день (только сегодня и вчера)
  const isEditableDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    // Можно редактировать только сегодня и вчера
    return compareDate.getTime() === today.getTime() || 
           compareDate.getTime() === yesterday.getTime();
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
    yesterday.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    // Прошедшие дни - это все дни до вчерашнего (не включая вчера)
    return compareDate < yesterday;
  };
  
  // Инициализация недели
  useEffect(() => {
    const dates = generateWeekDates();
    setWeekDates(dates);
    
    // Обновляем неделю при наступлении нового понедельника
    const checkNewWeek = setInterval(() => {
      const now = new Date();
      // Проверяем каждый час в понедельник
      if (now.getDay() === 1 && now.getHours() === 0 && now.getMinutes() < 1) {
        const newDates = generateWeekDates();
        setWeekDates(newDates);
        console.log('📅 New week started, updating dates');
      }
    }, 60000); // Проверяем каждую минуту
    
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
        const scrollContainer = scrollContainerRef.current;
        const dayElements = scrollContainer.children;
        if (dayElements[todayIndex]) {
          setTimeout(() => {
            dayElements[todayIndex].scrollIntoView({ 
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
    
    console.log('Date selected:', dateStr, 'Editable:', isEditable);
    
    // Передаем дату и флаг возможности редактирования
    onDateSelect(dateStr, isEditable);
  };
  
  const isDateSelected = (date) => {
    return date.toISOString().split('T')[0] === selectedDate;
  };
  
  const isToday = (date) => {
    const today = new Date();
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
  };
  
  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
  };
  
  // Получение классов для стилизации
  const getDayClasses = (date) => {
    const classes = ['week-navigation__day'];
    
    if (isDateSelected(date)) {
      classes.push('week-navigation__day--active');
    }
    
    if (isToday(date)) {
      classes.push('week-navigation__day--today');
    }
    
    if (isYesterday(date)) {
      classes.push('week-navigation__day--yesterday');
    }
    
    if (isPastDate(date)) {
      classes.push('week-navigation__day--past');
    }
    
    if (!isEditableDate(date) && !isFutureDate(date)) {
      classes.push('week-navigation__day--readonly');
    }
    
    return classes.join(' ');
  };
  
  return (
    <div className="week-navigation">
      <div className="week-navigation__scroll" ref={scrollContainerRef}>
        {weekDates.map((date, index) => (
          <button
            key={index}
            className={getDayClasses(date)}
            onClick={() => handleDateClick(date)}
          >
            <span className="week-navigation__day-label">
              {formatDate(date)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WeekNavigation;