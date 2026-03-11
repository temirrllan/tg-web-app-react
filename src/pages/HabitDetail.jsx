import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import Loader from '../components/common/Loader';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import CopyLinkModal from '../components/modals/CopyLinkModal';
import Toast from '../components/common/Toast';
import SubscriptionModal from '../components/modals/SubscriptionModal';
import './HabitDetail.css';
import FriendSwipeHint from '../components/habits/FriendSwipeHint';
import { useTranslation } from '../hooks/useTranslation';
import { useTelegramTheme } from '../hooks/useTelegramTheme';

// ─── Particle canvas (canvas2D, Three.js-style) ───────────────────────────────
const ParticleCanvas = ({ trigger, colors }) => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    // cancel any previous animation
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const palette = colors || ['#A7D96C', '#7DD3C0', '#C084FC', '#FBBF24', '#60A5FA'];
    const count   = 60;
    const cx      = W / 2;
    const cy      = H / 2;

    const particles = Array.from({ length: count }, () => {
      const angle  = Math.random() * Math.PI * 2;
      const speed  = Math.random() * 3.5 + 1.2;
      const size   = Math.random() * 5 + 2;
      const color  = palette[Math.floor(Math.random() * palette.length)];
      return {
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size,
        color,
        alpha: 1,
        decay: Math.random() * 0.018 + 0.010,
        shape: Math.random() > 0.5 ? 'circle' : 'star',
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;

      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive = true;
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.06; // gravity
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);

        if (p.shape === 'star') {
          ctx.translate(p.x, p.y);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const b = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
            if (i === 0) ctx.moveTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
            else         ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
            ctx.lineTo(Math.cos(b) * p.size * 0.4, Math.sin(b) * p.size * 0.4);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          // glow
          ctx.shadowBlur  = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
        }
        ctx.restore();
      }

      if (alive) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [trigger]);  // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

// ─── Animated circular-progress ring (SVG) ───────────────────────────────────
const CircularRing = ({ value, total, color, label, sublabel, animTrigger }) => {
  const radius = 38;
  const circ   = 2 * Math.PI * radius;
  const pct    = total > 0 ? Math.min(value / total, 1) : 0;

  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    setAnimated(0);
    let start = null;
    const duration = 900;

    const step = (ts) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setAnimated(ease);
      if (t < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [animTrigger, pct]);  // eslint-disable-line

  const offset = circ - animated * pct * circ;

  return (
    <div className="hd-ring-card">
      <div className="hd-ring-wrap">
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="44" cy="44" r={radius} fill="none" stroke="var(--bg-tertiary,#F2F2F7)" strokeWidth="7" />
          <circle
            cx="44" cy="44" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
          />
        </svg>
        <div className="hd-ring-inner">
          <span className="hd-ring-val">{value}</span>
          {total !== null && total !== undefined && <span className="hd-ring-total">/{total}</span>}
        </div>
      </div>
      <span className="hd-ring-label">{label}</span>
      {sublabel && <span className="hd-ring-sub">{sublabel}</span>}
    </div>
  );
};

