import React from 'react';
import './Onboarding.css';

const Onboarding = ({ user }) => {
  return (
    <div className="onboarding">
      <h1>Добро пожаловать, {user.first_name}!</h1>
      <div className="onboarding-content">
        <h2>Habit Tracker</h2>
        <p>Отслеживайте свои привычки и достигайте целей!</p>
        
        <div className="features">
          <div className="feature">
            <h3>📊 Статистика</h3>
            <p>Следите за прогрессом</p>
          </div>
          <div className="feature">
            <h3>🎯 Цели</h3>
            <p>Ставьте и достигайте цели</p>
          </div>
          <div className="feature">
            <h3>🏆 Достижения</h3>
            <p>Получайте награды</p>
          </div>
        </div>
        
        <button className="start-button">Начать</button>
      </div>
    </div>
  );
};

export default Onboarding;