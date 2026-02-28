// src/pages/SpecialHabitDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useTelegram } from '../hooks/useTelegram';
import { habitService } from '../services/habits';
import { specialHabitsService } from '../services/specialHabits';
import Loader from '../components/common/Loader';
import './SpecialHabitDetail.css';

// ── SVG ring progress ───────────────────────────────────────────────────────
const RingProgress = ({ value, total, color, size = 82, stroke = 8 }) => {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  const dashOffset = circumference * (1 - pct);
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#ebebeb" strokeWidth={stroke} />
      {pct > 0 && (
        <circle
          cx={c} cy={c} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: 'stroke-dashoffset 0.55s ease' }}
        />
      )}
    </svg>
  );
};

// ── Main component ──────────────────────────────────────────────────────────
const SpecialHabitDetail = ({ habit, onClose, onDelete }) => {
  const { tg } = useTelegram();
  useNavigation(onClose);

  const [loading, setLoading]               = useState(true);
  const [statistics, setStatistics]         = useState(null);
  const [achievements, setAchievements]     = useState([]);
  const [removing, setRemoving]             = useState(false);
  const [confirmRemove, setConfirmRemove]   = useState(false);
  const [toast, setToast]                   = useState(null);

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
      setStatistics(stats);
      setAchievements(progress.achievements || []);
    } catch (err) {
      console.error('SpecialHabitDetail load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleRemove = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      setTimeout(() => setConfirmRemove(false), 3000);
      return;
    }
    try {
      setRemoving(true);
      await habitService.deleteHabit(habit.id);
      onDelete?.(habit.id);
      onClose?.();
    } catch (err) {
      console.error('Remove error:', err);
      setRemoving(false);
      showToast('Failed to remove habit', 'error');
    }
  };

  const handleCopyLink = async () => {
    const link = `https://t.me/CheckHabitlyBot?start=habit_${habit.id}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast('Link copied!');
    } catch {
      showToast('Link copied!');
    }
  };

  const handleShare = () => {
    const shareText = `Join me tracking "${habit.title}"! 💪`;
    const shareUrl  = `https://t.me/CheckHabitlyBot?start=habit_${habit.id}`;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(telegramShareUrl);
    } else {
      window.open(telegramShareUrl, '_blank');
    }
  };

  const getEmoji = () => habit.category_icon || habit.icon || '🎯';

  if (loading) {
    return <div className="shd shd--loading"><Loader size="large" /></div>;
  }

  const stats      = statistics || {};
  const streak     = stats.currentStreak  || habit.streak_current || 0;
  const bestStreak = Math.max(habit.streak_best || 0, streak, 1);
  const weekVal    = stats.weekCompleted  || 0;
  const monthVal   = stats.monthCompleted || 0;
  const monthTotal = stats.monthTotal     || 30;
  const yearVal    = stats.yearCompleted  || 0;

  const statCards = [
    { key: 'streak', label: 'Days Strike', value: streak,   total: bestStreak, color: '#A7D96C' },
    { key: 'week',   label: 'Week',        value: weekVal,  total: 7,          color: '#7DD3C0' },
    { key: 'month',  label: 'Month',       value: monthVal, total: monthTotal, color: '#C084FC' },
    { key: 'year',   label: 'Year',        value: yearVal,  total: 365,        color: '#FBBF24' },
  ];

  return (
    <div className="shd">
      <div className="shd__content">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="shd__header">
          <div className="shd__title-row">
            <h2 className="shd__title">
              <span className="shd__emoji">{getEmoji()}</span>
              {habit.title}
            </h2>
            <button className="shd__edit-btn" onClick={() => showToast('Special habits cannot be edited')}>
              Edit
            </button>
          </div>
          {habit.goal && (
            <p className="shd__goal">{habit.goal}</p>
          )}
        </div>

        {/* ── Stats 2×2 ──────────────────────────────────────────────────── */}
        <div className="shd__stats">
          {statCards.map(({ key, label, value, total, color }) => (
            <div key={key} className="shd__stat-card">
              <div className="shd__ring-wrap">
                <RingProgress value={value} total={total} color={color} />
                <div className="shd__ring-center">
                  <span className="shd__ring-val">{value}</span>
                  <span className="shd__ring-tot">{total}</span>
                </div>
              </div>
              <p className="shd__stat-label">{label}</p>
              <p className="shd__stat-sub">Days Strike</p>
            </div>
          ))}
        </div>

        {/* ── Motivation banner ──────────────────────────────────────────── */}
        <div className="shd__motivation">
          Good Job My Friend! 🔥
        </div>

        {/* ── Achievements ───────────────────────────────────────────────── */}
        {achievements.length > 0 && (
          <section className="shd__section">
            <h3 className="shd__section-title">Achievement</h3>
            <div className="shd__achievement-list">
              {achievements.map(a => {
                const unlocked = a.is_unlocked;
                const isEmoji  = a.icon && !a.icon.startsWith('http');
                return (
                  <div
                    key={a.id}
                    className={`shd__achievement ${unlocked ? 'shd__achievement--unlocked' : ''}`}
                  >
                    <div className="shd__ach-icon-wrap">
                      {isEmoji
                        ? <span className="shd__ach-emoji">{a.icon || '🏅'}</span>
                        : a.icon
                          ? <img src={a.icon} alt={a.title} className="shd__ach-img" />
                          : <span className="shd__ach-emoji">🏅</span>
                      }
                    </div>
                    <div className="shd__ach-info">
                      <span className="shd__ach-title">
                        {a.title}{' '}
                        <span className="shd__ach-count">
                          {a.current_count}/{a.required_count}
                        </span>
                      </span>
                      <span className="shd__ach-desc">
                        Perform the habit: {a.required_count} times
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Habit Friends ──────────────────────────────────────────────── */}
        <section className="shd__section">
          <h3 className="shd__section-title">Habit Friends</h3>
          <p className="shd__friends-desc">
            Share the link with friends and invite them to track habits together.
          </p>
          <div className="shd__friends-btns">
            <button className="shd__btn shd__btn--outline" onClick={handleCopyLink}>
              Copy Link
            </button>
            <button className="shd__btn shd__btn--solid" onClick={handleShare}>
              Share
            </button>
          </div>
        </section>

        {/* ── Remove ─────────────────────────────────────────────────────── */}
        <button
          className={`shd__remove-btn ${confirmRemove ? 'shd__remove-btn--confirm' : ''}`}
          onClick={handleRemove}
          disabled={removing}
        >
          {removing ? 'Removing…' : confirmRemove ? 'Tap again to confirm' : 'Remove Habit'}
        </button>
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`shd__toast shd__toast--${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default SpecialHabitDetail;
