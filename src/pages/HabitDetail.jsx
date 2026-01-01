import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useTelegram } from '../hooks/useTelegram';
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

const CircularProgress = ({ value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="var(--bg-tertiary, #F2F2F7)"
        strokeWidth="8"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
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

const HabitDetail = ({ habit, onClose, onEdit, onDelete }) => {
  const { tg, user: currentUser } = useTelegram();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [ownerInfoLoading, setOwnerInfoLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [showFriendHint, setShowFriendHint] = useState(false);
  const [toast, setToast] = useState(null);
  const [friendLimitData, setFriendLimitData] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  useTelegramTheme();

  const [statistics, setStatistics] = useState({
    currentStreak: 0,
    weekDays: 0,
    weekTotal: 7,
    monthDays: 0,
    monthTotal: 30,
    yearDays: 0,
    yearTotal: 365
  });

  useNavigation(onClose);

  const [isCreator, setIsCreator] = useState(false);

  // 🆕 ДОБАВЛЕНО: Функция для обновления статистики
  const loadStatistics = async () => {
    try {
      console.log('📊 Loading statistics for habit:', habit.id);
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
        console.log('✅ Statistics updated:', stats);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

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
      
      console.log('✅ Method 1 (API ownerInfo):', {
        userDbId: String(userDbId),
        creatorDbId: creatorDbId,
        match: match
      });
      
      if (match) {
        console.log('✅ USER IS CREATOR (via API ownerInfo)');
        creatorStatus = true;
      }
    }

    if (!creatorStatus && habit.creator_id !== undefined && habit.creator_id !== null) {
      const creatorDbId = String(habit.creator_id);
      const match = String(userDbId) === creatorDbId;
      
      console.log('✅ Method 2 (habit.creator_id):', {
        userDbId: String(userDbId),
        creatorDbId: creatorDbId,
        match: match
      });
      
      if (match) {
        console.log('✅ USER IS CREATOR (via habit.creator_id)');
        creatorStatus = true;
      }
    }

    if (!creatorStatus && !habit.parent_habit_id && habit.user_id !== undefined && habit.user_id !== null) {
      const habitUserId = String(habit.user_id);
      const match = String(userDbId) === habitUserId;
      
      console.log('✅ Method 3 (habit.user_id fallback):', {
        userDbId: String(userDbId),
        habitUserId: habitUserId,
        match: match,
        isSharedHabit: !!habit.parent_habit_id
      });
      
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
    if (!tg) return;
    try {
      tg.BackButton.show();
      tg.BackButton.onClick(onClose);

      return () => {
        tg.BackButton.offClick(onClose);
        tg.BackButton.hide();
      };
    } catch (err) {
      console.error('Failed to handle Telegram BackButton:', err);
    }
  }, [tg, onClose]);

  // 🆕 ИЗМЕНЕНО: Начальная загрузка данных
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setOwnerInfoLoading(true);
        
        // Загружаем все данные параллельно
        const [ownerInfoResult, statsResult, membersResult, limitResult] = await Promise.all([
          habitService.getHabitOwner(habit.id),
          habitService.getHabitStatistics(habit.id),
          habitService.getHabitMembers(habit.id),
          habitService.checkFriendLimit(habit.id)
        ]);
        
        console.log('📊 Initial data loaded');
        
        setOwnerInfo(ownerInfoResult);
        
        if (statsResult) {
          setStatistics({
            currentStreak: statsResult.currentStreak || habit.streak_current || 0,
            weekDays: statsResult.weekCompleted || 0,
            weekTotal: 7,
            monthDays: statsResult.monthCompleted || 0,
            monthTotal: statsResult.monthTotal || 30,
            yearDays: statsResult.yearCompleted || 0,
            yearTotal: 365
          });
        }
        
        setMembers(membersResult.members || []);
        setFriendLimitData(limitResult);
        
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
        setOwnerInfoLoading(false);
      }
    };
    
    loadInitialData();
  }, [habit.id]);

  // 🆕 ДОБАВЛЕНО: Слушаем изменения в localStorage (сигнал от Today.jsx)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Проверяем, что это наше событие обновления статистики
      if (e.key === `habit_stats_update_${habit.id}`) {
        console.log('📡 Received stats update signal for habit:', habit.id);
        loadStatistics();
        // Очищаем флаг
        localStorage.removeItem(`habit_stats_update_${habit.id}`);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [habit.id]);

  // 🆕 ДОБАВЛЕНО: Проверяем visibility change (когда пользователь возвращается)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Page visible, refreshing stats');
        loadStatistics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [habit.id]);

  // 🆕 ДОБАВЛЕНО: Периодическое обновление каждые 10 секунд (опционально)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refreshing stats');
      loadStatistics();
    }, 10000); // 10 секунд

    return () => clearInterval(interval);
  }, [habit.id]);

  const loadMembers = async () => {
    try {
      const data = await habitService.getHabitMembers(habit.id);
      setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to load members:', error);
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
      
      console.log('📤 Creating share link:', { 
        habitId: habit.id, 
        shareCode,
        botUsername: 'CheckHabitlyBot' 
      });
      
      const shareText = `Join my "${habit.title}" habit!\n\n📝 ${t('habitDetail.goal')}: ${habit.goal}\n\nLet's build better habits together! 💪`;
      
      const shareUrl = `https://t.me/CheckHabitlyBot?start=${shareCode}`;
      
      console.log('🔗 Generated share URL:', shareUrl);
      console.log('📝 Share text:', shareText);
      
      const hasSeenFriendHint = localStorage.getItem('hasSeenFriendHint');
      if (!hasSeenFriendHint && members.length === 0) {
        setTimeout(() => {
          setShowFriendHint(true);
          localStorage.setItem('hasSeenFriendHint', 'true');
        }, 2000);
      }
      
      if (tg?.openTelegramLink) {
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        console.log('📲 Opening Telegram share dialog:', telegramShareUrl);
        tg.openTelegramLink(telegramShareUrl);
      } else {
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        console.log('🌐 Opening share in browser:', telegramShareUrl);
        window.open(telegramShareUrl, '_blank');
      }
      
      setToast({
        message: t('habitDetail.toasts.shareLinkCreated'),
        type: 'success'
      });
      
      console.log('✅ Share dialog opened successfully');
    } catch (error) {
      console.error('❌ Failed to create share link:', error);
      setToast({
        message: t('habitDetail.toasts.shareLinkFailed'),
        type: 'error'
      });
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
        
        setTimeout(() => {
          handleShare();
        }, 500);
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
      console.log('✅ Share data received:', shareData);
      
      if (!shareData || !shareData.shareCode) {
        throw new Error('No share code received');
      }
      
      const shareCode = shareData.shareCode;
      const inviteLink = `https://t.me/CheckHabitlyBot?start=${shareCode}`;
      
      console.log('📋 Attempting to copy link:', inviteLink);
      
      const copySuccess = await copyToClipboard(inviteLink);
      
      if (copySuccess) {
        console.log('✅ Link copied successfully:', inviteLink);
        
        setShowCopyModal(true);
        
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } else {
        throw new Error('All copy methods failed');
      }
      
    } catch (err) {
      console.error('❌ Failed to copy link:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });
      
      setToast({
        message: t('habitDetail.toasts.linkCopyFailed'),
        type: 'error'
      });
    }
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        console.log('✅ Copied via Clipboard API');
        return true;
      } catch (err) {
        console.warn('⚠️ Clipboard API failed:', err);
      }
    }
    
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      textArea.setSelectionRange(0, 99999);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('✅ Copied via execCommand');
        return true;
      }
    } catch (err) {
      console.warn('⚠️ execCommand failed:', err);
    }
    
    const tg = window.Telegram?.WebApp;
    if (tg && tg.readTextFromClipboard) {
      try {
        if (window.prompt) {
          window.prompt('Copy this link:', text);
          console.log('✅ Showed prompt for manual copy');
          return true;
        }
      } catch (err) {
        console.warn('⚠️ Telegram readTextFromClipboard failed:', err);
      }
    }
    
    if (tg && tg.showAlert) {
      tg.showAlert(`Copy this link:\n\n${text}`);
      console.log('✅ Showed alert with link');
      return true;
    }
    
    console.error('❌ All copy methods failed');
    return false;
  };

  const handlePunchFriend = async (memberId) => {
    try {
      const result = await habitService.punchFriend(habit.id, memberId);
      
      if (result.showToast) {
        setToast({
          message: result.toastMessage,
          type: result.toastType || 'info'
        });
        
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
      setToast({
        message: t('habitDetail.toasts.punchFailed'),
        type: 'error'
      });
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
            setToast({
              message: t('habitDetail.toasts.friendRemoved'),
              type: 'success'
            });
          }
        });
      } else {
        const confirmed = window.confirm(t('habitDetail.alerts.removeFriendConfirm'));
        if (confirmed) {
          await habitService.removeMember(habit.id, memberId);
          await loadMembers();
          await checkFriendLimit();
          setToast({
            message: t('habitDetail.toasts.friendRemoved'),
            type: 'success'
          });
        }
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
      setToast({
        message: t('habitDetail.toasts.friendRemoveFailed'),
        type: 'error'
      });
    }
  };

  const handleEditClick = () => {
    console.log('🖊️ Edit button clicked');
    console.log('✅ User is the creator - opening edit form');
    
    if (onEdit) {
      onEdit(habit);
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
    <>
      <div className="habit-detail">
        <div className="habit-detail__content">
          <div className="habit-detail__habit-info">
            <div className="habit-detail__habit-header">
              <div className="habit-detail__habit-title-section">
                <span className="habit-detail__emoji">{getCategoryEmoji()}</span>
                <h2 className="habit-detail__habit-title">{habit.title}</h2>
              </div>
              
              {!ownerInfoLoading && isCreator && (
                <button 
                  className="habit-detail__edit-btn"
                  onClick={handleEditClick}
                >
                  {t('habitDetail.edit')}
                </button>
              )}
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
              <h3 className="habit-detail__stat-title">{t('habitDetail.statistics.daysStreak')}</h3>
              <p className="habit-detail__stat-subtitle">{t('habitDetail.statistics.daysStreak')}</p>
            </div>

            <div className="habit-detail__stat-card">
              <div className="habit-detail__stat-circle" style={{
                '--progress': getProgressPercentage(statistics.weekDays, statistics.weekTotal),
                '--color': getProgressColor('week')
              }}>
                <span className="habit-detail__stat-value">{statistics.weekDays}</span>
                <span className="habit-detail__stat-total">{statistics.weekTotal}</span>
              </div>
              <h3 className="habit-detail__stat-title">{t('habitDetail.statistics.week')}</h3>
              <p className="habit-detail__stat-subtitle">{t('habitDetail.statistics.daysStreak')}</p>
            </div>

            <div className="habit-detail__stat-card">
              <div className="habit-detail__stat-circle" style={{
                '--progress': getProgressPercentage(statistics.monthDays, statistics.monthTotal),
                '--color': getProgressColor('month')
              }}>
                <span className="habit-detail__stat-value">{statistics.monthDays}</span>
                <span className="habit-detail__stat-total">{statistics.monthTotal}</span>
              </div>
              <h3 className="habit-detail__stat-title">{t('habitDetail.statistics.month')}</h3>
              <p className="habit-detail__stat-subtitle">{t('habitDetail.statistics.daysStreak')}</p>
            </div>

            <div className="habit-detail__stat-card">
              <div className="habit-detail__stat-circle" style={{
                '--progress': getProgressPercentage(statistics.yearDays, statistics.yearTotal),
                '--color': getProgressColor('year')
              }}>
                <span className="habit-detail__stat-value">{statistics.yearDays}</span>
                <span className="habit-detail__stat-total">{statistics.yearTotal}</span>
              </div>
              <h3 className="habit-detail__stat-title">{t('habitDetail.statistics.year')}</h3>
              <p className="habit-detail__stat-subtitle">{t('habitDetail.statistics.daysStreak')}</p>
            </div>
          </div>

          <div className="habit-detail__motivation">
            <p className="habit-detail__motivation-text">
              {t('habitDetail.motivation')}
            </p>
          </div>

          <div className="habit-detail__friends">
            <h3 className="habit-detail__friends-title">{t('habitDetail.friends.title')}</h3>
            
            {friendLimitData && !friendLimitData.isPremium && (
              <p style={{
                fontSize: '13px',
                color: '#8E8E93',
                marginBottom: '12px',
                textAlign: 'left'
              }}>
                {friendLimitData.currentFriendsCount}/{friendLimitData.limit} {friendLimitData.limit === 1 ? t('habitDetail.friends.friendsAdded') : t('habitDetail.friends.friendsAddedPlural')} ({t('habitDetail.friends.freePlan')})
              </p>
            )}
            
            {members.length > 0 ? (
              <div className="habit-detail__members-list">
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
              <p className="habit-detail__friends-subtitle">
                {t('habitDetail.friends.subtitle')}
              </p>
            )}
            
            <div className="habit-detail__share-buttons">
              <button 
                className="habit-detail__btn habit-detail__btn--primary habit-detail__btn--share"
                onClick={handleAddFriend}
              >
                {t('habitDetail.friends.addFriend')}
              </button>
            </div>
          </div>

          {isCreator && (
            <button 
              className="habit-detail__btn habit-detail__btn--danger"
              onClick={() => setShowDeleteModal(true)}
            >
              {t('habitDetail.buttons.removeHabit')}
            </button>
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
        onClose={() => setShowFriendHint(false)}
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

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
    setSwipeOffset(limitedDiff);
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
      if (swipeOffset < 0) {
        onPunch();
      } else {
        onRemove();
      }
    }
    
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  return (
    <div className="friend-card-container">
      {swipeOffset > 20 && (
        <div className="friend-action friend-action--remove">
          <span>{removeText}</span>
        </div>
      )}
      
      <div 
        className="friend-card"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={member.photo_url || `https://ui-avatars.com/api/?name=${member.first_name}`} 
          alt={member.first_name}
          className="friend-card__avatar"
        />
        <span className="friend-card__name">
          {member.first_name} {member.last_name}
        </span>
      </div>
      
      {swipeOffset < -20 && (
        <div className="friend-action friend-action--punch">
          <span>{punchText}</span>
        </div>
      )}
    </div>
  );
};

export default HabitDetail;