// src/pages/SpecialHabitDetail.jsx
// Detail page for an individual special (pack) habit.
// Same stats as regular HabitDetail but WITHOUT edit / delete / friends sections.
import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useTelegram } from '../hooks/useTelegram';
import { habitService } from '../services/habits';
import { specialHabitsService } from '../services/specialHabits';
import Loader from '../components/common/Loader';
import './SpecialHabitDetail.css';

const SpecialHabitDetail = ({ habit, onClose }) => {
  const { tg } = useTelegram();
  useNavigation(onClose);

  const [loading, setLoading]         = useState(true);
  const [statistics, setStatistics]   = useState(null);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    loadData();
  }, [habit.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, progress] = await Promise.all([
        habitService.getHabitStatistics(habit.id),
        habit.pack_id
          ? specialHabitsService.getPackProgress(habit.pack_id)
          : Promise.resolve({ achievements: [] }),
      ]);

      setStatistics(stats);
      setAchievements(progress.achievements || []);
    } catch (err) {
      console.error('SpecialHabitDetail load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryEmoji = () => habit.category_icon || habit.icon || '🎯';

  const getProgressPercentage = (value, total) =>
    total > 0 ? Math.round((value / total) * 100) : 0;

  const COLORS = { streak: '#A7D96C', week: '#7DD3C0', month: '#C084FC', year: '#FBBF24' };

  if (loading) {
    return (
      <div className="special-habit-detail special-habit-detail--loading">
        <Loader size="large" />
      </div>
    );
  }

  const stats = statistics || {};

  return (
    <div className="special-habit-detail">
      <div className="special-habit-detail__content">

        {/* Header */}
        <div className="special-habit-detail__header">
          <span className="special-habit-detail__emoji">{getCategoryEmoji()}</span>
          <h2 className="special-habit-detail__title">{habit.title}</h2>
          {habit.goal && (
            <p className="special-habit-detail__goal">{habit.goal}</p>
          )}
          <span className="special-habit-detail__badge">✨ Special Habit</span>
        </div>

        {/* Statistics */}
        <div className="special-habit-detail__statistics">
          {[
            { key: 'streak', label: 'Days Streak',  value: stats.currentStreak || 0, total: null },
            { key: 'week',   label: 'Week',          value: stats.weekCompleted || 0, total: 7 },
            { key: 'month',  label: 'Month',         value: stats.monthCompleted || 0, total: stats.monthTotal || 30 },
            { key: 'year',   label: 'Year',          value: stats.yearCompleted || 0, total: 365 },
          ].map(({ key, label, value, total }) => (
            <div key={key} className="special-habit-detail__stat-card">
              <div
                className="special-habit-detail__stat-circle"
                style={{ '--progress': getProgressPercentage(value, total || 100), '--color': COLORS[key] }}
              >
                <span className="special-habit-detail__stat-value">{value}</span>
                {total && <span className="special-habit-detail__stat-total">{total}</span>}
              </div>
              <h3 className="special-habit-detail__stat-title">{label}</h3>
            </div>
          ))}
        </div>

        {/* Motivation banner */}
        <div className="special-habit-detail__motivation">
          Good Job My Friend! 🔥
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="special-habit-detail__achievements">
            <h3 className="special-habit-detail__section-title">Achievements</h3>
            <div className="special-habit-detail__achievement-list">
              {achievements.map(a => {
                const isEmoji = a.icon && !a.icon.startsWith('http');
                const unlocked = a.is_unlocked;
                return (
                  <div
                    key={a.id}
                    className={`special-habit-detail__achievement ${unlocked ? 'special-habit-detail__achievement--unlocked' : ''}`}
                  >
                    <div className="special-habit-detail__achievement-icon">
                      {isEmoji ? <span>{a.icon || '🏅'}</span> : a.icon ? <img src={a.icon} alt={a.title} /> : <span>🏅</span>}
                    </div>
                    <div className="special-habit-detail__achievement-info">
                      <span className="special-habit-detail__achievement-title">{a.title}</span>
                      <span className="special-habit-detail__achievement-desc">{a.description}</span>
                    </div>
                    <span className={`special-habit-detail__achievement-progress ${unlocked ? 'special-habit-detail__achievement-progress--done' : ''}`}>
                      {a.current_count}/{a.required_count}
                    </span>
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
