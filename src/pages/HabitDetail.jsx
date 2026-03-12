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
import { useTranslation } from "../hooks/useTranslation";
import { useTelegramTheme } from '../hooks/useTelegramTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Animated SVG Circular Progress
// Animates from 0 → target on mount and on every value change
// ─────────────────────────────────────────────────────────────────────────────
const CircularProgress = ({ value, total, color, size = 100 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    // Double rAF ensures the first paint at offset=full before transition kicks in
    animFrameRef.current = requestAnimationFrame(() => {
      animFrameRef.current = requestAnimationFrame(() => {
        setDisplayValue(value);
      });
    });
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [value]);

  const safeTotal = total > 0 ? total : Math.max(value, 1);
  const percentage = Math.min((displayValue / safeTotal) * 100, 100);
  const radius = (size / 2) - 9;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <circle
        cx={center} cy={center} r={radius}
        fill="none"
        stroke="var(--bg-tertiary, #F2F2F7)"
        strokeWidth="8"
      />
      <circle
        cx={center} cy={center} r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card with SVG circle + overlaid text
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ value, total, showTotal, color, title, subtitle }) => (
  <div className="hd-stat-card">
    <div className="hd-stat-circle-wrapper">
      <CircularProgress value={value} total={total} color={color} size={100} />
      <div className="hd-stat-circle-text">
        <span className="hd-stat-value">{value}</span>
        {showTotal && total > 0 && (
          <span className="hd-stat-total">{total}</span>
        )}
      </div>
    </div>
    <h3 className="hd-stat-title">{title}</h3>
    <p className="hd-stat-subtitle">{subtitle}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Animated weekly bar chart
// ─────────────────────────────────────────────────────────────────────────────
const WeeklyChart = ({ weeklyData, todayIdx, dayLabels, todayLabel }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hd-weekly-chart">
      {dayLabels.map((label, idx) => {
        const isDone = weeklyData[idx];
        const isFuture = idx > todayIdx;
        const isToday = idx === todayIdx;

        let barClass = 'hd-weekly-chart__bar';
        if (isDone)   barClass += ' hd-weekly-chart__bar--done';
        if (isToday)  barClass += ' hd-weekly-chart__bar--today';
        if (isFuture) barClass += ' hd-weekly-chart__bar--future';

        return (
          <div key={idx} className="hd-weekly-chart__col">
            <div className="hd-weekly-chart__bar-wrap">
              <div
                className={barClass}
                style={{
                  // Delay each bar slightly for stagger effect
                  transitionDelay: visible ? `${idx * 60}ms` : '0ms',
                  height: visible
                    ? (isDone || isToday ? '64px' : isFuture ? '12px' : '18px')
                    : '0px'
                }}
              />
            </div>
            <span className={`hd-weekly-chart__label${isToday ? ' hd-weekly-chart__label--today' : ''}`}>
              {isToday ? todayLabel : label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main HabitDetail component
// ─────────────────────────────────────────────────────────────────────────────
const HabitDetail = ({ habit, onClose, onEdit, onDelete, shouldShowFriendHint = false }) => {
  const { tg, user: currentUser } = useTelegram();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('myStats');
  const [loading, setLoading] = useState(true);
  const [ownerInfoLoading, setOwnerInfoLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [showFriendHint, setShowFriendHint] = useState(false);
  const friendHintClosedRef = useRef(false);
  const [toast, setToast] = useState(null);
  const [friendLimitData, setFriendLimitData] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  useTelegramTheme();
  useNavigation(onClose);

  const [statistics, setStatistics] = useState({
    currentStreak: 0,
    weekDays: 0,
    weekTotal: 7,
    monthDays: 0,
    monthTotal: 30,
    yearDays: 0,
    yearTotal: 365,
    bestStreak: 0,
    totalCompleted: 0,
    weeklyData: []
  });

  const [isCreator, setIsCreator] = useState(false);

  // ── isCreator detection ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) { setIsCreator(false); return; }
    const userDbId = localStorage.getItem('user_id');
    if (!userDbId) { setIsCreator(false); return; }

    let creatorStatus = false;
    if (ownerInfo?.creator_id && String(userDbId) === String(ownerInfo.creator_id)) {
      creatorStatus = true;
    }
    if (!creatorStatus && habit.creator_id != null && String(userDbId) === String(habit.creator_id)) {
      creatorStatus = true;
    }
    if (!creatorStatus && !habit.parent_habit_id && habit.user_id != null && String(userDbId) === String(habit.user_id)) {
      creatorStatus = true;
    }
    setIsCreator(creatorStatus);
  }, [currentUser, ownerInfo, habit.id, habit.creator_id, habit.user_id, habit.parent_habit_id]);

  // ── Data loaders ───────────────────────────────────────────────────
  const applyStats = useCallback((stats) => {
    if (!stats) return;
    setStatistics({
      currentStreak:  stats.currentStreak  || habit.streak_current || 0,
      weekDays:       stats.weekCompleted  || 0,
      weekTotal:      7,
      monthDays:      stats.monthCompleted || 0,
      monthTotal:     stats.monthTotal     || 30,
      yearDays:       stats.yearCompleted  || 0,
      yearTotal:      365,
      bestStreak:     stats.bestStreak     || stats.longestStreak || stats.streak_best || 0,
      totalCompleted: stats.totalCompleted || stats.total_completed || 0,
      weeklyData:     stats.weeklyData     || stats.weekly_data   || []
    });
  }, [habit.streak_current]);

  const loadStatistics = useCallback(async (force = false) => {
    try {
      const stats = await habitService.getHabitStatistics(habit.id, force);
      applyStats(stats);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  }, [habit.id, applyStats]);

  const applyMembersData = useCallback((loaded) => {
    setMembers(loaded);
    const friendShown = localStorage.getItem('hint_friend_shown') === '1';
    if (shouldShowFriendHint && !friendShown && !friendHintClosedRef.current && loaded.length > 0) {
      setTimeout(() => setShowFriendHint(true), 900);
    }
  }, [shouldShowFriendHint]);

  const loadMembers = useCallback(async (force = false) => {
    try {
      const data = await habitService.getHabitMembers(habit.id, force);
      applyMembersData(data.members || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, [habit.id, applyMembersData]);

  const checkFriendLimit = useCallback(async () => {
    try {
      const limitData = await habitService.checkFriendLimit(habit.id);
      setFriendLimitData(limitData);
    } catch (err) {
      console.error('Failed to check friend limit:', err);
    }
  }, [habit.id]);

  // ── Initial parallel load (force-refresh to get fresh data) ───────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      try {
        // All requests fire simultaneously for max speed
        const [ownerData] = await Promise.all([
          habitService.getHabitOwner(habit.id).catch(() => null),
          loadStatistics(true),   // skip cache on entry
          loadMembers(true),      // skip cache on entry
          checkFriendLimit()
        ]);
        if (!cancelled && ownerData) setOwnerInfo(ownerData);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setOwnerInfoLoading(false);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [habit.id]);

  // Re-check when habit prop changes (e.g. user just swiped it in Today)
  useEffect(() => {
    loadStatistics(true);
  }, [habit.streak_current, habit.is_completed_today]);

  // ── Polling: members every 3 s, statistics every 15 s ─────────────
  const loadMembersRef  = useRef(loadMembers);
  const loadStatsRef    = useRef(loadStatistics);
  loadMembersRef.current = loadMembers;
  loadStatsRef.current   = loadStatistics;

  useEffect(() => {
    const memberInterval = setInterval(() => loadMembersRef.current(true),  3_000);
    const statsInterval  = setInterval(() => loadStatsRef.current(true),   15_000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadMembersRef.current(true);
        loadStatsRef.current(true);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(memberInterval);
      clearInterval(statsInterval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [habit.id]);

  // ── Actions ────────────────────────────────────────────────────────
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
      const shareData  = await habitService.createShareLink(habit.id);
      const shareText  = `Join my "${habit.title}" habit!\n\n📝 ${t('habitDetail.goal')}: ${habit.goal}\n\nLet's build better habits together! 💪`;
      const shareUrl   = `https://t.me/CheckHabitlyBot?start=${shareData.shareCode}`;
      const fullUrl    = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      if (tg?.openTelegramLink) tg.openTelegramLink(fullUrl);
      else window.open(fullUrl, '_blank');
      setToast({ message: t('habitDetail.toasts.shareLinkCreated'), type: 'success' });
    } catch {
      setToast({ message: t('habitDetail.toasts.shareLinkFailed'), type: 'error' });
    }
  };

  const handleSubscriptionContinue = async (plan) => {
    try {
      const result = await habitService.activatePremium(plan);
      if (result.success) {
        await Promise.all([checkFriendLimit(), loadMembers(true)]);
        setShowSubscriptionModal(false);
        if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(t('habitDetail.toasts.premiumActivated'));
        setTimeout(() => handleShare(), 500);
      }
    } catch {
      setShowSubscriptionModal(false);
      if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(t('habitDetail.toasts.premiumFailed'));
      else alert(t('habitDetail.toasts.premiumFailed'));
    }
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch {}
    }
    try {
      const ta = Object.assign(document.createElement('textarea'), {
        value: text,
        style: 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;background:transparent'
      });
      document.body.appendChild(ta); ta.focus(); ta.select();
      ta.setSelectionRange(0, 99999);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) return true;
    } catch {}
    const tgWA = window.Telegram?.WebApp;
    if (tgWA?.showAlert) { tgWA.showAlert(`Copy this link:\n\n${text}`); return true; }
    return false;
  };

  const handleCopyLink = async () => {
    try {
      const shareData = await habitService.createShareLink(habit.id);
      if (!shareData?.shareCode) throw new Error('No share code');
      const ok = await copyToClipboard(`https://t.me/CheckHabitlyBot?start=${shareData.shareCode}`);
      if (ok) {
        setShowCopyModal(true);
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } else throw new Error('copy failed');
    } catch {
      setToast({ message: t('habitDetail.toasts.linkCopyFailed'), type: 'error' });
    }
  };

  const handlePunchFriend = async (memberId) => {
    try {
      const result = await habitService.punchFriend(habit.id, memberId);
      if (result.showToast) {
        setToast({ message: result.toastMessage, type: result.toastType || 'info' });
        const hf = window.Telegram?.WebApp?.HapticFeedback;
        if (hf) {
          if (result.alreadyCompleted) hf.notificationOccurred('warning');
          else if (result.success)     hf.impactOccurred('medium');
        }
      } else if (tg?.showAlert) {
        if (result.alreadyCompleted) tg.showAlert(t('habitDetail.alerts.alreadyCompleted', { name: result.friendName }));
        else if (result.isSkipped)   tg.showAlert(t('habitDetail.alerts.skipped', { name: result.friendName }));
        else if (result.success)     tg.showAlert(t('habitDetail.alerts.reminderSent'));
      }
    } catch {
      setToast({ message: t('habitDetail.toasts.punchFailed'), type: 'error' });
    }
  };

  const handleRemoveFriend = async (memberId) => {
    const doRemove = async () => {
      await habitService.removeMember(habit.id, memberId);
      await Promise.all([loadMembers(true), checkFriendLimit()]);
      setToast({ message: t('habitDetail.toasts.friendRemoved'), type: 'success' });
    };
    try {
      if (tg?.showConfirm) {
        tg.showConfirm(t('habitDetail.alerts.removeFriendConfirm'), async (ok) => { if (ok) await doRemove(); });
      } else {
        if (window.confirm(t('habitDetail.alerts.removeFriendConfirm'))) await doRemove();
      }
    } catch {
      setToast({ message: t('habitDetail.toasts.friendRemoveFailed'), type: 'error' });
    }
  };

  const handlePunchLazyFriend = async () => {
    const lazy = members.find(m => m.today_status !== 'completed');
    if (lazy) await handlePunchFriend(lazy.id);
    else setToast({ message: t('habitDetail.alerts.reminderSent'), type: 'success' });
  };

  const handleEditClick = () => { if (onEdit) onEdit(habit); };

  // ── Helpers ────────────────────────────────────────────────────────
  const getCategoryEmoji = () => habit.category_icon || habit.icon || '🎯';

  const getProgressColor = (type) => ({
    streak: '#A7D96C',
    week:   '#7DD3C0',
    month:  '#C084FC',
    year:   '#FBBF24'
  })[type] || '#A7D96C';

  const getMotivationText = () => {
    const s = statistics.currentStreak;
    if (s >= 30) return t('habitDetail.motivations.m30');
    if (s >= 14) return t('habitDetail.motivations.m14');
    if (s >= 7)  return t('habitDetail.motivations.m7');
    if (s >= 3)  return t('habitDetail.motivations.m3');
    return t('habitDetail.motivations.m0');
  };

  const getWeeklyDisplayData = () => {
    if (statistics.weeklyData?.length === 7) return statistics.weeklyData.map(v => !!v);
    const dayOfWeek = new Date().getDay();
    const todayI = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const data = new Array(7).fill(false);
    let rem = statistics.weekDays;
    for (let i = 0; i <= todayI && rem > 0; i++) { data[i] = true; rem--; }
    return data;
  };

  const getTodayIdx = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };

  const getMemberStreak   = m => m.streak || m.current_streak || m.streak_current || 0;
  const getMemberWeek     = m => ({ completed: m.week_completed || m.weekCompleted || 0, total: m.week_total || m.weekTotal || 28 });
  const getMemberDaily    = m => ({ completed: m.completed_today || m.today_completed || 0, total: m.total_today || m.today_total || 0 });
  const memberColors      = ['#7DD3C0', '#FF6B9D', '#FBBF24', '#C084FC', '#FF8C42', '#4ECDC4'];
  const getMemberColor    = i => memberColors[i % memberColors.length];

  // ── Derived data ───────────────────────────────────────────────────
  const weeklyData   = getWeeklyDisplayData();
  const todayIdx     = getTodayIdx();
  const rawDayLabels = t('habitDetail.weekDays');
  const dayLabels    = Array.isArray(rawDayLabels) ? rawDayLabels : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const todayLabel   = t('habitDetail.stats.today');

  const sortedByStreak = [...members].sort((a, b) => getMemberStreak(b) - getMemberStreak(a));
  const top3 = sortedByStreak.slice(0, 3);
  const podiumOrder = top3.length >= 2 ? [top3[1], top3[0], top3[2]].filter(Boolean) : top3;
  const hasLazyFriend = members.some(m => m.today_status !== 'completed');

  // ── Render ─────────────────────────────────────────────────────────
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
            {!ownerInfoLoading && isCreator && (
              <button className="hd-header__edit-btn" onClick={handleEditClick}>
                {t('habitDetail.edit')}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="hd-tabs">
            <button
              className={`hd-tabs__btn${activeTab === 'myStats' ? ' hd-tabs__btn--active' : ''}`}
              onClick={() => setActiveTab('myStats')}
            >
              {t('habitDetail.tabs.myStats')}
            </button>
            <button
              className={`hd-tabs__btn${activeTab === 'friends' ? ' hd-tabs__btn--active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              {t('habitDetail.tabs.friends')}
            </button>
          </div>

          {/* ═══════ MY STATS TAB ═══════ */}
          {activeTab === 'myStats' && (
            <>
              {/* 4 stat cards with animated SVG circles */}
              <div className="hd-stats-grid">
                <StatCard
                  value={statistics.currentStreak}
                  total={statistics.bestStreak > statistics.currentStreak ? statistics.bestStreak : statistics.currentStreak || 1}
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

              {/* Weekly bar chart with stagger animation */}
              <div className="hd-weekly-card">
                <h3 className="hd-weekly-card__title">{t('habitDetail.stats.thisWeek')}</h3>
                <WeeklyChart
                  weeklyData={weeklyData}
                  todayIdx={todayIdx}
                  dayLabels={dayLabels}
                  todayLabel={todayLabel}
                />
              </div>

              {/* Friends in habit (simplified) */}
              <div className="hd-friends-section">
                <div className="hd-friends-section__header">
                  <h3 className="hd-friends-section__title">{t('habitDetail.friends.inHabit')}</h3>
                  {friendLimitData && (
                    <span className="hd-friends-section__count">
                      {members.length}/{friendLimitData.limit} ({t('habitDetail.friends.freePlan')})
                    </span>
                  )}
                </div>

                {members.length > 0 ? (
                  <div className="hd-members-list">
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
                  <p className="hd-friends-section__empty">{t('habitDetail.friends.subtitle')}</p>
                )}

                <button className="hd-btn hd-btn--primary hd-btn--full" onClick={handleAddFriend}>
                  + {t('habitDetail.friends.addFriend')}
                </button>
              </div>

              {/* Delete (creator only) */}
              {isCreator && (
                <button className="hd-btn hd-btn--danger hd-btn--full" onClick={() => setShowDeleteModal(true)}>
                  {t('habitDetail.buttons.removeHabit')}
                </button>
              )}
            </>
          )}

          {/* ═══════ FRIENDS TAB ═══════ */}
          {activeTab === 'friends' && (
            <>
              {members.length === 0 ? (
                <div className="hd-friends-empty">
                  <p className="hd-friends-empty__text">{t('habitDetail.friends.subtitle')}</p>
                  <button className="hd-btn hd-btn--primary hd-btn--full" onClick={handleAddFriend}>
                    + {t('habitDetail.friends.addFriend')}
                  </button>
                </div>
              ) : (
                <>
                  {/* Podium */}
                  {top3.length >= 2 && (
                    <div className="hd-leaderboard-card">
                      <h3 className="hd-leaderboard-card__title">{t('habitDetail.friends.leaderboard')}</h3>
                      <div className="hd-podium">
                        {podiumOrder.map((member) => {
                          const podiumPos = podiumOrder.indexOf(member);
                          const place = podiumPos === 1 ? 1 : podiumPos === 0 ? 2 : 3;
                          const realIdx = sortedByStreak.indexOf(member);
                          return (
                            <div key={member.id} className={`hd-podium__item hd-podium__item--place${place}`}>
                              <span className="hd-podium__crown">⚡</span>
                              <div className="hd-podium__avatar" style={{ background: getMemberColor(realIdx) }}>
                                {member.photo_url
                                  ? <img src={member.photo_url} alt={member.first_name} className="hd-podium__avatar-img" />
                                  : <span>{member.first_name?.[0]?.toUpperCase() || '?'}</span>
                                }
                              </div>
                              <span className="hd-podium__name">{member.first_name}</span>
                              <div className={`hd-podium__platform hd-podium__platform--place${place}`} />
                              <span className="hd-podium__score">{getMemberStreak(member)} 🔥</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Habit Friends list */}
                  <div className="hd-friends-card">
                    <h3 className="hd-friends-card__title">{t('habitDetail.friends.title')}</h3>
                    {members.map((member, idx) => {
                      const daily  = getMemberDaily(member);
                      const streak = getMemberStreak(member);
                      return (
                        <div key={member.id} className="hd-friend-row">
                          <div className="hd-friend-row__avatar" style={{ background: getMemberColor(idx) }}>
                            {member.photo_url
                              ? <img src={member.photo_url} alt={member.first_name} className="hd-friend-row__avatar-img" />
                              : <span>{member.first_name?.[0]?.toUpperCase() || '?'}</span>
                            }
                          </div>
                          <div className="hd-friend-row__info">
                            <span className="hd-friend-row__name">{member.first_name} {member.last_name}</span>
                            {daily.total > 0 && (
                              <span className="hd-friend-row__progress">
                                {daily.completed}/{daily.total} {t('habitDetail.friends.today')}
                              </span>
                            )}
                          </div>
                          {streak > 0 && (
                            <span className="hd-friend-row__streak">🔥 {streak}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Weekly comparison */}
                  <div className="hd-comparison-card">
                    <h3 className="hd-comparison-card__title">{t('habitDetail.friends.weeklyComparison')}</h3>
                    {members.map((member, idx) => {
                      const week = getMemberWeek(member);
                      const maxTotal = Math.max(week.total, statistics.weekTotal, 28);
                      const pct = maxTotal > 0 ? Math.min((week.completed / maxTotal) * 100, 100) : 0;
                      return (
                        <div key={member.id} className="hd-comparison-row">
                          <div className="hd-comparison-row__avatar" style={{ background: getMemberColor(idx) }}>
                            {member.photo_url
                              ? <img src={member.photo_url} alt={member.first_name} className="hd-comparison-row__avatar-img" />
                              : <span>{member.first_name?.[0]?.toUpperCase() || '?'}</span>
                            }
                          </div>
                          <div className="hd-comparison-row__content">
                            <span className="hd-comparison-row__name">{member.first_name}</span>
                            <div className="hd-comparison-row__bar-track">
                              <div className="hd-comparison-row__bar" style={{ width: `${pct}%`, background: getMemberColor(idx) }} />
                            </div>
                          </div>
                          <span className="hd-comparison-row__score">{week.completed}/{maxTotal}</span>
                        </div>
                      );
                    })}
                    {/* Me */}
                    {(() => {
                      const myTotal = Math.max(statistics.weekTotal, 28);
                      const myPct   = myTotal > 0 ? Math.min((statistics.weekDays / myTotal) * 100, 100) : 0;
                      return (
                        <div className="hd-comparison-row hd-comparison-row--me">
                          <div className="hd-comparison-row__avatar hd-comparison-row__avatar--me">
                            <span>😊</span>
                          </div>
                          <div className="hd-comparison-row__content">
                            <span className="hd-comparison-row__name">{t('habitDetail.friends.you')}</span>
                            <div className="hd-comparison-row__bar-track">
                              <div className="hd-comparison-row__bar hd-comparison-row__bar--me" style={{ width: `${myPct}%` }} />
                            </div>
                          </div>
                          <span className="hd-comparison-row__score">{statistics.weekDays}/{myTotal}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Punch lazy friend */}
                  {hasLazyFriend && (
                    <button className="hd-btn hd-btn--primary hd-btn--full hd-btn--punch" onClick={handlePunchLazyFriend}>
                      {t('habitDetail.friends.punchLazy')}
                    </button>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </div>

      {/* Modals */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => onDelete(habit.id)}
        habitTitle={habit.title}
      />
      <CopyLinkModal isOpen={showCopyModal} onClose={() => setShowCopyModal(false)} />
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
        <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast(null)} />
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Swipeable Friend Card (unchanged logic, cleaned up)
// ─────────────────────────────────────────────────────────────────────────────
const FriendCard = ({ member, onPunch, onRemove, removeText, punchText }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const SWIPE_THRESHOLD = 60;
  const MAX_SWIPE = 100;
  const canPunch = member.today_status !== 'completed';

  const onStart  = (x) => { setStartX(x); setIsSwiping(true); };
  const onMove   = (x) => {
    if (!isSwiping) return;
    const diff = x - startX;
    if (diff < 0 && !canPunch) return;
    setSwipeOffset(Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff)));
  };
  const onEnd    = () => {
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
      if (swipeOffset < 0 && canPunch) onPunch();
      else if (swipeOffset > 0) onRemove();
    }
    setSwipeOffset(0); setIsSwiping(false);
  };
  const onCancel = () => { setSwipeOffset(0); setIsSwiping(false); };

  const getStatusInfo = () => {
    switch (member.today_status) {
      case 'completed': return { text: 'Done Today',   className: 'friend-card__status--done' };
      case 'failed':    return { text: 'Failed Today', className: 'friend-card__status--failed' };
      case 'skipped':   return { text: 'Skipped',      className: 'friend-card__status--skipped' };
      default:          return { text: 'Undone Yet',   className: 'friend-card__status--undone' };
    }
  };
  const statusInfo = getStatusInfo();

  return (
    <div className="friend-card-container">
      {swipeOffset > 20  && <div className="friend-action friend-action--remove"><span>{removeText}</span></div>}
      <div
        className="friend-card"
        style={{ transform: `translateX(${swipeOffset}px)`, transition: isSwiping ? 'none' : 'transform 0.3s ease-out', cursor: 'grab' }}
        onTouchStart={e => onStart(e.touches[0].clientX)}
        onTouchMove={e => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={e => { e.preventDefault(); onStart(e.clientX); }}
        onMouseMove={e => onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={onCancel}
      >
        <img
          src={member.photo_url || `https://ui-avatars.com/api/?name=${member.first_name}`}
          alt={member.first_name}
          className="friend-card__avatar"
        />
        <div className="friend-card__info">
          <span className="friend-card__name">{member.first_name} {member.last_name}</span>
          <span className={`friend-card__status ${statusInfo.className}`}>{statusInfo.text}</span>
        </div>
      </div>
      {swipeOffset < -20 && canPunch && <div className="friend-action friend-action--punch"><span>{punchText}</span></div>}
    </div>
  );
};

export default HabitDetail;
