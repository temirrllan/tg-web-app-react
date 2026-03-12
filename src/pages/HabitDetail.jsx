import React, { useState, useEffect, useRef } from 'react';
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

// SVG Circular Progress (used in stat cards)
const CircularProgress = ({ value, total, color, size = 100 }) => {
  const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0;
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
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
};

// Stat Card with SVG circle + overlaid text
const StatCard = ({ value, total, showTotal, color, title, subtitle }) => (
  <div className="hd-stat-card">
    <div className="hd-stat-circle-wrapper">
      <CircularProgress value={value} total={total > 0 ? total : Math.max(value, 1)} color={color} size={100} />
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

  useEffect(() => {
    console.group('🔍 CALCULATING isCreator');

    if (!currentUser) {
      console.warn('⚠️ No current user');
      console.groupEnd();
      setIsCreator(false);
      return;
    }

    const userDbId = localStorage.getItem('user_id');

    if (!userDbId) {
      console.error('❌ CRITICAL: No user_id in localStorage!');
      console.groupEnd();
      setIsCreator(false);
      return;
    }

    console.log('📊 User identification:', {
      localStorage_user_id: userDbId,
      currentUser_telegram_id: currentUser.id
    });

    console.log('📋 Habit data:', {
      habit_id: habit.id,
      habit_user_id: habit.user_id,
      habit_creator_id: habit.creator_id,
      habit_parent_habit_id: habit.parent_habit_id
    });

    console.log('🌐 Owner info from API:', ownerInfo);

    let creatorStatus = false;

    if (ownerInfo && ownerInfo.creator_id) {
      const creatorDbId = String(ownerInfo.creator_id);
      const match = String(userDbId) === creatorDbId;
      console.log('✅ Method 1 (API ownerInfo):', { userDbId: String(userDbId), creatorDbId, match });
      if (match) {
        console.log('✅ USER IS CREATOR (via API ownerInfo)');
        creatorStatus = true;
      }
    }

    if (!creatorStatus && habit.creator_id !== undefined && habit.creator_id !== null) {
      const creatorDbId = String(habit.creator_id);
      const match = String(userDbId) === creatorDbId;
      console.log('✅ Method 2 (habit.creator_id):', { userDbId: String(userDbId), creatorDbId, match });
      if (match) {
        console.log('✅ USER IS CREATOR (via habit.creator_id)');
        creatorStatus = true;
      }
    }

    if (!creatorStatus && !habit.parent_habit_id && habit.user_id !== undefined && habit.user_id !== null) {
      const habitUserId = String(habit.user_id);
      const match = String(userDbId) === habitUserId;
      console.log('✅ Method 3 (habit.user_id fallback):', { userDbId: String(userDbId), habitUserId, match, isSharedHabit: !!habit.parent_habit_id });
      if (match) {
        console.log('✅ USER IS CREATOR (via habit.user_id)');
        creatorStatus = true;
      }
    }

    console.log('🎯 FINAL isCreator:', creatorStatus);
    console.groupEnd();
    setIsCreator(creatorStatus);
  }, [currentUser, ownerInfo, habit.id, habit.creator_id, habit.user_id, habit.parent_habit_id]);

  useEffect(() => {
    const loadOwnerInfo = async () => {
      try {
        setOwnerInfoLoading(true);
        console.log('🔄 Loading owner info for habit:', habit.id);
        const info = await habitService.getHabitOwner(habit.id);
        console.log('📊 Habit owner info received:', info);
        setOwnerInfo(info);
      } catch (error) {
        console.error('Failed to load owner info:', error);
      } finally {
        setOwnerInfoLoading(false);
      }
    };

    loadOwnerInfo();
    loadStatistics();
    loadMembers();
    checkFriendLimit();
  }, [habit.id]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await habitService.getHabitStatistics(habit.id);
      if (stats) {
        setStatistics({
          currentStreak: stats.currentStreak || habit.streak_current || 0,
          weekDays: stats.weekCompleted || 0,
          weekTotal: 7,
          monthDays: stats.monthCompleted || 0,
          monthTotal: stats.monthTotal || 30,
          yearDays: stats.yearCompleted || 0,
          yearTotal: 365,
          bestStreak: stats.bestStreak || stats.longestStreak || stats.streak_best || 0,
          totalCompleted: stats.totalCompleted || stats.total_completed || 0,
          weeklyData: stats.weeklyData || stats.weekly_data || []
        });
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyMembersData = (loaded) => {
    setMembers(loaded);
    const friendShown = localStorage.getItem('hint_friend_shown') === '1';
    if (shouldShowFriendHint && !friendShown && !friendHintClosedRef.current && loaded.length > 0) {
      setTimeout(() => setShowFriendHint(true), 900);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await habitService.getHabitMembers(habit.id, false);
      applyMembersData(data.members || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const pollMembers = async () => {
    try {
      const data = await habitService.getHabitMembers(habit.id, true);
      applyMembersData(data.members || []);
    } catch (error) {
      console.error('Failed to poll members:', error);
    }
  };

  const checkFriendLimit = async () => {
    try {
      const limitData = await habitService.checkFriendLimit(habit.id);
      setFriendLimitData(limitData);
      console.log('Friend limit data:', limitData);
    } catch (error) {
      console.error('Failed to check friend limit:', error);
    }
  };

  const pollMembersRef = useRef(pollMembers);
  pollMembersRef.current = pollMembers;

  useEffect(() => {
    const interval = setInterval(() => {
      pollMembersRef.current?.();
    }, 3000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pollMembersRef.current?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [habit.id]);

  const handleAddFriend = async () => {
    console.log('Add Friend clicked, checking limits...');
    const limitCheck = await habitService.checkFriendLimit(habit.id);
    setFriendLimitData(limitCheck);
    console.log('Friend limit check result:', limitCheck);
    if (limitCheck.showPremiumModal && !limitCheck.isPremium) {
      console.log('Friend limit reached, showing subscription modal');
      setShowSubscriptionModal(true);
      return;
    }
    await handleShare();
  };

  const handleShare = async () => {
    try {
      const shareData = await habitService.createShareLink(habit.id);
      const shareCode = shareData.shareCode;
      console.log('📤 Creating share link:', { habitId: habit.id, shareCode, botUsername: 'CheckHabitlyBot' });
      const shareText = `Join my "${habit.title}" habit!\n\n📝 ${t('habitDetail.goal')}: ${habit.goal}\n\nLet's build better habits together! 💪`;
      const shareUrl = `https://t.me/CheckHabitlyBot?start=${shareCode}`;
      console.log('🔗 Generated share URL:', shareUrl);
      if (tg?.openTelegramLink) {
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        tg.openTelegramLink(telegramShareUrl);
      } else {
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(telegramShareUrl, '_blank');
      }
      setToast({ message: t('habitDetail.toasts.shareLinkCreated'), type: 'success' });
    } catch (error) {
      console.error('❌ Failed to create share link:', error);
      setToast({ message: t('habitDetail.toasts.shareLinkFailed'), type: 'error' });
    }
  };

  const handleSubscriptionContinue = async (plan) => {
    console.log('Selected subscription plan:', plan);
    try {
      const result = await habitService.activatePremium(plan);
      if (result.success) {
        console.log('Premium activated successfully');
        await checkFriendLimit();
        await loadMembers();
        setShowSubscriptionModal(false);
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert(t('habitDetail.toasts.premiumActivated'));
        }
        setTimeout(() => { handleShare(); }, 500);
      }
    } catch (error) {
      console.error('Failed to activate premium:', error);
      setShowSubscriptionModal(false);
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(t('habitDetail.toasts.premiumFailed'));
      } else {
        alert(t('habitDetail.toasts.premiumFailed'));
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      console.log('📋 Creating share link for habit:', habit.id);
      const shareData = await habitService.createShareLink(habit.id);
      if (!shareData || !shareData.shareCode) throw new Error('No share code received');
      const inviteLink = `https://t.me/CheckHabitlyBot?start=${shareData.shareCode}`;
      const copySuccess = await copyToClipboard(inviteLink);
      if (copySuccess) {
        setShowCopyModal(true);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } else {
        throw new Error('All copy methods failed');
      }
    } catch (err) {
      console.error('❌ Failed to copy link:', err);
      setToast({ message: t('habitDetail.toasts.linkCopyFailed'), type: 'error' });
    }
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch (err) { console.warn('⚠️ Clipboard API failed:', err); }
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      Object.assign(textArea.style, { position: 'fixed', top: '0', left: '0', width: '2em', height: '2em', padding: '0', border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' });
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) return true;
    } catch (err) { console.warn('⚠️ execCommand failed:', err); }
    const tgWA = window.Telegram?.WebApp;
    if (tgWA && tgWA.showAlert) { tgWA.showAlert(`Copy this link:\n\n${text}`); return true; }
    return false;
  };

  const handlePunchFriend = async (memberId) => {
    try {
      const result = await habitService.punchFriend(habit.id, memberId);
      if (result.showToast) {
        setToast({ message: result.toastMessage, type: result.toastType || 'info' });
        if (window.Telegram?.WebApp?.HapticFeedback) {
          if (result.alreadyCompleted) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
          } else if (result.success) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
          }
        }
      } else if (tg?.showAlert) {
        if (result.alreadyCompleted) {
          tg.showAlert(t('habitDetail.alerts.alreadyCompleted', { name: result.friendName }));
        } else if (result.isSkipped) {
          tg.showAlert(t('habitDetail.alerts.skipped', { name: result.friendName }));
        } else if (result.success) {
          tg.showAlert(t('habitDetail.alerts.reminderSent'));
        }
      }
    } catch (error) {
      console.error('Failed to send punch:', error);
      setToast({ message: t('habitDetail.toasts.punchFailed'), type: 'error' });
    }
  };

  const handleRemoveFriend = async (memberId) => {
    try {
      if (tg?.showConfirm) {
        tg.showConfirm(t('habitDetail.alerts.removeFriendConfirm'), async (confirmed) => {
          if (confirmed) {
            await habitService.removeMember(habit.id, memberId);
            await loadMembers();
            await checkFriendLimit();
            setToast({ message: t('habitDetail.toasts.friendRemoved'), type: 'success' });
          }
        });
      } else {
        const confirmed = window.confirm(t('habitDetail.alerts.removeFriendConfirm'));
        if (confirmed) {
          await habitService.removeMember(habit.id, memberId);
          await loadMembers();
          await checkFriendLimit();
          setToast({ message: t('habitDetail.toasts.friendRemoved'), type: 'success' });
        }
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
      setToast({ message: t('habitDetail.toasts.friendRemoveFailed'), type: 'error' });
    }
  };

  const handlePunchLazyFriend = async () => {
    const lazyFriend = members.find(m => m.today_status !== 'completed');
    if (lazyFriend) {
      await handlePunchFriend(lazyFriend.id);
    } else {
      setToast({ message: t('habitDetail.alerts.reminderSent'), type: 'success' });
    }
  };

  const handleEditClick = () => {
    console.log('🖊️ Edit button clicked');
    if (onEdit) onEdit(habit);
  };

  const getCategoryEmoji = () => habit.category_icon || habit.icon || '🎯';

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

  const getMotivationText = () => {
    const streak = statistics.currentStreak;
    if (streak >= 30) return t('habitDetail.motivations.m30');
    if (streak >= 14) return t('habitDetail.motivations.m14');
    if (streak >= 7) return t('habitDetail.motivations.m7');
    if (streak >= 3) return t('habitDetail.motivations.m3');
    return t('habitDetail.motivations.m0');
  };

  // Build 7-day weekly chart data
  const getWeeklyDisplayData = () => {
    if (statistics.weeklyData && statistics.weeklyData.length === 7) {
      return statistics.weeklyData.map(v => !!v);
    }
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const data = new Array(7).fill(false);
    let remaining = statistics.weekDays;
    for (let i = 0; i <= todayIdx && remaining > 0; i++) {
      data[i] = true;
      remaining--;
    }
    return data;
  };

  const getTodayIdx = () => {
    const dayOfWeek = new Date().getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  };

  // Member helper: get streak
  const getMemberStreak = (member) =>
    member.streak || member.current_streak || member.streak_current || 0;

  // Member helper: get weekly completed/total
  const getMemberWeek = (member) => ({
    completed: member.week_completed || member.weekCompleted || 0,
    total: member.week_total || member.weekTotal || 28
  });

  // Member helper: get daily progress "X/Y today"
  const getMemberDailyProgress = (member) => ({
    completed: member.completed_today || member.today_completed || 0,
    total: member.total_today || member.today_total || 0
  });

  // Leaderboard colors
  const memberColors = ['#7DD3C0', '#FF6B9D', '#FBBF24', '#C084FC', '#FF8C42', '#4ECDC4'];
  const getMemberColor = (idx) => memberColors[idx % memberColors.length];

  if (loading) {
    return (
      <div className="habit-detail habit-detail--loading">
        <Loader size="large" />
      </div>
    );
  }

  const weeklyData = getWeeklyDisplayData();
  const todayIdx = getTodayIdx();
  const weekDayLabels = t('habitDetail.weekDays');
  const dayLabels = Array.isArray(weekDayLabels)
    ? weekDayLabels
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Sort members by streak for leaderboard
  const sortedMembers = [...members].sort((a, b) => getMemberStreak(b) - getMemberStreak(a));
  const top3 = sortedMembers.slice(0, 3);
  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = top3.length >= 2
    ? [top3[1], top3[0], top3[2]].filter(Boolean)
    : top3;

  // Lazy friend (one with non-completed status)
  const hasLazyFriend = members.some(m => m.today_status !== 'completed');

  return (
    <>
      <div className="habit-detail">
        <div className="habit-detail__content">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="hd-header">
            <div className="hd-header__title-section">
              <span className="hd-header__emoji">{getCategoryEmoji()}</span>
              <div className="hd-header__text">
                <h2 className="hd-header__title">{habit.title}</h2>
                {habit.goal && (
                  <p className="hd-header__goal">{habit.goal}</p>
                )}
              </div>
            </div>
            {!ownerInfoLoading && isCreator && (
              <button className="hd-header__edit-btn" onClick={handleEditClick}>
                {t('habitDetail.edit')}
              </button>
            )}
          </div>

          {/* ── Tabs ───────────────────────────────────────────────────── */}
          <div className="hd-tabs">
            <button
              className={`hd-tabs__btn ${activeTab === 'myStats' ? 'hd-tabs__btn--active' : ''}`}
              onClick={() => setActiveTab('myStats')}
            >
              {t('habitDetail.tabs.myStats')}
            </button>
            <button
              className={`hd-tabs__btn ${activeTab === 'friends' ? 'hd-tabs__btn--active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              {t('habitDetail.tabs.friends')}
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* MY STATS TAB                                                   */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'myStats' && (
            <>
              {/* Stat cards grid */}
              <div className="hd-stats-grid">
                <StatCard
                  value={statistics.currentStreak}
                  total={statistics.bestStreak > 0 ? statistics.bestStreak : statistics.currentStreak || 1}
                  showTotal={statistics.bestStreak > 0}
                  color={getProgressColor('streak')}
                  title={t('habitDetail.statistics.daysStreak')}
                  subtitle="Days Strike"
                />
                <StatCard
                  value={statistics.weekDays}
                  total={statistics.weekTotal}
                  showTotal={true}
                  color={getProgressColor('week')}
                  title={t('habitDetail.statistics.week')}
                  subtitle="Days Strike"
                />
                <StatCard
                  value={statistics.monthDays}
                  total={statistics.monthTotal}
                  showTotal={true}
                  color={getProgressColor('month')}
                  title={t('habitDetail.statistics.month')}
                  subtitle="Days Strike"
                />
                <StatCard
                  value={statistics.yearDays}
                  total={statistics.yearTotal}
                  showTotal={true}
                  color={getProgressColor('year')}
                  title={t('habitDetail.statistics.year')}
                  subtitle="Days Strike"
                />
              </div>

              {/* Motivation banner */}
              <div className="hd-motivation">
                <p className="hd-motivation__text">{getMotivationText()}</p>
              </div>

              {/* Best streak & Total */}
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

              {/* Weekly bar chart */}
              <div className="hd-weekly-card">
                <h3 className="hd-weekly-card__title">{t('habitDetail.stats.thisWeek')}</h3>
                <div className="hd-weekly-chart">
                  {dayLabels.map((label, idx) => (
                    <div key={idx} className="hd-weekly-chart__col">
                      <div className="hd-weekly-chart__bar-wrap">
                        <div className={[
                          'hd-weekly-chart__bar',
                          weeklyData[idx] ? 'hd-weekly-chart__bar--done' : '',
                          idx > todayIdx ? 'hd-weekly-chart__bar--future' : '',
                          idx === todayIdx ? 'hd-weekly-chart__bar--today' : ''
                        ].filter(Boolean).join(' ')} />
                      </div>
                      <span className={`hd-weekly-chart__label ${idx === todayIdx ? 'hd-weekly-chart__label--today' : ''}`}>
                        {idx === todayIdx ? t('habitDetail.stats.today') : label}
                      </span>
                    </div>
                  ))}
                </div>
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
                  <p className="hd-friends-section__empty">
                    {t('habitDetail.friends.subtitle')}
                  </p>
                )}

                <button
                  className="hd-btn hd-btn--primary hd-btn--full"
                  onClick={handleAddFriend}
                >
                  + {t('habitDetail.friends.addFriend')}
                </button>
              </div>

              {/* Delete button (creator only) */}
              {isCreator && (
                <button
                  className="hd-btn hd-btn--danger hd-btn--full"
                  onClick={() => setShowDeleteModal(true)}
                >
                  {t('habitDetail.buttons.removeHabit')}
                </button>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* FRIENDS TAB                                                    */}
          {/* ══════════════════════════════════════════════════════════════ */}
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
                  {/* Leaderboard podium */}
                  {top3.length >= 2 && (
                    <div className="hd-leaderboard-card">
                      <h3 className="hd-leaderboard-card__title">{t('habitDetail.friends.leaderboard')}</h3>
                      <div className="hd-podium">
                        {podiumOrder.map((member, podiumIdx) => {
                          const place = podiumOrder.indexOf(member) === 1 ? 1 : podiumOrder.indexOf(member) === 0 ? 2 : 3;
                          const realIdx = sortedMembers.indexOf(member);
                          return (
                            <div key={member.id} className={`hd-podium__item hd-podium__item--place${place}`}>
                              {place === 1 && <span className="hd-podium__crown">⚡</span>}
                              <div
                                className="hd-podium__avatar"
                                style={{ background: getMemberColor(realIdx) }}
                              >
                                {member.photo_url
                                  ? <img src={member.photo_url} alt={member.first_name} className="hd-podium__avatar-img" />
                                  : <span>{member.first_name?.[0]?.toUpperCase() || '?'}</span>
                                }
                              </div>
                              <span className="hd-podium__name">{member.first_name}</span>
                              <div className={`hd-podium__platform hd-podium__platform--place${place}`} />
                              <span className="hd-podium__score">
                                {getMemberStreak(member)} 🔥
                              </span>
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
                      const daily = getMemberDailyProgress(member);
                      const streak = getMemberStreak(member);
                      return (
                        <div key={member.id} className="hd-friend-row">
                          <div
                            className="hd-friend-row__avatar"
                            style={{ background: getMemberColor(idx) }}
                          >
                            {member.photo_url
                              ? <img src={member.photo_url} alt={member.first_name} className="hd-friend-row__avatar-img" />
                              : <span>{member.first_name?.[0]?.toUpperCase() || '?'}</span>
                            }
                          </div>
                          <div className="hd-friend-row__info">
                            <span className="hd-friend-row__name">
                              {member.first_name} {member.last_name}
                            </span>
                            {daily.total > 0 && (
                              <span className="hd-friend-row__progress">
                                {daily.completed}/{daily.total} {t('habitDetail.friends.today')}
                              </span>
                            )}
                          </div>
                          {streak > 0 && (
                            <span className="hd-friend-row__streak">
                              🔥 {streak}
                            </span>
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
                              <div
                                className="hd-comparison-row__bar"
                                style={{ width: `${pct}%`, background: getMemberColor(idx) }}
                              />
                            </div>
                          </div>
                          <span className="hd-comparison-row__score">
                            {week.completed}/{maxTotal}
                          </span>
                        </div>
                      );
                    })}
                    {/* Current user row */}
                    {(() => {
                      const myTotal = Math.max(statistics.weekTotal, 28);
                      const myPct = myTotal > 0 ? Math.min((statistics.weekDays / myTotal) * 100, 100) : 0;
                      return (
                        <div className="hd-comparison-row hd-comparison-row--me">
                          <div className="hd-comparison-row__avatar hd-comparison-row__avatar--me">
                            <span>😊</span>
                          </div>
                          <div className="hd-comparison-row__content">
                            <span className="hd-comparison-row__name">{t('habitDetail.friends.you')}</span>
                            <div className="hd-comparison-row__bar-track">
                              <div
                                className="hd-comparison-row__bar hd-comparison-row__bar--me"
                                style={{ width: `${myPct}%` }}
                              />
                            </div>
                          </div>
                          <span className="hd-comparison-row__score">
                            {statistics.weekDays}/{myTotal}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Punch lazy friend button */}
                  {hasLazyFriend && (
                    <button
                      className="hd-btn hd-btn--primary hd-btn--full hd-btn--punch"
                      onClick={handlePunchLazyFriend}
                    >
                      {t('habitDetail.friends.punchLazy')}
                    </button>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </div>

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

const FriendCard = ({ member, onPunch, onRemove, removeText, punchText }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const SWIPE_THRESHOLD = 60;
  const MAX_SWIPE = 100;

  const canPunch = member.today_status !== 'completed';

  console.log(`👤 Friend ${member.first_name}: status=${member.today_status}, canPunch=${canPunch}`);

  const handleTouchStart = (e) => { setStartX(e.touches[0].clientX); setIsSwiping(true); };
  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - startX;
    if (diff < 0 && !canPunch) return;
    setSwipeOffset(Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff)));
  };
  const handleTouchEnd = () => {
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
      if (swipeOffset < 0 && canPunch) onPunch();
      else if (swipeOffset > 0) onRemove();
    }
    setSwipeOffset(0); setIsSwiping(false);
  };

  const handleMouseDown = (e) => { e.preventDefault(); setStartX(e.clientX); setIsSwiping(true); };
  const handleMouseMove = (e) => {
    if (!isSwiping) return;
    const diff = e.clientX - startX;
    if (diff < 0 && !canPunch) return;
    setSwipeOffset(Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff)));
  };
  const handleMouseUp = () => {
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
      if (swipeOffset < 0 && canPunch) onPunch();
      else if (swipeOffset > 0) onRemove();
    }
    setSwipeOffset(0); setIsSwiping(false);
  };
  const handleMouseLeave = () => { if (isSwiping) { setSwipeOffset(0); setIsSwiping(false); } };

  const getStatusInfo = () => {
    switch (member.today_status) {
      case 'completed': return { text: 'Done Today', className: 'friend-card__status--done' };
      case 'failed':    return { text: 'Failed Today', className: 'friend-card__status--failed' };
      case 'skipped':   return { text: 'Skipped', className: 'friend-card__status--skipped' };
      default:          return { text: 'Undone Yet', className: 'friend-card__status--undone' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="friend-card-container">
      {swipeOffset > 20 && (
        <div className="friend-action friend-action--remove"><span>{removeText}</span></div>
      )}
      <div
        className="friend-card"
        style={{ transform: `translateX(${swipeOffset}px)`, transition: isSwiping ? 'none' : 'transform 0.3s ease-out', cursor: 'grab' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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
      {swipeOffset < -20 && canPunch && (
        <div className="friend-action friend-action--punch"><span>{punchText}</span></div>
      )}
    </div>
  );
};

export default HabitDetail;
