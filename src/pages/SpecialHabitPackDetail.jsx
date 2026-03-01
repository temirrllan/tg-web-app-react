// src/pages/SpecialHabitPackDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { specialHabitsService } from '../services/specialHabits';
import { useNavigation } from '../hooks/useNavigation';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import Loader from '../components/common/Loader';
import './SpecialHabitPackDetail.css';

const DAY_PERIOD_ORDER  = ['morning', 'afternoon', 'evening', 'night'];
const DAY_PERIOD_LABELS = {
  morning:   'Morning',
  afternoon: 'Afternoon',
  evening:   'Evening',
  night:     'Night',
};

// Fallback bg palette (same as shop)
const FALLBACK_COLORS = [
  '#c8e6c9', '#ffccbc', '#b2ebf2', '#d1c4e9',
  '#fff9c4', '#f8bbd0', '#dcedc8', '#ffe0b2',
];
const getPackBgColor = (pack) =>
  pack?.bg_color || FALLBACK_COLORS[(pack?.id - 1) % FALLBACK_COLORS.length] || '#e8eaf6';

// Per-achievement tint palette
const ACH_COLORS = [
  { bg: '#ede7f6', icon: '#9c27b0' },
  { bg: '#e0f2f1', icon: '#00897b' },
  { bg: '#e3f2fd', icon: '#1565c0' },
  { bg: '#fce4ec', icon: '#c62828' },
  { bg: '#fff3e0', icon: '#e65100' },
  { bg: '#f1f8e9', icon: '#558b2f' },
];
const getAchColor = (idx) => ACH_COLORS[idx % ACH_COLORS.length];

