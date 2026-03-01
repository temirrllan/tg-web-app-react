// src/pages/SpecialHabitDetail.jsx
// Same design as HabitDetail — Edit / Friends / Remove hidden for special habits.
import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import { habitService } from '../services/habits';
import { specialHabitsService } from '../services/specialHabits';
import Loader from '../components/common/Loader';
import './HabitDetail.css';
import './SpecialHabitDetail.css';

const SpecialHabitDetail = ({ habit, onClose }) => {
  useNavigation(onClose);
  useTelegramTheme();

  const [loading, setLoading]           = useState(true);
  const [statistics, setStatistics]     = useState({
    currentStreak: 0,
    weekDays: 0,  weekTotal: 7,
    monthDays: 0, monthTotal: 30,
    yearDays: 0,  yearTotal: 365,
  });
  const [achievements, setAchievements] = useState([]);

  useEffect(() => { loadData(); }, [habit.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, progress] = await Promise.all([
        habitService.getHabitStatistics(habit.id),
        habit.pack_id
          ? specialHabitsService.getPackProgress(habit.pack_id)
          : Promise.resolve({ achievements: [] }),
      ]);

      if (stats) {
        setStatistics({
          currentStreak: stats.currentStreak || habit.streak_current || 0,
          weekDays:  stats.weekCompleted  || 0,
          weekTotal: 7,
          monthDays:  stats.monthCompleted || 0,
          monthTotal: stats.monthTotal    || 30,
          yearDays:  stats.yearCompleted  || 0,
          yearTotal: 365,
        });
      }
      setAchievements(progress.achievements || []);
    } catch (err) {
      console.error('SpecialHabitDetail load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryEmoji = () => habit.category_icon || habit.icon || '🎯';

  const getProgressPercentage = (completed, total) => {
    if (!total) return 0;
    return Math.round((completed / total) * 100);
  };

  const COLORS = {
    streak: '#A7D96C',
    week:   '#7DD3C0',
    month:  '#C084FC',
    year:   '#FBBF24',
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
      <div className="habit-detail__content">

        {/* ── Habit info (no Edit button) ─────────────────────────────── */}
        <div className="habit-detail__habit-info">
          <div className="habit-detail__habit-header">
            <div className="habit-detail__habit-title-section">
              <span className="habit-detail__emoji">{getCategoryEmoji()}</span>
              <h2 className="habit-detail__habit-title">{habit.title}</h2>
            </div>
          </div>
          {habit.goal && (
            <p className="habit-detail__habit-goal">{habit.goal}</p>
          )}
        </div>

        {/* ── Statistics ─────────────────────────────────────────────── */}
        <div className="habit-detail__statistics">

          <div className="habit-detail__stat-card">
            <div
              className="habit-detail__stat-circle"
              style={{
                '--progress': getProgressPercentage(statistics.currentStreak, 100),
                '--color': COLORS.streak,
              }}
            >
              <span className="habit-detail__stat-value">{statistics.currentStreak}</span>
            </div>
            <h3 className="habit-detail__stat-title">Days Streak</h3>
            <p className="habit-detail__stat-subtitle">Days Streak</p>
          </div>

          <div className="habit-detail__stat-card">
            <div
              className="habit-detail__stat-circle"
              style={{
                '--progress': getProgressPercentage(statistics.weekDays, statistics.weekTotal),
                '--color': COLORS.week,
              }}
            >
              <span className="habit-detail__stat-value">{statistics.weekDays}</span>
              <span className="habit-detail__stat-total">{statistics.weekTotal}</span>
            </div>
            <h3 className="habit-detail__stat-title">Week</h3>
            <p className="habit-detail__stat-subtitle">Days Streak</p>
          </div>

          <div className="habit-detail__stat-card">
            <div
              className="habit-detail__stat-circle"
              style={{
                '--progress': getProgressPercentage(statistics.monthDays, statistics.monthTotal),
                '--color': COLORS.month,
              }}
            >
              <span className="habit-detail__stat-value">{statistics.monthDays}</span>
              <span className="habit-detail__stat-total">{statistics.monthTotal}</span>
            </div>
            <h3 className="habit-detail__stat-title">Month</h3>
            <p className="habit-detail__stat-subtitle">Days Streak</p>
          </div>

          <div className="habit-detail__stat-card">
            <div
              className="habit-detail__stat-circle"
              style={{
                '--progress': getProgressPercentage(statistics.yearDays, statistics.yearTotal),
                '--color': COLORS.year,
              }}
            >
              <span className="habit-detail__stat-value">{statistics.yearDays}</span>
              <span className="habit-detail__stat-total">{statistics.yearTotal}</span>
            </div>
            <h3 className="habit-detail__stat-title">Year</h3>
            <p className="habit-detail__stat-subtitle">Days Streak</p>
          </div>

        </div>

        {/* ── Motivation banner ──────────────────────────────────────── */}
        <div className="habit-detail__motivation">
          <p className="habit-detail__motivation-text">
            Good Job My Friend! 🔥
          </p>
        </div>

        {/* ── Achievements ───────────────────────────────────────────── */}
        {achievements.length > 0 && (
          <div className="shd-achievements">
            <h3 className="shd-achievements__title">Achievement</h3>
            <div className="shd-achievements__list">
              {achievements.map(a => {
                const unlocked = a.is_unlocked;
                const isEmoji  = a.icon && !a.icon.startsWith('http');
                return (
                  <div
                    key={a.id}
                    className={`shd-achievement ${unlocked ? 'shd-achievement--unlocked' : ''}`}
                  >
                    <div className="shd-achievement__icon">
                      {isEmoji
                        ? <span>{a.icon || '🏅'}</span>
                        : a.icon
                          ? <img src={a.icon} alt={a.title} />
                          : <span>🏅</span>
                      }
                    </div>
                    <div className="shd-achievement__info">
                      <span className="shd-achievement__title">
                        {a.title}{' '}
                        <span className="shd-achievement__count">
                          {a.current_count}/{a.required_count}
                        </span>
                      </span>
                      <span className="shd-achievement__desc">
                        Perform the habit: {a.required_count} times
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SpecialHabitDetail;