// ─── Weekly bar chart ─────────────────────────────────────────────────────────
const WeeklyChart = ({ weeklyData, animTrigger }) => {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const [heights, setHeights] = useState(Array(7).fill(0));

  // build a date→status map
  const statusMap = {};
  (weeklyData || []).forEach(d => { statusMap[d.date] = d.status; });

  // generate last 7 calendar dates
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d.toISOString().slice(0, 10);
  });

  const today = new Date().toISOString().slice(0, 10);

  // target heights: 100% completed, 60% failed/skipped, 20% future, 30% no data
  const targets = dates.map(date => {
    if (date > today) return 15;
    const s = statusMap[date];
    if (s === 'completed') return 100;
    if (s === 'failed')    return 50;
    if (s === 'skipped')   return 35;
    return 20; // not marked
  });

  useEffect(() => {
    setHeights(Array(7).fill(0));
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / 700, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setHeights(targets.map(h => Math.round(h * ease)));
      if (t < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [animTrigger]);  // eslint-disable-line

  const getColor = (date) => {
    if (date > today) return 'var(--bg-tertiary,#F2F2F7)';
    const s = statusMap[date];
    if (s === 'completed') return '#A7D96C';
    if (s === 'failed')    return '#FF6B6B';
    if (s === 'skipped')   return '#FBBF24';
    return 'var(--bg-tertiary,#E5E7EB)';
  };

  return (
    <div className="hd-chart">
      <div className="hd-chart-bars">
        {dates.map((date, i) => (
          <div key={date} className="hd-chart-col">
            <div
              className="hd-chart-bar"
              style={{
                height: `${heights[i]}%`,
                background: getColor(date),
                boxShadow: statusMap[date] === 'completed' ? '0 0 6px #A7D96C88' : 'none',
              }}
            />
            <span className="hd-chart-day" style={{ fontWeight: date === today ? 700 : 400 }}>
              {days[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Quick stat pill ──────────────────────────────────────────────────────────
const StatPill = ({ icon, label, value }) => (
  <div className="hd-pill">
    <span className="hd-pill-icon">{icon}</span>
    <div className="hd-pill-text">
      <span className="hd-pill-label">{label}</span>
      <span className="hd-pill-val">{value}</span>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const HabitDetail = ({ habit, onClose, onEdit, onDelete, shouldShowFriendHint = false }) => {
  const { tg, user: currentUser } = useTelegram();
  const { t } = useTranslation();

  const [loading, setLoading]                 = useState(true);
  const [ownerInfoLoading, setOwnerInfoLoading] = useState(true);
  const [activeTab, setActiveTab]             = useState('stats'); // 'stats' | 'friends'
  const [animTrigger, setAnimTrigger]         = useState(0);

  const [showDeleteModal, setShowDeleteModal]         = useState(false);
  const [showCopyModal, setShowCopyModal]             = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [members, setMembers]                         = useState([]);
  const [showFriendHint, setShowFriendHint]           = useState(false);
  const friendHintClosedRef                           = useRef(false);
  const [toast, setToast]                             = useState(null);
  const [friendLimitData, setFriendLimitData]         = useState(null);
  const [ownerInfo, setOwnerInfo]                     = useState(null);
  const [isCreator, setIsCreator]                     = useState(false);

  useTelegramTheme();
  useNavigation(onClose);

  const [statistics, setStatistics] = useState({
    currentStreak: 0,
    bestStreak: 0,
    weekDays: 0,
    weekTotal: 7,
    monthDays: 0,
    monthTotal: 30,
    yearDays: 0,
    yearTotal: 365,
    totalCompleted: 0,
    weeklyData: [],
  });

  // ── Switch tab and fire particle burst ──────────────────────────────────────
  const switchTab = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setAnimTrigger(n => n + 1);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  // ── Creator detection ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) { setIsCreator(false); return; }
    const userDbId = localStorage.getItem('user_id');
    if (!userDbId) { setIsCreator(false); return; }

    let ok = false;
    if (ownerInfo?.creator_id && String(userDbId) === String(ownerInfo.creator_id)) ok = true;
    if (!ok && habit.creator_id != null && String(userDbId) === String(habit.creator_id)) ok = true;
    if (!ok && !habit.parent_habit_id && habit.user_id != null && String(userDbId) === String(habit.user_id)) ok = true;
    setIsCreator(ok);
  }, [currentUser, ownerInfo, habit.id, habit.creator_id, habit.user_id, habit.parent_habit_id]);

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        setOwnerInfoLoading(true);
        const info = await habitService.getHabitOwner(habit.id);
        setOwnerInfo(info);
      } catch (e) { console.error('owner info:', e); }
      finally    { setOwnerInfoLoading(false); }
    };
    init();
    loadStatistics();
    loadMembers();
    checkFriendLimit();
    // fire first animation
    setAnimTrigger(1);
  }, [habit.id]);  // eslint-disable-line

  // ── Statistics ───────────────────────────────────────────────────────────────
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await habitService.getHabitStatistics(habit.id);
      if (stats) {
        setStatistics({
          currentStreak:  stats.currentStreak  || habit.streak_current || 0,
          bestStreak:     stats.bestStreak     || habit.streak_best    || 0,
          weekDays:       stats.weekCompleted  || 0,
          weekTotal:      7,
          monthDays:      stats.monthCompleted || 0,
          monthTotal:     stats.monthTotal     || 30,
          yearDays:       stats.yearCompleted  || 0,
          yearTotal:      365,
          totalCompleted: stats.totalCompleted || 0,
          weeklyData:     stats.weeklyData     || [],
        });
      }
    } catch (e) { console.error('stats:', e); }
    finally     { setLoading(false); }
  };

  // ── Members ──────────────────────────────────────────────────────────────────
  const applyMembersData = useCallback((loaded) => {
    setMembers(loaded);
    const shown = localStorage.getItem('hint_friend_shown') === '1';
    if (shouldShowFriendHint && !shown && !friendHintClosedRef.current && loaded.length > 0) {
      setTimeout(() => setShowFriendHint(true), 900);
    }
  }, [shouldShowFriendHint]);

  const loadMembers = async () => {
    try {
      const data = await habitService.getHabitMembers(habit.id, false);
      applyMembersData(data.members || []);
    } catch (e) { console.error('members:', e); }
  };

  const pollMembers = async () => {
    try {
      const data = await habitService.getHabitMembers(habit.id, true);
      applyMembersData(data.members || []);
    } catch (e) { console.error('poll members:', e); }
  };

  const pollMembersRef = useRef(pollMembers);
  pollMembersRef.current = pollMembers;

  useEffect(() => {
    const iv = setInterval(() => pollMembersRef.current?.(), 3000);
    const onVis = () => { if (document.visibilityState === 'visible') pollMembersRef.current?.(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [habit.id]);

  const checkFriendLimit = async () => {
    try {
      const d = await habitService.checkFriendLimit(habit.id);
      setFriendLimitData(d);
    } catch (e) { console.error('friend limit:', e); }
  };

  // ── Share / Invite ───────────────────────────────────────────────────────────
  const handleAddFriend = async () => {
    const limitCheck = await habitService.checkFriendLimit(habit.id);
    setFriendLimitData(limitCheck);
    if (limitCheck.showPremiumModal && !limitCheck.isPremium) {
      setShowSubscriptionModal(true);
      return;
    }
    await handleShare();
  };

  const handleShare = async () => {
    try {
      const { shareCode } = await habitService.createShareLink(habit.id);
      const shareText = `Join my "${habit.title}" habit!\n\n📝 Goal: ${habit.goal}\n\nLet's build better habits together! 💪`;
      const shareUrl  = `https://t.me/CheckHabitlyBot?start=${shareCode}`;
      const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      if (tg?.openTelegramLink) tg.openTelegramLink(telegramShareUrl);
      else window.open(telegramShareUrl, '_blank');
      setToast({ message: t('habitDetail.toasts.shareLinkCreated'), type: 'success' });
    } catch {
      setToast({ message: t('habitDetail.toasts.shareLinkFailed'), type: 'error' });
    }
  };

  const handleSubscriptionContinue = async (plan) => {
    try {
      const result = await habitService.activatePremium(plan);
      if (result.success) {
        await checkFriendLimit();
        await loadMembers();
        setShowSubscriptionModal(false);
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert(t('habitDetail.toasts.premiumActivated'));
        }
        setTimeout(handleShare, 500);
      }
    } catch {
      setShowSubscriptionModal(false);
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(t('habitDetail.toasts.premiumFailed'));
      }
    }
  };

  // ── Punch / Remove friend ────────────────────────────────────────────────────
  const handlePunchFriend = async (memberId) => {
    try {
      const result = await habitService.punchFriend(habit.id, memberId);
      if (result.showToast) {
        setToast({ message: result.toastMessage, type: result.toastType || 'info' });
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred(result.alreadyCompleted ? 'warning' : 'medium');
        }
      } else if (tg?.showAlert) {
        if (result.alreadyCompleted) tg.showAlert(t('habitDetail.alerts.alreadyCompleted', { name: result.friendName }));
        else if (result.isSkipped)   tg.showAlert(t('habitDetail.alerts.skipped',          { name: result.friendName }));
        else if (result.success)     tg.showAlert(t('habitDetail.alerts.reminderSent'));
      }
    } catch {
      setToast({ message: t('habitDetail.toasts.punchFailed'), type: 'error' });
    }
  };

  const handleRemoveFriend = async (memberId) => {
    const doRemove = async () => {
      await habitService.removeMember(habit.id, memberId);
      await loadMembers();
      await checkFriendLimit();
      setToast({ message: t('habitDetail.toasts.friendRemoved'), type: 'success' });
    };
    try {
      if (tg?.showConfirm) {
        tg.showConfirm(t('habitDetail.alerts.removeFriendConfirm'), async (ok) => { if (ok) await doRemove(); });
      } else if (window.confirm(t('habitDetail.alerts.removeFriendConfirm'))) {
        await doRemove();
      }
    } catch {
      setToast({ message: t('habitDetail.toasts.friendRemoveFailed'), type: 'error' });
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getCategoryEmoji = () => habit.category_icon || habit.icon || '🎯';

  const getMotivation = () => {
    const streak = statistics.currentStreak;
    if (streak >= 30) return t('habitDetail.motivations.m30');
    if (streak >= 14) return t('habitDetail.motivations.m14');
    if (streak >= 7)  return t('habitDetail.motivations.m7');
    if (streak >= 3)  return t('habitDetail.motivations.m3');
    return t('habitDetail.motivations.m0');
  };

  const statsColors = { streak: '#A7D96C', week: '#7DD3C0', month: '#C084FC', year: '#FBBF24' };

  if (loading) {
    return (
      <div className="habit-detail habit-detail--loading">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <>
      <div className="habit-detail">

        {/* ── Habit header ─────────────────────────────────────────────────── */}
        <div className="hd-header">
          <div className="hd-header-left">
            <span className="hd-emoji">{getCategoryEmoji()}</span>
            <div className="hd-header-text">
              <h2 className="hd-title">{habit.title}</h2>
              {habit.goal && <p className="hd-goal">{habit.goal}</p>}
            </div>
          </div>
          {!ownerInfoLoading && isCreator && (
            <button className="hd-edit-btn" onClick={() => onEdit?.(habit)}>
              {t('habitDetail.edit')}
            </button>
          )}
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div className="hd-tabs">
          <button
            className={`hd-tab ${activeTab === 'stats' ? 'hd-tab--active' : ''}`}
            onClick={() => switchTab('stats')}
          >
            📊 {t('habitDetail.tabs.myStats')}
          </button>
          <button
            className={`hd-tab ${activeTab === 'friends' ? 'hd-tab--active' : ''}`}
            onClick={() => switchTab('friends')}
          >
            👥 {t('habitDetail.tabs.friends')}
            {members.length > 0 && <span className="hd-tab-badge">{members.length}</span>}
          </button>
          <div className={`hd-tab-indicator ${activeTab === 'friends' ? 'hd-tab-indicator--right' : ''}`} />
        </div>

        {/* ── Tab content ──────────────────────────────────────────────────── */}
        <div className="hd-content">

          {/* ────────── Statistics tab ────────── */}
          {activeTab === 'stats' && (
            <div className="hd-section hd-section--animated">
              <div className="hd-particle-wrap">
                <ParticleCanvas
                  trigger={animTrigger}
                  colors={['#A7D96C', '#7DD3C0', '#FBBF24', '#60A5FA', '#C084FC']}
                />
              </div>

              {/* 4 rings grid */}
              <div className="hd-rings">
                <CircularRing
                  value={statistics.currentStreak}
                  total={null}
                  color={statsColors.streak}
                  label={t('habitDetail.statistics.daysStreak')}
                  sublabel="🔥"
                  animTrigger={animTrigger}
                />
                <CircularRing
                  value={statistics.weekDays}
                  total={statistics.weekTotal}
                  color={statsColors.week}
                  label={t('habitDetail.statistics.week')}
                  animTrigger={animTrigger}
                />
                <CircularRing
                  value={statistics.monthDays}
                  total={statistics.monthTotal}
                  color={statsColors.month}
                  label={t('habitDetail.statistics.month')}
                  animTrigger={animTrigger}
                />
                <CircularRing
                  value={statistics.yearDays}
                  total={statistics.yearTotal}
                  color={statsColors.year}
                  label={t('habitDetail.statistics.year')}
                  animTrigger={animTrigger}
                />
              </div>

              {/* Motivation banner */}
              <div className="hd-motive">
                <p className="hd-motive-text">{getMotivation()}</p>
              </div>

              {/* Quick stats pills */}
              <div className="hd-pills">
                <StatPill icon="🏆" label={t('habitDetail.stats.bestStreak')} value={`${statistics.bestStreak} ${t('habitDetail.stats.daysUnit')}`} />
                <StatPill icon="✅" label={t('habitDetail.stats.totalCompleted')} value={`${statistics.totalCompleted} ${t('habitDetail.stats.timesUnit')}`} />
              </div>

              {/* Weekly chart */}
              <div className="hd-chart-block">
                <h3 className="hd-section-title">{t('habitDetail.stats.chartTitle')}</h3>
                <WeeklyChart weeklyData={statistics.weeklyData} animTrigger={animTrigger} />
              </div>

              {/* Delete button (creator only) */}
              {isCreator && (
                <button
                  className="hd-danger-btn"
                  onClick={() => setShowDeleteModal(true)}
                >
                  {t('habitDetail.buttons.removeHabit')}
                </button>
              )}
            </div>
          )}

          {/* ────────── Friends tab ────────── */}
          {activeTab === 'friends' && (
            <div className="hd-section hd-section--animated">
              <div className="hd-particle-wrap">
                <ParticleCanvas
                  trigger={animTrigger}
                  colors={['#60A5FA', '#818CF8', '#A78BFA', '#7DD3C0', '#34D399']}
                />
              </div>

              {/* Friends count header */}
              <div className="hd-friends-header">
                <h3 className="hd-section-title">{t('habitDetail.friends.title')}</h3>
                {friendLimitData && !friendLimitData.isPremium && (
                  <span className="hd-friends-limit">
                    {friendLimitData.currentFriendsCount}/{friendLimitData.limit} ({t('habitDetail.friends.freePlan')})
                  </span>
                )}
              </div>

              {/* Friend list */}
              {members.length > 0 ? (
                <div className="hd-members">
                  {members.map(member => (
                    <FriendCard
                      key={member.id}
                      member={member}
                      onPunch={() => handlePunchFriend(member.id)}
                      onRemove={() => handleRemoveFriend(member.id)}
                      removeText={t('habitDetail.friends.remove')}
                      punchText={t('habitDetail.friends.punch')}
                    />
                  ))}
                </div>
              ) : (
                <div className="hd-no-friends">
                  <div className="hd-no-friends-icon">👥</div>
                  <p className="hd-no-friends-text">{t('habitDetail.friends.subtitle')}</p>
                </div>
              )}

              {/* Add friend button */}
              <button className="hd-invite-btn" onClick={handleAddFriend}>
                🤝 {t('habitDetail.friends.addFriend')}
              </button>

              {/* Delete button (creator only) */}
              {isCreator && (
                <button
                  className="hd-danger-btn"
                  style={{ marginTop: 12 }}
                  onClick={() => setShowDeleteModal(true)}
                >
                  {t('habitDetail.buttons.removeHabit')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals & overlays ────────────────────────────────────────────────── */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => onDelete(habit.id)}
        habitTitle={habit.title}
      />

      <CopyLinkModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
      />

      <FriendSwipeHint
        show={showFriendHint}
        onClose={() => {
          friendHintClosedRef.current = true;
          localStorage.setItem('hint_friend_shown', '1');
          setShowFriendHint(false);
        }}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onContinue={handleSubscriptionContinue}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

// ─── Friend Card (swipeable) ──────────────────────────────────────────────────
const FriendCard = ({ member, onPunch, onRemove, removeText, punchText }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [startX, setStartX]           = useState(0);
  const [isSwiping, setIsSwiping]     = useState(false);

  const SWIPE_THRESHOLD = 60;
  const MAX_SWIPE       = 100;
  const canPunch        = member.today_status !== 'completed';

  const handleTouchStart = (e) => { setStartX(e.touches[0].clientX); setIsSwiping(true); };
  const handleTouchMove  = (e) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - startX;
    if (diff < 0 && !canPunch) return;
    setSwipeOffset(Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff)));
  };
  const handleTouchEnd   = () => { commitSwipe(); };

  const handleMouseDown  = (e) => { e.preventDefault(); setStartX(e.clientX); setIsSwiping(true); };
  const handleMouseMove  = (e) => {
    if (!isSwiping) return;
    const diff = e.clientX - startX;
    if (diff < 0 && !canPunch) return;
    setSwipeOffset(Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff)));
  };
  const handleMouseUp    = () => { commitSwipe(); };
  const handleMouseLeave = () => { if (isSwiping) { setSwipeOffset(0); setIsSwiping(false); } };

  const commitSwipe = () => {
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
      if (swipeOffset < 0 && canPunch) onPunch();
      else if (swipeOffset > 0)        onRemove();
    }
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  const statusInfo = () => {
    switch (member.today_status) {
      case 'completed': return { text: 'Done Today ✅', cls: 'friend-card__status--done' };
      case 'failed':    return { text: 'Failed Today',  cls: 'friend-card__status--failed' };
      case 'skipped':   return { text: 'Skipped',       cls: 'friend-card__status--skipped' };
      default:          return { text: 'Undone Yet',    cls: 'friend-card__status--undone' };
    }
  };
  const { text, cls } = statusInfo();

  return (
    <div className="friend-card-container">
      {swipeOffset > 20 && (
        <div className="friend-action friend-action--remove"><span>{removeText}</span></div>
      )}
      <div
        className="friend-card"
        style={{ transform: `translateX(${swipeOffset}px)`, transition: isSwiping ? 'none' : 'transform 0.3s ease-out' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={member.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.first_name || '?')}`}
          alt={member.first_name}
          className="friend-card__avatar"
        />
        <div className="friend-card__info">
          <span className="friend-card__name">{member.first_name} {member.last_name}</span>
          <span className={`friend-card__status ${cls}`}>{text}</span>
        </div>
        {member.streak_current > 0 && (
          <span className="friend-card__streak">🔥 {member.streak_current}</span>
        )}
      </div>
      {swipeOffset < -20 && canPunch && (
        <div className="friend-action friend-action--punch"><span>{punchText}</span></div>
      )}
    </div>
  );
};

export default HabitDetail;