const SpecialHabitPackDetail = ({ pack: initialPack, onClose, onGoToSpecialTab }) => {
  useTelegramTheme();
  useNavigation(onClose);

  const [pack, setPack]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError]           = useState(null);

  const loadPack = useCallback(async () => {
    try {
      setLoading(true);
      const data = await specialHabitsService.getPackDetails(initialPack.id);
      setPack(data.pack);
    } catch (err) {
      console.error('Failed to load pack:', err);
      setError('Failed to load pack details');
    } finally {
      setLoading(false);
    }
  }, [initialPack.id]);

  useEffect(() => { loadPack(); }, [loadPack]);

  const handlePurchase = async () => {
    if (!pack || purchasing) return;
    setPurchasing(true);
    setError(null);
    try {
      const result = await specialHabitsService.purchasePack(pack.id);
      if (result.already_purchased || result.free) {
        await loadPack();
        return;
      }
      if (result.invoice_link) {
        const tg = window.Telegram?.WebApp;
        if (tg?.openInvoice) {
          tg.openInvoice(result.invoice_link, async (status) => {
            if (status === 'paid') await loadPack();
            setPurchasing(false);
          });
        } else {
          window.open(result.invoice_link, '_blank');
          setPurchasing(false);
        }
        return;
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError('Purchase failed. Please try again.');
    } finally {
      if (!pack || pack.price_stars === 0) setPurchasing(false);
    }
  };

  /* ─── Loading / error states ─────────────────────────────────────────── */
  if (loading) {
    return <div className="pd pd--loading"><Loader size="large" /></div>;
  }
  if (error && !pack) {
    return <div className="pd"><p className="pd__error">{error}</p></div>;
  }

  const isPurchased  = pack?.is_purchased;
  const bgColor      = getPackBgColor(pack);
  const isFree       = pack.price_stars === 0;
  const priceDisplay = isFree ? 'FREE' : `$ ${pack.price_stars}`;

  // Group templates by day_period
  const groupedHabits = {};
  (pack?.habits || []).forEach(h => {
    const p = h.day_period || 'morning';
    if (!groupedHabits[p]) groupedHabits[p] = [];
    groupedHabits[p].push(h);
  });

  const habitsTotal = pack.habits_total || (pack.habits || []).length;
  const achTotal    = pack.achievements_total || (pack.achievements || []).length;

  return (
    <div className="pd">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="pd__hero" style={{ background: bgColor }}>
        <div className="pd__avatar-wrap">
          {pack.photo_url
            ? <img src={pack.photo_url} alt={pack.name} className="pd__avatar" />
            : <div className="pd__avatar-ph">✨</div>
          }
        </div>
        <h1 className="pd__name">{pack.name}</h1>
        <p className="pd__profession">{pack.short_description}</p>
      </div>

      <div className="pd__body">

        {/* ── Stats row ─────────────────────────────────────────────── */}
        <div className="pd__stats">
          <div className="pd__stat">
            <span className="pd__stat-label">Habits</span>
            <span className="pd__stat-val">
              {isPurchased ? (pack.habits_owned || 0) : 0} / {habitsTotal}
            </span>
          </div>
          <div className="pd__stat">
            <span className="pd__stat-label">Achievement</span>
            <span className="pd__stat-val">
              {isPurchased ? (pack.achievements_unlocked || 0) : 0} / {achTotal}
            </span>
          </div>
          <div className="pd__stat">
            <span className="pd__stat-label">Price</span>
            <span className="pd__stat-val">{priceDisplay}</span>
          </div>
        </div>

        {/* ── CTA button ────────────────────────────────────────────── */}
        {isPurchased ? (
          <button className="pd__cta pd__cta--owned" onClick={onGoToSpecialTab}>
            I Have This Habits
          </button>
        ) : (
          <button
            className="pd__cta pd__cta--buy"
            onClick={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? 'Processing…' : isFree ? 'Unlock for Free' : 'Unlock the Habit'}
          </button>
        )}

        {error && <p className="pd__error">{error}</p>}

        {/* ── Biography ─────────────────────────────────────────────── */}
        {pack.biography && (
          <div className="pd__bio">
            <p className="pd__bio-text">{pack.biography}</p>
            {pack.learn_more_url && (
              <a
                className="pd__learn-more"
                href={pack.learn_more_url}
                onClick={(e) => {
                  e.preventDefault();
                  window.Telegram?.WebApp?.openLink?.(pack.learn_more_url);
                }}
              >
                Learn More
              </a>
            )}
          </div>
        )}

        {/* ── Habits ────────────────────────────────────────────────── */}
        {(pack.habits || []).length > 0 && (
          <div className="pd__section">
            <h3 className="pd__section-title">Habits</h3>
            {DAY_PERIOD_ORDER.map(period => {
              const habits = groupedHabits[period];
              if (!habits?.length) return null;
              return (
                <div key={period} className="pd__period">
                  <p className="pd__period-label">{DAY_PERIOD_LABELS[period]}</p>
                  <div className="pd__habit-list">
                    {habits.map(habit => (
                      <div
                        key={habit.id}
                        className={`pd__habit ${!isPurchased ? 'pd__habit--blur' : ''}`}
                      >
                        <div
                          className="pd__habit-icon"
                          style={{
                            background: habit.category_color
                              ? `${habit.category_color}40`
                              : '#e8eaf6',
                          }}
                        >
                          <span>{habit.category_icon || '🎯'}</span>
                        </div>
                        <div className="pd__habit-info">
                          <span className="pd__habit-name">{habit.title}</span>
                          {habit.goal && (
                            <span className="pd__habit-goal">Goal: {habit.goal}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Achievements ──────────────────────────────────────────── */}
        {(pack.achievements || []).length > 0 && (
          <div className="pd__section pd__section--last">
            <h3 className="pd__section-title">Achievement</h3>
            <div className="pd__ach-list">
              {pack.achievements.map((a, idx) => {
                const { bg, icon: iconBg } = getAchColor(idx);
                const isEmoji = a.icon && !a.icon.startsWith('http');
                const count   = isPurchased
                  ? ` ${a.current_count ?? 0}/${a.required_count}`
                  : null;
                return (
                  <div key={a.id} className="pd__ach" style={{ background: bg }}>
                    <div className="pd__ach-icon" style={{ background: iconBg }}>
                      {isEmoji
                        ? <span>{a.icon || '🏅'}</span>
                        : a.icon
                          ? <img src={a.icon} alt={a.title} className="pd__ach-img" />
                          : <span>🏅</span>
                      }
                    </div>
                    <div className="pd__ach-info">
                      <span className="pd__ach-title">
                        {a.title}
                        {count && <span className="pd__ach-count">{count}</span>}
                      </span>
                      <span className="pd__ach-desc">
                        Perform the habit: {a.required_count} times
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Attribution ───────────────────────────────────────────── */}
        <p className="pd__attribution">
          text about where the information about the scientist was taken from
        </p>

      </div>
    </div>
  );
};

export default SpecialHabitPackDetail;
