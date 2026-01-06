// src/pages/Today.jsx - ИСПРАВЛЕНО: FabHint больше не зацикливается

import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import FabHint from '../components/hints/FabHint';

// 📊 Импорт новой системы аналитики
import { usePageView, usePageSession, useAnalytics, useErrorTracking } from '../hooks/useAnalytics';
import { EVENTS } from '../utils/analytics';

const Today = ({ shouldShowFabHint = false }) => {
  const { t } = useTranslation();
  const { user } = useTelegram();
  useTelegramTheme();

  // 📊 Инициализация аналитики
  const { track } = useAnalytics();
  const trackError = useErrorTracking('Today');

  // 📊 Автоматический трекинг просмотра страницы
  usePageView('today', { user_id: user?.id });

  const {
    todayHabits,
    stats,
    phrase,
    loading,
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
  const [showFabHint, setShowFabHint] = useState(false);

  // 🔥 КРИТИЧНО: Используем ref для отслеживания, была ли уже показана подсказка
  const fabHintShownRef = useRef(false);

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

  // 📊 Трекинг времени на странице с динамическими метаданными
  usePageSession('today', {
    habits_count: dateHabits.length,
    completed_count: dateStats.completed,
    selected_date: selectedDate,
  });

  // 🔥 ИСПРАВЛЕНО: Показываем FabHint только ОДИН раз
  useEffect(() => {
    console.log('🔍 FAB Hint check:', {
      shouldShowFabHint,
      loading,
      dateLoading,
      habitsCount: dateHabits.length,
      alreadyShown: fabHintShownRef.current
    });
    
    // Если подсказка уже была показана - НЕ показываем снова
    if (fabHintShownRef.current) {
      console.log('⏭️ FabHint already shown, skipping');
      return;
    }
    
    if (shouldShowFabHint && 
        !loading && 
        !dateLoading &&
        dateHabits.length === 0) {
      
      console.log('🎯 Showing FAB hint for new user (first time only)');
      
      const timer = setTimeout(() => {
        setShowFabHint(true);
        fabHintShownRef.current = true; // ✅ Отмечаем что показали
        
        // 📊 Аналитика
        track(EVENTS.INTERACTIONS.FAB_HINT_SHOWN, {
          is_new_user: true,
          habits_count: 0,
          trigger: 'after_onboarding'
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [shouldShowFabHint, loading, dateLoading, dateHabits.length, track]);

  const handleFabHintClose = () => {
    console.log('🔴 FabHint closing permanently');
    setShowFabHint(false);
    fabHintShownRef.current = true; // ✅ Убеждаемся что ref установлен
    localStorage.setItem('hasSeenFabHint', 'true');
    
    track('fab_hint_closed', {
      habits_count: dateHabits.length
    });
  };

  useEffect(() => {
    checkUserSubscription();
  }, []);

  const checkUserSubscription = async () => {
    try {
      const result = await habitService.checkSubscriptionLimits();
      setUserSubscription(result);
      
      // 📊 Трекинг статуса подписки
      track('subscription_status_checked', {
        is_premium: result.isPremium,
        habits_limit: result.limit,
        habits_count: result.habitsCount,
        can_create_more: result.canCreateMore,
      });
    } catch (error) {
      trackError(error, { context: 'checkUserSubscription' });
    }
  };

  const handleFabClick = async () => {
    const subscriptionStatus = await habitService.checkSubscriptionLimits();
    setUserSubscription(subscriptionStatus);
    
    track(EVENTS.INTERACTIONS.FAB_CLICKED, {
      can_create_more: subscriptionStatus.canCreateMore,
      current_habits_count: dateHabits.length,
      is_premium: subscriptionStatus.isPremium,
    });
    
    if (subscriptionStatus.canCreateMore) {
      setShowCreateForm(true);
      track(EVENTS.FORMS.CREATE_OPENED, {
        current_habits_count: dateHabits.length,
      });
    } else {
      setShowSubscriptionModal(true);
      track(EVENTS.SUBSCRIPTION.LIMIT_REACHED, {
        current_habits_count: dateHabits.length,
        limit: subscriptionStatus.limit,
      });
    }
  };

  const handleHabitClick = (habit) => {
    setSelectedHabit(habit);
    setShowHabitDetail(true);
    
    track(EVENTS.HABITS.CLICKED, {
      habit_id: habit.id,
      habit_name: habit.name,
      habit_emoji: habit.emoji,
      today_status: habit.today_status,
      is_completed: habit.today_status === 'completed',
    });
  };

  const handleEditHabit = (habit) => {
    setHabitToEdit(habit);
    setShowEditForm(true);
    setShowHabitDetail(false);
    
    track('habit_edit_started', {
      habit_id: habit.id,
      habit_name: habit.name,
    });
  };

  const handleEditSuccess = async () => {
    setShowEditForm(false);
    setHabitToEdit(null);
    await reloadCurrentDateHabits();
    
    track(EVENTS.HABITS.EDITED, {
      habit_id: habitToEdit?.id,
    });
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      await deleteHabit(habitId);
      setShowHabitDetail(false);
      setSelectedHabit(null);
      await reloadCurrentDateHabits();
      await checkUserSubscription();
      
      track(EVENTS.HABITS.DELETED, {
        habit_id: habitId,
        total_habits_after: dateHabits.length - 1,
      });
      
    } catch (error) {
      trackError(error, {
        context: 'habit_deletion',
        habit_id: habitId,
      });
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
      trackError(error, { context: 'reloadCurrentDateHabits' });
    } finally {
      setDateLoading(false);
    }
  }, [selectedDate, loadHabitsForDate, refresh, trackError]);

  const handleDateSelect = useCallback(async (date, isEditable) => {
    setSelectedDate(date);
    setIsEditableDate(isEditable);
    setDateLoading(true);
    
    track(EVENTS.NAVIGATION.DATE_CHANGED, {
      from_date: selectedDate,
      to_date: date,
      is_editable: isEditable,
      is_today: date === getTodayDate(),
      is_yesterday: date === getYesterdayDate(),
    });
    
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
  }, [selectedDate, loadHabitsForDate, track]);

  useEffect(() => {
    const today = getTodayDate();
    if (selectedDate === today && !dateLoading && !loading) {
      const habitsChanged = JSON.stringify(dateHabits) !== JSON.stringify(todayHabits);
      if (habitsChanged) {
        setDateHabits(todayHabits);
        setDateStats(stats);
        setDatePhrase(phrase);
      }
    }
  }, [todayHabits, stats, phrase, selectedDate, dateLoading, loading, dateHabits]);

  const handleRefresh = useCallback(async () => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
      
      track(EVENTS.INTERACTIONS.PULL_TO_REFRESH, {
        date: selectedDate,
        is_today: selectedDate === getTodayDate(),
      });
      
      await forceRefresh();
      
      if (selectedDate !== getTodayDate()) {
        await reloadCurrentDateHabits();
      }
    } catch (error) {
      trackError(error, { context: 'handleRefresh' });
    }
  }, [forceRefresh, selectedDate, reloadCurrentDateHabits, track, trackError]);

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

      track(EVENTS.HABITS.CREATED, {
        habit_name: habitData.name,
        habit_emoji: habitData.emoji,
        frequency: habitData.frequency,
        time: habitData.time,
        total_habits_count: currentCount,
        is_first_habit: currentCount === 1,
        has_reminder: !!habitData.time,
      });

    } catch (error) {
      trackError(error, {
        context: 'habit_creation',
        habit_name: habitData.name,
      });
    }
  };

  const handleSubscriptionPlanSelect = (plan) => {
    setSelectedSubscriptionPlan(plan);
    setShowSubscriptionModal(false);
    setShowSubscriptionPage(true);
    
    track(EVENTS.SUBSCRIPTION.PLAN_SELECTED, {
      plan: plan,
    });
  };

  const handleSubscriptionPageClose = async () => {
    setShowSubscriptionPage(false);
    setSelectedSubscriptionPlan(null);
    await checkUserSubscription();
    
    const updatedSubscription = await habitService.checkSubscriptionLimits();
    if (updatedSubscription && updatedSubscription.isPremium) {
      await reloadCurrentDateHabits();
      
      track(EVENTS.SUBSCRIPTION.ACTIVATED, {
        plan: selectedSubscriptionPlan,
        is_premium: true,
      });
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
          
          track(EVENTS.INTERACTIONS.SWIPE_HINT_SHOWN, {
            habits_count: dateHabits.length,
            is_first_time: !hasSeenHint,
          });
        }, 1000);
      }
      
      localStorage.setItem('previousHabitsCount', String(dateHabits.length));
    }
  }, [dateHabits.length, isEditableDate, track]);

  const handleMark = useCallback(async (habitId, status) => {
  if (!isEditableDate) return;
  
  try {
    // 🔍 Находим текущую привычку и её предыдущий статус
    const currentHabit = dateHabits.find(h => h.id === habitId);
    const previousStatus = currentHabit?.today_status || 'pending';
    
    console.log('📊 Marking habit:', {
      habitId,
      previousStatus,
      newStatus: status,
      currentCompleted: dateStats.completed
    });
    
    // ✅ Оптимистично обновляем UI
    setDateHabits(prev => 
      prev.map(h => h.id === habitId ? { ...h, today_status: status } : h)
    );
    
    // 🔢 ПРАВИЛЬНЫЙ подсчёт completed
    setDateStats(prev => {
      let newCompleted = prev.completed;
      
      // Если раньше было completed - уменьшаем
      if (previousStatus === 'completed') {
        newCompleted = Math.max(0, newCompleted - 1);
      }
      
      // Если новый статус completed - увеличиваем
      if (status === 'completed') {
        newCompleted = newCompleted + 1;
      }
      
      console.log('📊 Stats update:', {
        previous: prev.completed,
        new: newCompleted,
        total: prev.total
      });
      
      return { ...prev, completed: newCompleted };
    });
    
    // 🌐 Отправляем на сервер
    await markHabit(habitId, status, selectedDate);
    
    const today = getTodayDate();
    if (selectedDate === today) {
      // Для сегодня - обновление через useEffect
      console.log('✅ Updated today habits');
    } else {
      console.log(`✅ Habit ${habitId} marked as ${status} for ${selectedDate}`);
    }
    
    // 📊 Аналитика
    const finalStats = dateStats.completed + (status === 'completed' ? 1 : 0) - (previousStatus === 'completed' ? 1 : 0);
    
    track(EVENTS.HABITS.MARKED, {
      habit_id: habitId,
      status: status,
      previous_status: previousStatus,
      date: selectedDate,
      total_completed: finalStats,
      total_habits: dateStats.total,
      completion_rate: ((finalStats / dateStats.total) * 100).toFixed(1),
    });
    
    if (finalStats === dateStats.total && dateStats.total > 0) {
      track(EVENTS.ACHIEVEMENTS.ALL_COMPLETED, {
        date: selectedDate,
        total_habits: dateStats.total,
      });
    }
    
  } catch (error) {
    trackError(error, {
      context: 'habit_marking',
      habit_id: habitId,
    });
    await reloadCurrentDateHabits();
  }
}, [isEditableDate, selectedDate, markHabit, dateStats, dateHabits, reloadCurrentDateHabits, track, trackError]);

  const handleUnmark = useCallback(async (habitId) => {
  if (!isEditableDate) return;
  
  try {
    // 🔍 Находим текущую привычку и её предыдущий статус
    const currentHabit = dateHabits.find(h => h.id === habitId);
    const previousStatus = currentHabit?.today_status || 'pending';
    
    console.log('📊 Unmarking habit:', {
      habitId,
      previousStatus,
      currentCompleted: dateStats.completed
    });
    
    // ✅ Оптимистично обновляем UI
    setDateHabits(prev => 
      prev.map(h => h.id === habitId ? { ...h, today_status: 'pending' } : h)
    );
    
    // 🔢 ПРАВИЛЬНЫЙ подсчёт - уменьшаем только если было completed
    setDateStats(prev => {
      const newCompleted = previousStatus === 'completed' 
        ? Math.max(0, prev.completed - 1)
        : prev.completed;
      
      console.log('📊 Stats update (unmark):', {
        previous: prev.completed,
        new: newCompleted,
        wasCompleted: previousStatus === 'completed'
      });
      
      return { ...prev, completed: newCompleted };
    });
    
    // 🌐 Отправляем на сервер
    await unmarkHabit(habitId, selectedDate);
    
    const today = getTodayDate();
    if (selectedDate === today) {
      console.log('✅ Updated today habits');
    } else {
      console.log(`✅ Habit ${habitId} unmarked for ${selectedDate}`);
    }
    
    track(EVENTS.HABITS.UNMARKED, {
      habit_id: habitId,
      previous_status: previousStatus,
      date: selectedDate,
    });
    
  } catch (error) {
    trackError(error, {
      context: 'habit_unmarking',
      habit_id: habitId,
    });
    await reloadCurrentDateHabits();
  }
}, [isEditableDate, selectedDate, unmarkHabit, dateStats, dateHabits, reloadCurrentDateHabits, track, trackError]);

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
        
        {/* 🔥 FabHint показывается только если showFabHint === true */}
        <FabHint show={showFabHint} onClose={handleFabHintClose} />

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
          onClose={() => {
            setShowCreateForm(false);
            track(EVENTS.FORMS.CREATE_CLOSED, {
              was_cancelled: true,
            });
          }}
          onSuccess={handleCreateHabit}
        />
      )}

      {showEditForm && habitToEdit && (
        <EditHabitForm
          habit={habitToEdit}
          onClose={() => {
            setShowEditForm(false);
            setHabitToEdit(null);
            track(EVENTS.FORMS.EDIT_CLOSED, {
              was_cancelled: true,
              habit_id: habitToEdit?.id,
            });
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          track(EVENTS.SUBSCRIPTION.MODAL_CLOSED, {
            was_dismissed: true,
          });
        }}
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