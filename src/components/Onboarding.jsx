import React, { useState, useEffect } from 'react';
import './Onboarding.css';
import illustration from '../../public/images/onboarding.png';
import { useTelegramTheme } from '../hooks/useTelegramTheme';

const Onboarding = ({ onComplete }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  useTelegramTheme();

  useEffect(() => {
    // Предзагрузка изображения
    const img = new Image();
    img.src = illustration;
    img.onload = () => {
      setImageLoaded(true);
    };
  }, []);

  // Показываем loader пока изображение не загрузится
  if (!imageLoaded) {
    return (
      <div className="onboarding" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary, #fff)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #A7D96C',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="onboarding__top">
        <img 
          src={illustration} 
          alt="Habit Tracker" 
          className="onboarding__img"
          loading="eager"
        />
      </div>
      <div className="onboarding__card">
        <h2 className="onboarding__title">
          Welcome to the<br />
          Habit Tracker!
        </h2>
        <p className="onboarding__desc">
          Create healthy habits and achieve<br />
          your goals with our easy-to-use<br />
          tracker.
        </p>
        <button className="onboarding__btn" onClick={onComplete}>
          Create a New Habit
        </button>
      </div>
    </div>
  );
};

export default Onboarding;