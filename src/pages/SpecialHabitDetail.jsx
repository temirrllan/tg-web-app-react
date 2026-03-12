// src/pages/SpecialHabitDetail.jsx
// Detail page for habits from packs — same animated stats as HabitDetail,
// plus the Achievements block (unchanged). No Edit/Friends/Delete buttons.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import { useTranslation } from '../hooks/useTranslation';
import { habitService } from '../services/habits';
import { specialHabitsService } from '../services/specialHabits';
import Loader from '../components/common/Loader';
// Reuse the animated SVG components from HabitDetail
import { CircularProgress, StatCard, WeeklyChart } from './HabitDetail';
import './HabitDetail.css';
import './SpecialHabitDetail.css';

const SpecialHabitDetail = ({ habit, onClose }) => {
  useNavigation(onClose);
  useTelegramTheme();
  const { t } = useTranslation();

  const [loading, setLoading]       = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [statistics, setStatistics] = useState({
    currentStreak:  0,
    weekDays:       0, weekTotal:  7,
    monthDays:      0, monthTotal: 30,
    yearDays:       0, yearTotal:  365,
    bestStreak:     0,
    totalCompleted: 0,
    weeklyData:     [],
  });

  // ── Load (force-refresh, parallel) ──────────────────────────────────
  const loadData = useCallback(async (force = false) => {
    try {
      const [stats, progress] = await Promise.all([
        habitService.getHabitStatistics(habit.id, force),
        habit.pack_id
          ? specialHabitsService.getPackProgress(habit.pack_id)
          : Promise.resolve({ achievements: [] }),
      ]);

      if (stats) {
        setStatistics({
          currentStreak:  stats.currentStreak  || habit.streak_current || 0,
          weekDays:       stats.weekCompleted  || 0,
          weekTotal:      7,
          monthDays:      stats.monthCompleted || 0,
          monthTotal:     stats.monthTotal     || 30,
          yearDays:       stats.yearCompleted  || 0,
          yearTotal:      365,
          bestStreak:     stats.bestStreak     || stats.streak_best || 0,
          totalCompleted: stats.totalCompleted || stats.total_completed || 0,
          weeklyData:     stats.weeklyData     || stats.weekly_data   || [],
        });
      }
      setAchievements(progress.achievements || []);
    } catch (err) {
      console.error('SpecialHabitDetail load error:', err);
    }
  }, [habit.id, habit.pack_id, habit.streak_current]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadData(true).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [habit.id]);

  // Re-fetch when habit completion changes (swipe in Today)
  useEffect(() => { loadData(true); }, [habit.streak_current, habit.is_completed_today]);

  // Polling every 15 s + visibility refresh
  const loadRef = useRef(loadData);
  loadRef.current = loadData;
  useEffect(() => {
    const interval = setInterval(() => loadRef.current(true), 15_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadRef.current(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [habit.id]);

  // ── Helpers ──────────────────────────────────────────────────────────
  const getCategoryEmoji = () => habit.category_icon || habit.icon || '🎯';

  const getMotivationText = () => {
    const s = statistics.currentStreak;
    if (s >= 30) return t('specialHabitDetail.motivations.m30');
    if (s >= 14) return t('specialHabitDetail.motivations.m14');
    if (s >= 7)  return t('specialHabitDetail.motivations.m7');
    if (s >= 3)  return t('specialHabitDetail.motivations.m3');
    return t('specialHabitDetail.motivations.m0');
  };

  const getProgressColor = (type) => ({
    streak: '#A7D96C',
    week:   '#7DD3C0',
    month:  '#C084FC',
    year:   '#FBBF24',
  })[type];

  // Weekly chart data — index 0=Mon … 6=Sun
  const getWeeklyDisplayData = () => {
    if (statistics.weeklyData?.length === 7) return statistics.weeklyData.map(v => !!v);
    const dow    = new Date().getDay();
    const todayI = dow === 0 ? 6 : dow - 1;
    const data   = new Array(7).fill(false);
    let rem = Math.min(statistics.weekDays, todayI + 1);
    for (let i = todayI; i >= 0 && rem > 0; i--, rem--) data[i] = true;
    return data;
  };

  const getTodayIdx = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };

  const weeklyData  = getWeeklyDisplayData();
  const todayIdx    = getTodayIdx();
  const rawDayLabels = t('habitDetail.weekDays');
  const dayLabels   = Array.isArray(rawDayLabels) ? rawDayLabels : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const todayLabel  = t('habitDetail.stats.today');

  // ── Render ───────────────────────────────────────────────────────────
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

        {/* Header */}
        <div className="hd-header">
          <div className="hd-header__title-section">
            <span className="hd-header__emoji">{getCategoryEmoji()}</span>
            <div className="hd-header__text">
              <h2 className="hd-header__title">{habit.title}</h2>
              {habit.goal && <p className="hd-header__goal">{habit.goal}</p>}
            </div>
          </div>
          {/* No Edit button for pack habits */}
        </div>

        {/* ── 4 animated stat circles ── */}
        <div className="hd-stats-grid">
          <StatCard
            value={statistics.currentStreak}
            total={statistics.bestStreak > statistics.currentStreak
              ? statistics.bestStreak
              : (statistics.currentStreak || 1)}
            showTotal={statistics.bestStreak > statistics.currentStreak}
            color={getProgressColor('streak')}
            title={t('habitDetail.statistics.daysStreak')}
            subtitle="Days Strike"
          />
          <StatCard
            value={statistics.weekDays}
            total={statistics.weekTotal}
            showTotal
            color={getProgressColor('week')}
            title={t('habitDetail.statistics.week')}
            subtitle="Days Strike"
          />
          <StatCard
            value={statistics.monthDays}
            total={statistics.monthTotal}
            showTotal
            color={getProgressColor('month')}
            title={t('habitDetail.statistics.month')}
            subtitle="Days Strike"
          />
          <StatCard
            value={statistics.yearDays}
            total={statistics.yearTotal}
            showTotal
            color={getProgressColor('year')}
            title={t('habitDetail.statistics.year')}
            subtitle="Days Strike"
          />
        </div>

        {/* Motivation banner */}
        <div className="hd-motivation">
          <p className="hd-motivation__text">{getMotivationText()}</p>
        </div>

        {/* Best streak + Total */}
        <div className="hd-extra-stats">
          <div className="hd-extra-stat">
            <span className="hd-extra-stat__icon">🔥</span>
            <span className="hd-extra-stat__value">{statistics.bestStreak}</span>
            <span className="hd-extra-stat__label">{t('habitDetail.stats.bestStreak')}</span>
          </div>
          <div className="hd-extra-stat">
            <span className="hd-extra-stat__icon">🏆</span>
            <span className="hd-extra-stat__value">{statistics.totalCompleted}</span>
            <span className="hd-extra-stat__label">{t('habitDetail.stats.totalCompleted')}</span>
          </div>
        </div>

        {/* Weekly bar chart with scroll-triggered animation */}
        <div className="hd-weekly-card">
          <h3 className="hd-weekly-card__title">{t('habitDetail.stats.thisWeek')}</h3>
          <WeeklyChart
            weeklyData={weeklyData}
            todayIdx={todayIdx}
            dayLabels={dayLabels}
            todayLabel={todayLabel}
          />
        </div>

        {/* ── Achievements block (UNCHANGED) ── */}
        {achievements.length > 0 && (
          <div className="shd-achievements">
            <h3 className="shd-achievements__title">
              {t('specialHabitDetail.achievements')}
            </h3>
            <div className="shd-achievements__list">
              {achievements.map(a => {
                const unlocked = a.is_unlocked;
                const isEmoji  = a.icon && !a.icon.startsWith('http');
                // Translate "Perform the habit N times"
                const desc = t('specialHabitDetail.performHabit')
                  .replace('{{count}}', a.required_count);
                return (
                  <div
                    key={a.id}
                    className={`shd-achievement${unlocked ? ' shd-achievement--unlocked' : ''}`}
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
                      <span className="shd-achievement__desc">{desc}</span>
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
