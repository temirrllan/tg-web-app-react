// src/pages/SpecialHabitPackDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { specialHabitsService } from '../services/specialHabits';
import { useNavigation } from '../hooks/useNavigation';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import Loader from '../components/common/Loader';
import './SpecialHabitPackDetail.css';

const DAY_PERIOD_ORDER = ['morning', 'afternoon', 'evening', 'night'];
const DAY_PERIOD_LABELS = {
  morning:   { icon: '🌅', label: 'Morning' },
  afternoon: { icon: '☀️', label: 'Afternoon' },
  evening:   { icon: '🌆', label: 'Evening' },
  night:     { icon: '🌙', label: 'Night' },
};

const SpecialHabitPackDetail = ({ pack: initialPack, onClose, onGoToSpecialTab }) => {
  useTelegramTheme();

  const [pack, setPack]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError]           = useState(null);

  // Don't show back navigation when a child is open
  useNavigation(onClose);

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

      if (result.already_purchased) {
        await loadPack();
        return;
      }

      if (result.free) {
        // Free pack – habits created immediately
        await loadPack();
        return;
      }

      if (result.invoice_link) {
        // Open Telegram invoice
        const tg = window.Telegram?.WebApp;
        if (tg?.openInvoice) {
          tg.openInvoice(result.invoice_link, async (status) => {
            if (status === 'paid') {
              // Webhook will have created habits; reload to show purchased state
              await loadPack();
            }
            setPurchasing(false);
          });
        } else {
          // Fallback: open as link
          window.open(result.invoice_link, '_blank');
          setPurchasing(false);
        }
        return;
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError('Purchase failed. Please try again.');
    } finally {
      // For non-invoice flows, reset immediately
      if (!pack || pack.price_stars === 0) setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="pack-detail pack-detail--loading">
        <Loader size="large" />
      </div>
    );
  }

  if (error && !pack) {
    return (
      <div className="pack-detail">
        <button className="pack-detail__back" onClick={onClose}>‹</button>
        <p className="pack-detail__error">{error}</p>
      </div>
    );
  }

  const isPurchased = pack?.is_purchased;

  // Group habits by day_period
  const groupedHabits = {};
  (pack?.habits || []).forEach(h => {
    const p = h.day_period || 'morning';
    if (!groupedHabits[p]) groupedHabits[p] = [];
    groupedHabits[p].push(h);
  });

  return (
    <div className="pack-detail">


      <div className="pack-detail__content">
        {/* Hero / Avatar */}
        <div className="pack-detail__hero">
          <div className="pack-detail__avatar-wrap">
            {pack.photo_url ? (
              <img src={pack.photo_url} alt={pack.name} className="pack-detail__avatar" />
            ) : (
              <div className="pack-detail__avatar-placeholder">✨</div>
            )}
          </div>
          <h1 className="pack-detail__name">{pack.name}</h1>
          <p className="pack-detail__profession">{pack.short_description}</p>
        </div>

        {/* Stats */}
        <div className="pack-detail__stats">
          <div className="pack-detail__stat">
            <span className="pack-detail__stat-icon">📋</span>
            <span className="pack-detail__stat-label">Habits</span>
            <span className="pack-detail__stat-value">
              {isPurchased ? pack.habits_owned : 0}/{pack.habits_total}
            </span>
          </div>
          <div className="pack-detail__stat">
            <span className="pack-detail__stat-icon">🏆</span>
            <span className="pack-detail__stat-label">Achievement</span>
            <span className="pack-detail__stat-value">
              {isPurchased ? pack.achievements_unlocked : 0}/{pack.achievements_total}
            </span>
          </div>
          <div className="pack-detail__stat">
            <span className="pack-detail__stat-icon">⭐</span>
            <span className="pack-detail__stat-label">Price</span>
            <span className="pack-detail__stat-value">
              {pack.price_stars === 0 ? 'FREE' : `${pack.price_stars}`}
            </span>
          </div>
        </div>

        {/* CTA button */}
        {isPurchased ? (
          <button
            className="pack-detail__cta pack-detail__cta--owned"
            onClick={onGoToSpecialTab}
          >
            I Have This Habits
          </button>
        ) : (
          <button
            className="pack-detail__cta pack-detail__cta--buy"
            onClick={handlePurchase}
            disabled={purchasing}
          >
            {purchasing
              ? 'Processing...'
              : pack.price_stars === 0
              ? '🎁 Unlock for Free'
              : `🔓 Unlock the Habit · ⭐ ${pack.price_stars}`}
          </button>
        )}

        {error && <p className="pack-detail__error">{error}</p>}

        {/* Biography */}
        {pack.biography && (
          <div className="pack-detail__bio">
            <h3 className="pack-detail__section-title">About</h3>
            <p className="pack-detail__bio-text">{pack.biography}</p>
            {pack.learn_more_url && (
              <a
                className="pack-detail__learn-more"
                href={pack.learn_more_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  window.Telegram?.WebApp?.openLink?.(pack.learn_more_url);
                }}
              >
                Learn More →
              </a>
            )}
          </div>
        )}

        {/* Habits list */}
        <div className="pack-detail__habits-section">
          <h3 className="pack-detail__section-title">Habits in This Pack</h3>

          {DAY_PERIOD_ORDER.map(period => {
            const habits = groupedHabits[period];
            if (!habits || habits.length === 0) return null;
            const { icon, label } = DAY_PERIOD_LABELS[period];

            return (
              <div key={period} className="pack-detail__period">
                <div className="pack-detail__period-header">
                  <span>{icon}</span>
                  <span className="pack-detail__period-label">{label}</span>
                </div>

                <div className="pack-detail__habit-list">
                  {habits.map(habit => (
                    <div
                      key={habit.id}
                      className={`pack-detail__habit-item ${!isPurchased ? 'pack-detail__habit-item--blurred' : ''}`}
                    >
                      <span className="pack-detail__habit-icon">
                        {habit.category_icon || '🎯'}
                      </span>
                      <div className="pack-detail__habit-info">
                        <span className="pack-detail__habit-title">{habit.title}</span>
                        {habit.goal && (
                          <span className="pack-detail__habit-goal">{habit.goal}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Achievements */}
        {(pack.achievements || []).length > 0 && (
          <div className="pack-detail__achievements-section">
            <h3 className="pack-detail__section-title">Achievements</h3>
            <div className="pack-detail__achievement-list">
              {pack.achievements.map(a => {
                const isEmoji = a.icon && !a.icon.startsWith('http');
                const unlocked = isPurchased && a.is_unlocked;
                return (
                  <div
                    key={a.id}
                    className={`pack-detail__achievement ${unlocked ? 'pack-detail__achievement--unlocked' : 'pack-detail__achievement--locked'}`}
                  >
                    <div className="pack-detail__achievement-icon">
                      {isEmoji ? (
                        <span>{a.icon || '🏅'}</span>
                      ) : a.icon ? (
                        <img src={a.icon} alt={a.title} />
                      ) : (
                        <span>🏅</span>
                      )}
                    </div>
                    <div className="pack-detail__achievement-info">
                      <span className="pack-detail__achievement-title">{a.title}</span>
                      <span className="pack-detail__achievement-desc">{a.description}</span>
                    </div>
                    <span className="pack-detail__achievement-progress">
                      {isPurchased ? `${a.current_count}/${a.required_count}` : `0/${a.required_count}`}
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

export default SpecialHabitPackDetail;
