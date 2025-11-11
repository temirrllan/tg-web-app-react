// HabitDetail.jsx - УПРОЩЕННАЯ И ИСПРАВЛЕННАЯ ВЕРСИЯ

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

const HabitDetail = ({ habit, onClose, onEdit, onDelete }) => {
  const { tg, user: currentUser } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [showFriendHint, setShowFriendHint] = useState(false);
  const [toast, setToast] = useState(null);
  const [friendLimitData, setFriendLimitData] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const { t } = useTranslation();

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

  // ✅ УЛУЧШЕННАЯ ПРОВЕРКА: Определяем isCreator
  useEffect(() => {
    const checkCreatorStatus = () => {
      if (!currentUser) {
        console.log('❌ No current user');
        setIsCreator(false);
        return;
      }

      const userDbId = localStorage.getItem('user_id');
      
      if (!userDbId) {
        console.error('❌ No user_id in localStorage');
        setIsCreator(false);
        return;
      }

      console.log('🔍 Checking creator status:', {
        userDbId,
        habit_creator_id: habit.creator_id,
        habit_user_id: habit.user_id,
        ownerInfo_creator_id: ownerInfo?.creator_id
      });

      // Метод 1: Проверка через ownerInfo (самый надёжный)
      if (ownerInfo?.creator_id) {
        const isOwner = String(userDbId) === String(ownerInfo.creator_id);
        console.log(`✅ Method 1 (ownerInfo): ${isOwner ? 'IS CREATOR' : 'NOT CREATOR'}`);
        setIsCreator(isOwner);
        return;
      }

      // Метод 2: Проверка через habit.creator_id
      if (habit.creator_id !== undefined && habit.creator_id !== null) {
        const isOwner = String(userDbId) === String(habit.creator_id);
        console.log(`✅ Method 2 (habit.creator_id): ${isOwner ? 'IS CREATOR' : 'NOT CREATOR'}`);
        setIsCreator(isOwner);
        return;
      }

      // Метод 3: Fallback на habit.user_id
      if (habit.user_id !== undefined && habit.user_id !== null) {
        const isOwner = String(userDbId) === String(habit.user_id);
        console.log(`✅ Method 3 (habit.user_id fallback): ${isOwner ? 'IS CREATOR' : 'NOT CREATOR'}`);
        setIsCreator(isOwner);
        return;
      }

      console.log('⚠️ Could not determine creator status, defaulting to false');
      setIsCreator(false);
    };

    checkCreatorStatus();
  }, [currentUser, habit, ownerInfo]);

  // Telegram BackButton logic
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

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadOwnerInfo(),
        loadStatistics(),
        loadMembers(),
        checkFriendLimit()
      ]);
    };
    
    loadData();
  }, [habit.id]);

  const loadOwnerInfo = async () => {
    try {
      console.log('🔄 Loading owner info for habit:', habit.id);
      const info = await habitService.getHabitOwner(habit.id);
      console.log('📊 Owner info received:', info);
      setOwnerInfo(info);
    } catch (error) {
      console.error('Failed to load owner info:', error);
    }
  };

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
    } catch (error) {
      console.error('Failed to check friend limit:', error);
    }
  };

  const handleAddFriend = async () => {
    console.log('Add Friend clicked, checking limits...');
    
    const limitCheck = await habitService.checkFriendLimit(habit.id);
    setFriendLimitData(limitCheck);
    
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
      
      const shareText = `Join my "${habit.title}" habit!\n\n📝 Goal: ${habit.goal}\n\nLet's build better habits together! 💪`;
      const shareUrl = `https://t.me/CheckHabitlyBot/habittracker?startapp=join_${shareCode}`;
      
      const hasSeenFriendHint = localStorage.getItem('hasSeenFriendHint');
      if (!hasSeenFriendHint && members.length === 0) {
        setTimeout(() => {
          setShowFriendHint(true);
          localStorage.setItem('hasSeenFriendHint', 'true');
        }, 2000);
      }
      
      if (tg?.openTelegramLink) {
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        tg.openTelegramLink(telegramShareUrl);
      } else {
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(telegramShareUrl, '_blank');
      }
      
      setToast({
        message: 'Share link created! 🎉',
        type: 'success'
      });
    } catch (error) {
      console.error('❌ Failed to create share link:', error);
      setToast({
        message: 'Failed to create share link. Please try again.',
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
          window.Telegram.WebApp.showAlert('Premium activated! Now you can invite unlimited friends! 🎉');
        }
        
        setTimeout(() => {
          handleShare();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to activate premium:', error);
      setShowSubscriptionModal(false);
      
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert('Failed to activate premium. Please try again.');
      }
    }
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
      }
    } catch (error) {
      console.error('Failed to send punch:', error);
      setToast({
        message: 'Failed to send punch. Please try again.',
        type: 'error'
      });
    }
  };

  const handleRemoveFriend = async (memberId) => {
    try {
      if (tg?.showConfirm) {
        tg.showConfirm('Remove this friend from the habit?', async (confirmed) => {
          if (confirmed) {
            await habitService.removeMember(habit.id, memberId);
            await loadMembers();
            await checkFriendLimit();
            setToast({
              message: 'Friend removed from habit',
              type: 'success'
            });
          }
        });
      } else {
        const confirmed = window.confirm('Remove this friend from the habit?');
        if (confirmed) {
          await habitService.removeMember(habit.id, memberId);
          await loadMembers();
          await checkFriendLimit();
          setToast({
            message: 'Friend removed from habit',
            type: 'success'
          });
        }
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
      setToast({
        message: 'Failed to remove friend. Please try again.',
        type: 'error'
      });
    }
  };

  // ✅ ОБРАБОТЧИК РЕДАКТИРОВАНИЯ
  const handleEditClick = async () => {
    console.log('🖊️ Edit button clicked');
    console.log('isCreator:', isCreator);
    console.log('ownerInfo:', ownerInfo);
    
    if (!isCreator) {
      console.log('❌ User is not creator, showing warning');
      
      setToast({
        message: 'Only the habit creator can edit this habit',
        type: 'warning'
      });
      
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
      return;
    }
    
    console.log('✅ User is creator, allowing edit');
    
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
              
              {/* ✅ КНОПКА РЕДАКТИРОВАНИЯ - показывается только создателю */}
              {isCreator && (
                <button 
                  className="habit-detail__edit-btn"
                  onClick={handleEditClick}
                >
                  Edit
                </button>
              )}
            </div>
            
            {habit.goal && (
              <p className="habit-detail__habit-goal">{habit.goal}</p>
            )}
            
            {/* ℹ️ УВЕДОМЛЕНИЕ для участников (не создателей) */}
            {!isCreator && members.length > 0 && (
              <div className="habit-detail__creator-notice">
                <p>ℹ️ This is a shared habit. Only the creator can edit it.</p>
                {ownerInfo?.creator_name && (
                  <p>Creator: <strong>{ownerInfo.creator_name}</strong></p>
                )}
              </div>
            )}
          </div>

          {/* Статистика */}
          <div className="habit-detail__statistics">
            <div className="habit-detail__stat-card">
              <div className="habit-detail__stat-circle" style={{
                '--progress': getProgressPercentage(statistics.currentStreak, 100),
                '--color': getProgressColor('streak')
              }}>
                <span className="habit-detail__stat-value">{statistics.currentStreak}</span>
              </div>
              <h3 className="habit-detail__stat-title">Days Strike</h3>
              <p className="habit-detail__stat-subtitle">Days Strike</p>
            </div>

            <div className="habit-detail__stat-card">
              <div className="habit-detail__stat-circle" style={{
                '--progress': getProgressPercentage(statistics.weekDays, statistics.weekTotal),
                '--color': getProgressColor('week')
              }}>
                <span className="habit-detail__stat-value">{statistics.weekDays}</span>
                <span className="habit-detail__stat-total">{statistics.weekTotal}</span>
              </div>
              <h3 className="habit-detail__stat-title">Week</h3>
              <p className="habit-detail__stat-subtitle">Days Strike</p>
            </div>

            <div className="habit-detail__stat-card">
              <div className="habit-detail__stat-circle" style={{
                '--progress': getProgressPercentage(statistics.monthDays, statistics.monthTotal),
                '--color': getProgressColor('month')
              }}>
                <span className="habit-detail__stat-value">{statistics.monthDays}</span>
                <span className="habit-detail__stat-total">{statistics.monthTotal}</span>
              </div>
              <h3 className="habit-detail__stat-title">Month</h3>
              <p className="habit-detail__stat-subtitle">Days Strike</p>
            </div>

            <div className="habit-detail__stat-card">
              <div className="habit-detail__stat-circle" style={{
                '--progress': getProgressPercentage(statistics.yearDays, statistics.yearTotal),
                '--color': getProgressColor('year')
              }}>
                <span className="habit-detail__stat-value">{statistics.yearDays}</span>
                <span className="habit-detail__stat-total">{statistics.yearTotal}</span>
              </div>
              <h3 className="habit-detail__stat-title">Year</h3>
              <p className="habit-detail__stat-subtitle">Days Strike</p>
            </div>
          </div>

          <div className="habit-detail__motivation">
            <p className="habit-detail__motivation-text">
              Good Job My Friend! 🔥
            </p>
          </div>

          {/* Друзья */}
          <div className="habit-detail__friends">
            <h3 className="habit-detail__friends-title">Habit Friends</h3>
            
            {friendLimitData && !friendLimitData.isPremium && (
              <p style={{
                fontSize: '13px',
                color: '#8E8E93',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                {friendLimitData.currentFriendsCount}/{friendLimitData.limit} friend{friendLimitData.limit !== 1 ? 's' : ''} added (Free plan)
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
                    canRemove={isCreator}
                  />
                ))}
              </div>
            ) : (
              <p className="habit-detail__friends-subtitle">
                Share the link with friends and invite them to track habits together.
              </p>
            )}
            
            {/* Кнопка "Add Friend" показывается только создателю */}
            {isCreator && (
              <button 
                className="habit-detail__btn habit-detail__btn--add-friend"
                onClick={handleAddFriend}
              >
                Add Friend
              </button>
            )}
          </div>

          {/* Кнопка удаления показывается только создателю */}
          {isCreator && (
            <button 
              className="habit-detail__btn habit-detail__btn--danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Remove Habit
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

// ✅ КОМПОНЕНТ КАРТОЧКИ ДРУГА С ПОДДЕРЖКОЙ canRemove
const FriendCard = ({ member, onPunch, onRemove, canRemove = true }) => {
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
      } else if (canRemove) {
        onRemove();
      }
    }
    
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  return (
    <div className="friend-card-container">
      {canRemove && swipeOffset > 20 && (
        <div className="friend-action friend-action--remove">
          <span>Remove</span>
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
          <span>👊 Punch</span>
        </div>
      )}
    </div>
  );
};

export default HabitDetail;