import React, { useState, useEffect, useRef } from 'react';
import './WeekNavigation.css';

const WeekNavigation = ({ selectedDate, onDateSelect }) => {
  const [currentWeek, setCurrentWeek] = useState([]);
  const [centerIndex, setCenterIndex] = useState(null);
  const scrollContainerRef = useRef(null);
  const hasScrolledToToday = useRef(false);
  
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateWeekDays = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const todayStr = getTodayDate();
      const yesterdayStr = getYesterdayDate();
      
      let label = weekday;
      let isEditable = false;
      
      if (dateStr === todayStr) {
        label = 'Today';
        isEditable = true;
      } else if (dateStr === yesterdayStr) {
        label = weekday;
        isEditable = true;
      }
      
      week.push({
        date: dateStr,
        weekday,
        label,
        isToday: dateStr === todayStr,
        isYesterday: dateStr === yesterdayStr,
        isEditable,
        isPast: date < new Date(yesterdayStr),
        isFuture: date > new Date(todayStr)
      });
    }
    
    return week;
  };

  useEffect(() => {
    const week = generateWeekDays();
    setCurrentWeek(week);
    
    const todayIndex = week.findIndex(day => day.isToday);
    if (todayIndex !== -1) {
      setCenterIndex(todayIndex);
    }
  }, []);

  useEffect(() => {
    if (centerIndex !== null && scrollContainerRef.current && !hasScrolledToToday.current) {
      const container = scrollContainerRef.current;
      const buttons = container.querySelectorAll('.week-day');
      
      if (buttons[centerIndex]) {
        const button = buttons[centerIndex];
        const containerWidth = container.offsetWidth;
        const buttonWidth = button.offsetWidth;
        const buttonLeft = button.offsetLeft;
        
        const scrollPosition = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        
        setTimeout(() => {
          container.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
          });
          hasScrolledToToday.current = true;
        }, 100);
      }
    }
  }, [centerIndex]);

  const handleDayClick = (day) => {
    if (onDateSelect) {
      onDateSelect(day.date, day.isEditable);
    }
  };

  const getButtonClass = (day) => {
    const classes = ['week-day'];
    
    if (selectedDate === day.date) {
      classes.push('week-day--selected');
    }
    
    if (day.isToday) {
      classes.push('week-day--today');
    }
    
    if (day.isPast && !day.isYesterday) {
      classes.push('week-day--disabled');
    }
    
    if (day.isFuture) {
      classes.push('week-day--disabled');
    }
    
    if (!day.isEditable) {
      classes.push('week-day--readonly');
    }
    
    return classes.join(' ');
  };

  return (
    <div className="week-navigation">
      <div className="week-days-scroll" ref={scrollContainerRef}>
        {currentWeek.map((day, index) => (
          <button
            key={day.date}
            className={getButtonClass(day)}
            onClick={() => handleDayClick(day)}
            disabled={day.isPast && !day.isYesterday}
          >
            <span className="week-day-label">{day.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WeekNavigation;