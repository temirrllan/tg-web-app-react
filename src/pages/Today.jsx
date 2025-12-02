// src/pages/Today.jsx - МГНОВЕННАЯ ЗАГРУЗКА

import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/layout/Layout";
import Header from "../components/layout/Header";
import HabitCard from "../components/habits/HabitCard";
import EmptyState from "../components/habits/EmptyState";
import CreateHabitForm from "../components/habits/CreateHabitForm";
import WeekNavigation from "../components/habits/WeekNavigation";
import Profile from "./Profile";
import HabitDetail from './HabitDetail';
import { useHabits } from "../hooks/useHabits";
import { useTelegram } from "../hooks/useTelegram";
import { habitService } from '../services/habits';
import "./Today.css";
import SwipeHint from '../components/habits/SwipeHint';
import EditHabitForm from '../components/habits/EditHabitForm';
import SubscriptionModal from '../components/modals/SubscriptionModal';
import Subscription from './Subscription';
import { useTranslation } from '../hooks/useTranslation';
import PullToRefresh from '../components/common/PullToRefresh';

const Today = () => {
  const { t } = useTranslation();
  const { user } = useTelegram();
  
  const {
    todayHabits,
    stats,
    phrase,
    loading, // 🔥 Этот loading теперь почти всегда false
    markHabit,
    unmarkHabit,
    createHabit,
    deleteHabit,
    loadHabitsForDate,
    refresh,
    refreshDateData,
    forceRefresh
  } = useHabits();
  
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false);
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showHabitDetail, setShowHabitDetail] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [isEditableDate, setIsEditableDate] = useState(true);
  const [dateHabits, setDateHabits] = useState([]);
  const [dateLoading, setDateLoading] = useState(false);
  const [dateStats, setDateStats] = useState({ completed: 0, total: 0 });
  const [datePhrase, setDatePhrase] = useState(null);

  useEffect(() => {
    checkUserSubscription();
  }, []);

  const checkUserSubscription = async () => {
    try {
      const result = await habitService.checkSubscriptionLimits();
      setUserSubscription(result);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const handleFabClick = async () => {
    const subscriptionStatus = await habitService.checkSubscriptionLimits();
    setUserSubscription(subscriptionStatus);
    
    if (subscriptionStatus.canCreateMore) {
      setShowCreateForm(true);
    } else {
      setShowSubscriptionModal(true);
    }
  };

  const handleHabitClick = (habit) => {
    setSelectedHabit(habit);
    setShowHabitDetail(true);
  };

  const handleEditHabit = (habit) => {
    setHabitToEdit(habit);
    setShowEditForm(true);
    setShowHabitDetail(false);
  };

  const handleEditSuccess = async () => {
    setShowEditForm(false);
    setHabitToEdit(null);
    await reloadCurrentDateHabits();
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      await deleteHabit(habitId);
      setShowHabitDetail(false);
      setSelectedHabit(null);
      await reloadCurrentDateHabits();
      await checkUserSubscription();
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  const reloadCurrentDateHabits = useCallback(async () => {
    const todayStr = getTodayDate();
    setDateLoading(true);
    
    try {
      const result = await loadHabitsForDate(selectedDate);
      
      if (result) {
        setDateHabits(result.habits || []);
        setDateStats(result.stats || { completed: 0, total: 0 });
        setDatePhrase(result.phrase);
        
        if (selectedDate === todayStr) {
          await refresh();
        }
      }
    } catch (error) {
      console.error('Failed to reload habits:', error);
    } finally {
      setDateLoading(false);
    }
  }, [selectedDate, loadHabitsForDate, refresh]);

  const handleDateSelect = useCallback(async (date, isEditable) => {
    setSelectedDate(date);
    setIsEditableDate(isEditable);
    setDateLoading(true);
    
    try {
      const result = await loadHabitsForDate(date);
      
      if (result) {
        setDateHabits(result.habits || []);
        setDateStats(result.stats || { completed: 0, total: 0 });
        setDatePhrase(result.phrase);
      }
    } catch (error) {
      console.error(`Failed to load habits for date ${date}:`, error);
      setDateHabits([]);
      setDateStats({ completed: 0, total: 0 });
      setDatePhrase(null);
    } finally {
      setDateLoading(false);
    }
  }, [loadHabitsForDate]);

  useEffect(() => {
    const today = getTodayDate();
    if (selectedDate === today && !dateLoading && !loading) {
      setDateHabits(todayHabits);
      setDateStats(stats);
      setDatePhrase(phrase);
    }
  }, [todayHabits, stats, phrase, selectedDate, dateLoading, loading]);

  const handleRefresh = useCallback(async () => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
      
      await forceRefresh();
      
      if (selectedDate !== getTodayDate()) {
        await reloadCurrentDateHabits();
      }
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    }
  }, [forceRefresh, selectedDate, reloadCurrentDateHabits]);

  useEffect(() => {
    const today = getTodayDate();
    if (!loading) {
      setSelectedDate(today);
      setDateHabits(todayHabits);
      setDateStats(stats);
      setDatePhrase(phrase);
    }
  }, [loading, todayHabits, stats, phrase]);

  const handleCreateHabit = async (habitData) => {
    try {
      await createHabit(habitData);
      setShowCreateForm(false);
      await reloadCurrentDateHabits();
      await checkUserSubscription();
      
      const currentCount = todayHabits.length + 1;
      if (currentCount === 1) {
        localStorage.removeItem('hasSeenSwipeHint');
      }
    } catch (error) {
      console.error("Failed to create habit:", error);
    }
  };

  const handleSubscriptionPlanSelect = (plan) => {
    setSelectedSubscriptionPlan(plan);
    setShowSubscriptionModal(false);
    setShowSubscriptionPage(true);
  };

  const handleSubscriptionPageClose = async () => {
    setShowSubscriptionPage(false);
    setSelectedSubscriptionPlan(null);
    await checkUserSubscription();
    
    const updatedSubscription = await habitService.checkSubscriptionLimits();
    if (updatedSubscription && updatedSubscription.isPremium) {
      await reloadCurrentDateHabits();
    }
  };

  const getMotivationalMessage = () => {
    const currentPhrase = datePhrase;
    
    if (currentPhrase && currentPhrase.text) {
      return currentPhrase.text;
    }
    
    if (dateStats.total === 0) {
      return t('todays.createYourFirstHabit');
    }
    if (dateStats.completed === 0) {
      return t("todays.youCanDoIt");
    }
    if (dateStats.completed === dateStats.total) {
      return t("todays.allDoneAmazing");
    }
    
    const percentage = (dateStats.completed / dateStats.total) * 100;
    if (percentage >= 70) return t("habits.almostThere");
    if (percentage >= 50) return t("habits.greatProgress");
    
    return t("habits.keepGoing");
  };

  const getMotivationalEmoji = () => {
    if (datePhrase && datePhrase.emoji) {
      return datePhrase.emoji;
    }
    
    if (dateStats.total === 0) return "🚀";
    if (dateStats.completed === 0) return "💪";
    if (dateStats.completed === dateStats.total) return "🎉";
    return "✨";
  };

  const getDateLabel = () => {
    const todayStr = getTodayDate();
    const yesterdayStr = getYesterdayDate();
    
    if (selectedDate === todayStr) return t('todays.forToday');
    if (selectedDate === yesterdayStr) return t('todays.forYesterday');
    
    const [year, month, day] = selectedDate.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = date.getDate();
    
    return `${t('todays.for')} ${weekday} ${dayNumber}`;
  };

  const isCurrentWeekDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const getWeekStart = (d) => {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff));
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    };
    
    const getWeekEnd = (d) => {
      const weekStart = getWeekStart(new Date(d));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return weekEnd;
    };
    
    const weekStart = getWeekStart(new Date(today));
    const weekEnd = getWeekEnd(new Date(today));
    
    return date >= weekStart && date <= weekEnd;
  };

  useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenSwipeHint');
    const previousHabitsCount = parseInt(localStorage.getItem('previousHabitsCount') || '0');
    
    if (dateHabits.length > 0 && isEditableDate) {
      if (!hasSeenHint || (previousHabitsCount === 0 && dateHabits.length === 1)) {
        setTimeout(() => {
          setShowSwipeHint(true);
          localStorage.setItem('hasSeenSwipeHint', 'true');
        }, 1000);
      }
      
      localStorage.setItem('previousHabitsCount', String(dateHabits.length));
    }
  }, [dateHabits.length, isEditableDate]);

  const handleMark = useCallback(async (habitId, status) => {
    if (!isEditableDate) return;
    
    try {
      setDateHabits(prev => 
        prev.map(h => h.id === habitId ? { ...h, today_status: status } : h)
      );
      
      const newCompleted = status === 'completed' 
        ? dateStats.completed + 1 
        : dateStats.completed;
      setDateStats(prev => ({ ...prev, completed: newCompleted }));
      
      await markHabit(habitId, status, selectedDate);
    } catch (error) {
      console.error('Error marking habit:', error);
    }
  }, [isEditableDate, selectedDate, markHabit, dateStats]);

  const handleUnmark = useCallback(async (habitId) => {
    if (!isEditableDate) return;
    
    try {
      setDateHabits(prev => 
        prev.map(h => h.id === habitId ? { ...h, today_status: 'pending' } : h)
      );
      
      setDateStats(prev => ({ 
        ...prev, 
        completed: Math.max(0, prev.completed - 1) 
      }));
      
      await unmarkHabit(habitId, selectedDate);
    } catch (error) {
      console.error('Error unmarking habit:', error);
    }
  }, [isEditableDate, selectedDate, unmarkHabit]);

  const getMotivationalBackgroundColor = () => {
    if (datePhrase && datePhrase.backgroundColor) {
      return datePhrase.backgroundColor;
    }
    
    if (dateStats.total === 0) return '#FFE4B5';
    if (dateStats.completed === 0) return '#FFB3BA';
    if (dateStats.completed === dateStats.total) return '#87CEEB';
    
    const percentage = (dateStats.completed / dateStats.total) * 100;
    if (percentage >= 70) return '#B5E7A0';
    if (percentage >= 50) return '#A7D96C';
    
    return '#FFB3BA';
  };

  // 🔥 УБИРАЕМ LOADER - показываем контент сразу
  if (showSubscriptionPage) {
    return (
      <Subscription
        onClose={handleSubscriptionPageClose}
        preselectedPlan={selectedSubscriptionPlan}
      />
    );
  }

  if (showHabitDetail && selectedHabit) {
    return (
      <HabitDetail
        habit={selectedHabit}
        onClose={() => {
          setShowHabitDetail(false);
          setSelectedHabit(null);
        }}
        onEdit={handleEditHabit}
        onDelete={handleDeleteHabit}
      />
    );
  }

  if (showProfile) {
    return <Profile onClose={() => setShowProfile(false)} />;
  }

  const displayHabits = dateLoading ? [] : dateHabits;
  const displayStats = dateStats;
  const showReadOnlyNotice = !isEditableDate && isCurrentWeekDate(selectedDate);

  return (
    <>
      <Layout>
        <PullToRefresh onRefresh={handleRefresh}>
          <Header user={user} onProfileClick={() => setShowProfile(true)} />

          <div className="today">
            <div className="today__stats">
              <div className="today__container">
                <h2 className="today__title">{t('todays.completed')}</h2>
                <span className="today__count">
                  {displayStats.completed} {t('todays.outof')} {displayStats.total} {t('todays.Habits')}
                </span>
              </div>

              <div className="today__container2">
                <p className="today__subtitle">{getDateLabel()}</p>
                <div className="today__motivation" style={{ 
                  backgroundColor: getMotivationalBackgroundColor() 
                }}>
                  {getMotivationalMessage()} {getMotivationalEmoji()}
                </div>
              </div>
            </div>

            <WeekNavigation 
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />

            {showReadOnlyNotice && (
              <div className="today__readonly-notice">
                <span>{t('todays.viewOnly')}</span>
              </div>
            )}

            {dateLoading ? (
              <div className="today__habits-loading">
                <HabitsSkeleton />
              </div>
            ) : displayHabits.length === 0 ? (
              <EmptyState onCreateClick={() => handleFabClick()} />
            ) : (
              <div className="today__habits">
                {displayHabits.map((habit) => (
                  <HabitCard
                    key={`${habit.id}-${selectedDate}-${habit.today_status}`}
                    habit={habit}
                    onMark={isEditableDate ? handleMark : undefined}
                    onUnmark={isEditableDate ? handleUnmark : undefined}
                    onClick={handleHabitClick}
                    readOnly={!isEditableDate}
                  />
                ))}
              </div>
            )}
          </div>
        </PullToRefresh>
        
        <SwipeHint 
          show={showSwipeHint} 
          onClose={() => setShowSwipeHint(false)} 
        />
        
        <button className="fab" onClick={handleFabClick}>
          +
        </button>
      </Layout>

      {showCreateForm && (
        <CreateHabitForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateHabit}
        />
      )}

      {showEditForm && habitToEdit && (
        <EditHabitForm
          habit={habitToEdit}
          onClose={() => {
            setShowEditForm(false);
            setHabitToEdit(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSelectPlan={handleSubscriptionPlanSelect}
      />
    </>
  );
};

const HabitsSkeleton = () => (
  <div className="habits-skeleton">
    {[1, 2, 3].map(i => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-icon"></div>
        <div className="skeleton-content">
          <div className="skeleton-title"></div>
          <div className="skeleton-goal"></div>
        </div>
      </div>
    ))}
  </div>
);

export default Today;