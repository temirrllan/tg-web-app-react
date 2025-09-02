import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useTelegram } from '../hooks/useTelegram';
import { habitService } from '../services/habits';
import Loader from '../components/common/Loader';
import './HabitDetail.css';

const HabitDetail = ({ habit, onClose, onEdit, onDelete }) => {
  const { tg } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    currentStreak: 0,
    weekDays: 0,
    weekTotal: 7,
    monthDays: 0,
    monthTotal: 30,
    yearDays: 0,
    yearTotal: 365
  });
  const [motivationalText, setMotivationalText] = useState('Keep going!');

  // Показываем кнопку Back
  useNavigation(onClose);

  useEffect(() => {
    loadStatistics();
  }, [habit.id]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Получаем статистику с сервера
      const stats = await habitService.getHabitStatistics(habit.id);
      
      if (stats) {
        setStatistics({
          currentStreak: stats.currentStreak || habit.streak_current || 0,
          weekDays: stats.weekCompleted || 0,
          weekTotal: 7,
          monthDays: stats.monthCompleted || 0,
          monthTotal: stats.monthTotal || 30,
          yearDays: stats.yearCompleted || 0,
          yearTotal: 365
        });
        
        // Выбираем мотивационный текст на основе streak
        const streak = stats.currentStreak || 0;
        if (streak === 0) {
          setMotivationalText("Let's start today! 💪");
        } else if (streak < 7) {
          setMotivationalText("Keep it up! 🌱");
        } else if (streak < 30) {
          setMotivationalText("Great progress! 🔥");
        } else if (streak < 100) {
          setMotivationalText("You're on fire! 🚀");
        } else {
          setMotivationalText("Incredible dedication! 🏆");
        }
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const shareText = `I'm tracking my "${habit.title}" habit with Habit Tracker! Join me to build better habits together! 💪`;
    const shareUrl = `https://t.me/your_bot_username?start=habit_${habit.id}`;
    
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
    } else {
      // Fallback для разработки
      console.log('Share:', { text: shareText, url: shareUrl });
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleCopyLink = () => {
    const inviteLink = `https://t.me/your_bot_username?start=habit_${habit.id}`;
    navigator.clipboard.writeText(inviteLink);
    
    if (tg?.showAlert) {
      tg.showAlert('Link copied to clipboard!');
    } else {
      alert('Link copied to clipboard!');
    }
  };

  const handleDelete = () => {
    if (tg?.showConfirm) {
      tg.showConfirm(
        `Are you sure you want to delete "${habit.title}"? This action cannot be undone.`,
        (confirmed) => {
          if (confirmed) {
            onDelete(habit.id);
          }
        }
      );
    } else {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${habit.title}"? This action cannot be undone.`
      );
      if (confirmed) {
        onDelete(habit.id);
      }
    }
  };

  const getCategoryEmoji = () => {
    return habit.category_icon || habit.icon || '🎯';
  };

  const getProgressPercentage = (completed, total) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getProgressColor = (type) => {
    const colors = {
      streak: '#A7D96C',
      week: '#7DD3C0',
      month: '#C084FC',
      year: '#FBBF24'
    };
    return colors[type] || '#A7D96C';
  };

  if (loading) {
    return (
      <div className="habit-detail habit-detail--loading">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="habit-detail">
      <div className="habit-detail__header">
        <button className="habit-detail__close" onClick={onClose}>
          Close
        </button>
        <div className="habit-detail__title-wrapper">
          <h1 className="habit-detail__app-title">Habit Tracker</h1>
          <span className="habit-detail__app-subtitle">mini-app</span>
        </div>
        <button className="habit-detail__menu">⋯</button>
      </div>

      <div className="habit-detail__content">
        <div className="habit-detail__habit-info">
          <div className="habit-detail__habit-header">
            <div className="habit-detail__habit-title-section">
              <span className="habit-detail__emoji">{getCategoryEmoji()}</span>
              <h2 className="habit-detail__habit-title">{habit.title}</h2>
            </div>
            <button className="habit-detail__edit-btn" onClick={() => onEdit(habit)}>
              Edit
            </button>
          </div>
          {habit.goal && (
            <p className="habit-detail__habit-goal">{habit.goal}</p>
          )}
        </div>

        <div className="habit-detail__statistics">
          <div className="habit-detail__stat-card">
            <div className="habit-detail__stat-circle" style={{
              '--progress': getProgressPercentage(statistics.currentStreak, 100),
              '--color': getProgressColor('streak')
            }}>
              <span className="habit-detail__stat-value">{statistics.currentStreak}</span>
            </div>
            <h3 className="habit-detail__stat-title">Days Strike</h3>
            <p className="habit-detail__stat-subtitle">Days Strike</p>
          </div>

          <div className="habit-detail__stat-card">
            <div className="habit-detail__stat-circle" style={{
              '--progress': getProgressPercentage(statistics.weekDays, statistics.weekTotal),
              '--color': getProgressColor('week')
            }}>
              <span className="habit-detail__stat-value">{statistics.weekDays}</span>
              <span className="habit-detail__stat-total">{statistics.weekTotal}</span>
            </div>
            <h3 className="habit-detail__stat-title">Week</h3>
            <p className="habit-detail__stat-subtitle">Days Strike</p>
          </div>

          <div className="habit-detail__stat-card">
            <div className="habit-detail__stat-circle" style={{
              '--progress': getProgressPercentage(statistics.monthDays, statistics.monthTotal),
              '--color': getProgressColor('month')
            }}>
              <span className="habit-detail__stat-value">{statistics.monthDays}</span>
              <span className="habit-detail__stat-total">{statistics.monthTotal}</span>
            </div>
            <h3 className="habit-detail__stat-title">Month</h3>
            <p className="habit-detail__stat-subtitle">Days Strike</p>
          </div>

          <div className="habit-detail__stat-card">
            <div className="habit-detail__stat-circle" style={{
              '--progress': getProgressPercentage(statistics.yearDays, statistics.yearTotal),
              '--color': getProgressColor('year')
            }}>
              <span className="habit-detail__stat-value">{statistics.yearDays}</span>
              <span className="habit-detail__stat-total">{statistics.yearTotal}</span>
            </div>
            <h3 className="habit-detail__stat-title">Year</h3>
            <p className="habit-detail__stat-subtitle">Days Strike</p>
          </div>
        </div>

        <div className="habit-detail__motivation">
          <p className="habit-detail__motivation-text">
            Good Job My Friend! 🔥
          </p>
        </div>

        <div className="habit-detail__friends">
          <h3 className="habit-detail__friends-title">Habit Friends</h3>
          <p className="habit-detail__friends-subtitle">
            Share the link with friends and invite them to track habits together.
          </p>
          
          <div className="habit-detail__share-buttons">
            <button 
              className="habit-detail__btn habit-detail__btn--outline"
              onClick={handleCopyLink}
            >
              Copy Link
            </button>
            <button 
              className="habit-detail__btn habit-detail__btn--primary"
              onClick={handleShare}
            >
              Share
            </button>
          </div>
        </div>

        <button 
          className="habit-detail__btn habit-detail__btn--danger"
          onClick={handleDelete}
        >
          Remove Habit
        </button>
      </div>
    </div>
  );
};

export default HabitDetail;