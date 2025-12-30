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

// 🎨 Компонент круглого прогресс-бара с SVG
const CircularProgress = ({ value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="habit-detail__stat-circle" style={{ '--color': color, '--progress': percentage }}>
      <svg viewBox="0 0 100 100">
        {/* Фоновый круг */}
        <circle
          className="background"
          cx="50"
          cy="50"
          r={radius}
        />
        {/* Прогресс круг */}
        <circle
          className="progress"
          cx="50"
          cy="50"
          r={radius}
          style={{
            strokeDashoffset: strokeDashoffset
          }}
        />
      </svg>
      <span className="habit-detail__stat-value">{value}</span>
      {total > 0 && <span className="habit-detail__stat-total">{total}</span>}
    </div>
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
          yearTotal: 365
        });
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

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
              <CircularProgress
                value={statistics.currentStreak}
                total={0}
                color={getProgressColor('streak')}
              />
              <h3 className="habit-detail__stat-title">{t('habitDetail.statistics.daysStreak')}</h3>
              <p className="habit-detail__stat-subtitle">{t('habitDetail.statistics.daysStreak')}</p>
            </div>

            <div className="habit-detail__stat-card">
              <CircularProgress
                value={statistics.weekDays}
                total={statistics.weekTotal}
                color={getProgressColor('week')}
              />
              <h3 className="habit-detail__stat-title">{t('habitDetail.statistics.week')}</h3>
              <p className="habit-detail__stat-subtitle">{t('habitDetail.statistics.daysStreke')}</p>
            </div>

            <div className="habit-detail__stat-card">
              <CircularProgress
                value={statistics.monthDays}
                total={statistics.monthTotal}
                color={getProgressColor('month')}
              />
              <h3 className="habit-detail__stat-title">{t('habitDetail.statistics.month')}</h3>
              <p className="habit-detail__stat-subtitle">{t('habitDetail.statistics.daysStreak')}</p>
            </div>
            
            <div className="habit-detail__stat-card">
              <CircularProgress
                value={statistics.yearDays}
                total={statistics.yearTotal}
                color={getProgressColor('year')}
              />
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