import React from 'react';
import HabitCard from './HabitCard';
import './HabitGroup.css';

const HabitGroup = ({ title, habits, onMark, onUnmark, readOnly }) => {
  if (!habits || habits.length === 0) return null;
  
  return (
    <div className="habit-group">
      <h3 className="habit-group__title">{title}</h3>
      <div className="habit-group__list">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onMark={onMark}
            onUnmark={onUnmark}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
};

export default HabitGroup;