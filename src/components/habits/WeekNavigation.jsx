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
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(12, 0, 0, 0); // Устанавливаем полдень для избежания проблем с часовыми поясами
    return weekStart;
  };
  
  // Генерируем даты текущей недели
  const generateWeekDates = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Устанавливаем полдень
    const weekStart = getWeekStart(today);
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      date.setHours(12, 0, 0, 0); // Устанавливаем полдень для каждой даты
      dates.push(date);
    }
    
    return dates;
  };
  
  // Форматирование даты в строку YYYY-MM-DD
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Форматирование даты для отображения
  const formatDate = (date) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const compareDate = new Date(date);
    compareDate.setHours(12, 0, 0, 0);
    
    // Сравниваем даты по строковому представлению
    const dateStr = formatDateString(compareDate);
    const todayStr = formatDateString(today);
    const yesterdayStr = formatDateString(yesterday);
    const tomorrowStr = formatDateString(tomorrow);
    
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    
    // Для остальных дней показываем день недели и число
    const dayName = compareDate.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = compareDate.getDate();
    return `${dayName} ${dayNumber}`;
  };
  
  // Проверка, можно ли редактировать день (только сегодня и вчера)
  const isEditableDate = (date) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const compareDate = new Date(date);
    compareDate.setHours(12, 0, 0, 0);
    
    const dateStr = formatDateString(compareDate);
    const todayStr = formatDateString(today);
    const yesterdayStr = formatDateString(yesterday);
    
    // Можно редактировать только сегодня и вчера
    return dateStr === todayStr || dateStr === yesterdayStr;
  };
  
  // Проверка, является ли день будущим
  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const compareDate = new Date(date);
    compareDate.setHours(12, 0, 0, 0);
    
    return compareDate > today;
  };
  
  // Проверка, является ли день прошедшим (кроме вчера)
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const compareDate = new Date(date);
    compareDate.setHours(12, 0, 0, 0);
    
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
      today.setHours(12, 0, 0, 0);
      const todayStr = formatDateString(today);
      
      const todayIndex = weekDates.findIndex(d => 
        formatDateString(d) === todayStr
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
    const dateStr = formatDateString(date);
    const isEditable = isEditableDate(date);
    
    console.log('Date selected:', dateStr, 'Editable:', isEditable);
    
    // Передаем дату и флаг возможности редактирования
    onDateSelect(dateStr, isEditable);
  };
  
  const isDateSelected = (date) => {
    return formatDateString(date) === selectedDate;
  };
  
  const isToday = (date) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return formatDateString(date) === formatDateString(today);
  };
  
  const isYesterday = (date) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDateString(date) === formatDateString(yesterday);
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
  
  // Для отладки - выводим текущие даты
  useEffect(() => {
    if (weekDates.length > 0) {
      console.log('Week dates:', weekDates.map(d => ({
        date: formatDateString(d),
        display: formatDate(d),
        isToday: isToday(d),
        isYesterday: isYesterday(d),
        isFuture: isFutureDate(d),
        isPast: isPastDate(d)
      })));
    }
  }, [weekDates]);
  
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