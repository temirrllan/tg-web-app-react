// src/pages/Today.jsx - ИСПРАВЛЕНА ИЗОЛЯЦИЯ ДАННЫХ ПО ДАТАМ

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

const Today = ({ shouldShowFabHint = false }) => {
  const { t } = useTranslation();
  const { user } = useTelegram();
  useTelegramTheme();

  useEffect(() => {
    window.TelegramAnalytics?.track('page_view', {
      page: 'today',
      user_id: user?.id,
    });
    console.log('📊 Analytics: page_view - today');
  }, [user?.id]);

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
// 🆕 Очистка кэша при монтировании для гарантии свежих данных
useEffect(() => {
  console.log('🧹 Clearing date cache on mount to ensure fresh data');
  setDateDataCache({});
}, []);
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
  
  // 🆕 КРИТИЧНО: Отдельное хранилище данных для каждой даты
  const [dateDataCache, setDateDataCache] = useState({});
  
  const [dateLoading, setDateLoading] = useState(false);

  // 🆕 Реф для отслеживания текущей операции свайпа
  const currentSwipeOperation = useRef(null);

  useEffect(() => {
    console.log('🔍 FAB Hint check:', {
      shouldShowFabHint,
      loading,
      dateLoading,
      habitsCount: dateDataCache[selectedDate]?.habits?.length || 0
    });
    
    if (shouldShowFabHint && 
        !loading && 
        !dateLoading &&
        (!dateDataCache[selectedDate]?.habits || dateDataCache[selectedDate].habits.length === 0)) {
      
      console.log('🎯 Showing FAB hint for new user (ignoring localStorage)');
      
      const timer = setTimeout(() => {
        setShowFabHint(true);
        
        window.TelegramAnalytics?.track('fab_hint_shown', {
          is_new_user: true,
          habits_count: 0,
          trigger: 'after_onboarding'
        });
        console.log('📊 Analytics: fab_hint_shown (after onboarding)');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [shouldShowFabHint, loading, dateLoading, dateDataCache, selectedDate]);

  const handleFabHintClose = () => {
    setShowFabHint(false);
    localStorage.setItem('hasSeenFabHint', 'true');
    
    window.TelegramAnalytics?.track('fab_hint_closed', {
      habits_count: dateDataCache[selectedDate]?.habits?.length || 0
    });
    console.log('📊 Analytics: fab_hint_closed');
  };

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
    
    window.TelegramAnalytics?.track('fab_clicked', {
      can_create_more: subscriptionStatus.canCreateMore,
      current_habits_count: dateDataCache[selectedDate]?.habits?.length || 0,
      is_premium: subscriptionStatus.isPremium,
    });
    console.log('📊 Analytics: fab_clicked');
    
    if (subscriptionStatus.canCreateMore) {
      setShowCreateForm(true);
      
      window.TelegramAnalytics?.track('create_form_opened', {
        current_habits_count: dateDataCache[selectedDate]?.habits?.length || 0,
      });
      console.log('📊 Analytics: create_form_opened');
    } else {
      setShowSubscriptionModal(true);
      
      window.TelegramAnalytics?.track('subscription_limit_reached', {
        current_habits_count: dateDataCache[selectedDate]?.habits?.length || 0,
        limit: subscriptionStatus.limit,
      });
      console.log('📊 Analytics: subscription_limit_reached');
    }
  };

  const handleHabitClick = (habit) => {
    setSelectedHabit(habit);
    setShowHabitDetail(true);
    
    window.TelegramAnalytics?.track('habit_clicked', {
      habit_id: habit.id,
      habit_name: habit.name,
      habit_emoji: habit.emoji,
      today_status: habit.today_status,
      is_completed: habit.today_status === 'completed',
    });
    console.log('📊 Analytics: habit_clicked');
  };

  const handleEditHabit = (habit) => {
    setHabitToEdit(habit);
    setShowEditForm(true);
    setShowHabitDetail(false);
    
    window.TelegramAnalytics?.track('habit_edit_started', {
      habit_id: habit.id,
      habit_name: habit.name,
    });
    console.log('📊 Analytics: habit_edit_started');
  };

  const handleEditSuccess = async () => {
    setShowEditForm(false);
    setHabitToEdit(null);
    await reloadCurrentDateHabits();
    
    window.TelegramAnalytics?.track('habit_edited', {
      habit_id: habitToEdit?.id,
    });
    console.log('📊 Analytics: habit_edited');
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      await deleteHabit(habitId);
      setShowHabitDetail(false);
      setSelectedHabit(null);
      await reloadCurrentDateHabits();
      await checkUserSubscription();
      
      window.TelegramAnalytics?.track('habit_deleted', {
        habit_id: habitId,
        total_habits_after: (dateDataCache[selectedDate]?.habits?.length || 1) - 1,
      });
      console.log('📊 Analytics: habit_deleted');
      
    } catch (error) {
      console.error('Failed to delete habit:', error);
      
      window.TelegramAnalytics?.track('habit_deletion_failed', {
        habit_id: habitId,
        error: error.message,
      });
    }
  };

  // 🆕 КРИТИЧНО: Обновление данных СТРОГО для конкретной даты
  const updateDateCache = useCallback((date, data) => {
    console.log(`📦 Updating cache for date ${date}:`, {
      habits: data.habits?.length,
      completed: data.stats?.completed,
      total: data.stats?.total
    });
    
    setDateDataCache(prev => ({
      ...prev,
      [date]: {
        habits: data.habits || [],
        stats: data.stats || { completed: 0, total: 0 },
        phrase: data.phrase || null,
        timestamp: Date.now()
      }
    }));
  }, []);

  const reloadCurrentDateHabits = useCallback(async () => {
    console.log(`🔄 Reloading habits for date: ${selectedDate}`);
    setDateLoading(true);
    
    try {
      const result = await loadHabitsForDate(selectedDate);
      
      if (result) {
        updateDateCache(selectedDate, result);
        
        // Если это сегодня - также обновляем today cache
        const todayStr = getTodayDate();
        if (selectedDate === todayStr) {
          await refresh();
        }
      }
    } catch (error) {
      console.error('Failed to reload habits:', error);
    } finally {
      setDateLoading(false);
    }
  }, [selectedDate, loadHabitsForDate, refresh, updateDateCache]);

  const handleDateSelect = useCallback(async (date, isEditable) => {
  console.log(`📅 Date selected: ${date}, editable: ${isEditable}`);
  
  setSelectedDate(date);
  setIsEditableDate(isEditable);
  setDateLoading(true);
  
  try {
    // ✅ ВСЕГДА загружаем свежие данные с сервера (игнорируем кэш)
    console.log(`🌐 Always loading fresh data for ${date} (no cache)`);
    const result = await loadHabitsForDate(date);
    
    if (result) {
      updateDateCache(date, result);
    }
  } catch (error) {
    console.error(`Failed to load habits for date ${date}:`, error);
    updateDateCache(date, { 
      habits: [], 
      stats: { completed: 0, total: 0 },
      phrase: null
    });
  } finally {
    setDateLoading(false);
  }
}, [loadHabitsForDate, updateDateCache]);

  // 🆕 КРИТИЧНО: Синхронизация todayHabits в кэш ТОЛЬКО при первой загрузке
// 🆕 Синхронизация todayHabits ТОЛЬКО при первой загрузке (один раз)
useEffect(() => {
  const today = getTodayDate();
  
  if (!loading && selectedDate === today && todayHabits.length > 0) {
    const cached = dateDataCache[today];
    
    // Обновляем ТОЛЬКО если кэша нет совсем
    if (!cached) {
      console.log(`📥 Initial load: setting today cache from todayHabits`);
      
      updateDateCache(today, {
        habits: todayHabits,
        stats: stats,
        phrase: phrase
      });
    } else {
      console.log(`⏭️ Cache already exists for today, skipping sync`);
    }
  }
}, [loading, todayHabits.length]); // Только при изменении loading и количества

  const handleRefresh = useCallback(async () => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
      
      window.TelegramAnalytics?.track('pull_to_refresh', {
        date: selectedDate,
        is_today: selectedDate === getTodayDate(),
      });
      console.log('📊 Analytics: pull_to_refresh');
      
      // Очищаем кэш для текущей даты
      setDateDataCache(prev => {
        const newCache = { ...prev };
        delete newCache[selectedDate];
        return newCache;
      });
      
      await forceRefresh();
      
      if (selectedDate !== getTodayDate()) {
        await reloadCurrentDateHabits();
      }
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    }
  }, [forceRefresh, selectedDate, reloadCurrentDateHabits]);

  

  const handleCreateHabit = async (habitData) => {
    try {
      await createHabit(habitData);
      setShowCreateForm(false);
      
      // Очищаем кэш и перезагружаем
      setDateDataCache({});
      await reloadCurrentDateHabits();
      await checkUserSubscription();
      
      const currentCount = (dateDataCache[selectedDate]?.habits?.length || 0) + 1;
      if (currentCount === 1) {
        localStorage.removeItem('hasSeenSwipeHint');
      }

      window.TelegramAnalytics?.track('habit_created', {
        habit_name: habitData.name,
        habit_emoji: habitData.emoji,
        frequency: habitData.frequency,
        time: habitData.time,
        total_habits_count: currentCount,
        is_first_habit: currentCount === 1,
        has_reminder: !!habitData.time,
      });
      console.log('📊 Analytics: habit_created');

    } catch (error) {
      console.error("Failed to create habit:", error);
      
      window.TelegramAnalytics?.track('habit_creation_failed', {
        error: error.message,
        habit_name: habitData.name,
      });
    }
  };

  const handleSubscriptionPlanSelect = (plan) => {
    setSelectedSubscriptionPlan(plan);
    setShowSubscriptionModal(false);
    setShowSubscriptionPage(true);
    
    window.TelegramAnalytics?.track('subscription_plan_selected', {
      plan: plan,
    });
    console.log('📊 Analytics: subscription_plan_selected');
  };

  const handleSubscriptionPageClose = async () => {
    setShowSubscriptionPage(false);
    setSelectedSubscriptionPlan(null);
    await checkUserSubscription();
    
    const updatedSubscription = await habitService.checkSubscriptionLimits();
    if (updatedSubscription && updatedSubscription.isPremium) {
      // Очищаем кэш и перезагружаем
      setDateDataCache({});
      await reloadCurrentDateHabits();
      
      window.TelegramAnalytics?.track('subscription_activated', {
        plan: selectedSubscriptionPlan,
        is_premium: true,
      });
      console.log('📊 Analytics: subscription_activated');
    }
  };

  const getMotivationalMessage = () => {
    const currentData = dateDataCache[selectedDate];
    const currentPhrase = currentData?.phrase;
    const currentStats = currentData?.stats || { completed: 0, total: 0 };
    
    if (currentPhrase && currentPhrase.text) {
      return currentPhrase.text;
    }
    
    if (currentStats.total === 0) {
      return t('todays.createYourFirstHabit');
    }
    if (currentStats.completed === 0) {
      return t("todays.youCanDoIt");
    }
    if (currentStats.completed === currentStats.total) {
      return t("todays.allDoneAmazing");
    }
    
    const percentage = (currentStats.completed / currentStats.total) * 100;
    if (percentage >= 70) return t("habits.almostThere");
    if (percentage >= 50) return t("habits.greatProgress");
    
    return t("habits.keepGoing");
  };

  const getMotivationalEmoji = () => {
    const currentData = dateDataCache[selectedDate];
    const currentPhrase = currentData?.phrase;
    const currentStats = currentData?.stats || { completed: 0, total: 0 };
    
    if (currentPhrase && currentPhrase.emoji) {
      return currentPhrase.emoji;
    }
    
    if (currentStats.total === 0) return "🚀";
    if (currentStats.completed === 0) return "💪";
    if (currentStats.completed === currentStats.total) return "🎉";
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
    const currentHabits = dateDataCache[selectedDate]?.habits || [];
    const hasSeenHint = localStorage.getItem('hasSeenSwipeHint');
    const previousHabitsCount = parseInt(localStorage.getItem('previousHabitsCount') || '0');
    
    if (currentHabits.length > 0 && isEditableDate) {
      if (!hasSeenHint || (previousHabitsCount === 0 && currentHabits.length === 1)) {
        setTimeout(() => {
          setShowSwipeHint(true);
          localStorage.setItem('hasSeenSwipeHint', 'true');
          
          window.TelegramAnalytics?.track('swipe_hint_shown', {
            habits_count: currentHabits.length,
            is_first_time: !hasSeenHint,
          });
          console.log('📊 Analytics: swipe_hint_shown');
        }, 1000);
      }
      
      localStorage.setItem('previousHabitsCount', String(currentHabits.length));
    }
  }, [dateDataCache, selectedDate, isEditableDate]);

  // 🆕 КРИТИЧНО: Изолированная обработка свайпа с защитой от перекрёстных обновлений
  const handleMark = useCallback(async (habitId, status) => {
    if (!isEditableDate) return;
    
    // Защита от одновременных операций
    if (currentSwipeOperation.current) {
      console.log('⚠️ Another swipe operation in progress, skipping...');
      return;
    }
    
    const operationId = `${selectedDate}-${habitId}-${status}-${Date.now()}`;
    currentSwipeOperation.current = operationId;
    
    try {
      console.log(`🎯 [${operationId}] Marking habit ${habitId} as ${status} for date: ${selectedDate}`);
      
      // 1️⃣ Оптимистичное обновление ТОЛЬКО для текущей даты
      const currentData = dateDataCache[selectedDate];
      if (!currentData) {
        console.error('No data for current date');
        return;
      }
      
      const updatedHabits = currentData.habits.map(h => 
        h.id === habitId ? { ...h, today_status: status } : h
      );
      
      const newCompleted = updatedHabits.filter(h => h.today_status === 'completed').length;
      
      updateDateCache(selectedDate, {
        ...currentData,
        habits: updatedHabits,
        stats: { ...currentData.stats, completed: newCompleted }
      });
      
      // 2️⃣ Отправляем на сервер с ЯВНОЙ датой
      await markHabit(habitId, status, selectedDate);
      
      // 3️⃣ Перезагружаем данные ТОЛЬКО для текущей даты
      console.log(`🔄 [${operationId}] Reloading habits for selected date: ${selectedDate}`);
      const freshData = await loadHabitsForDate(selectedDate);
      
      if (freshData && currentSwipeOperation.current === operationId) {
        updateDateCache(selectedDate, freshData);
      }
      
      // 4️⃣ Если это сегодня - также обновляем today cache в фоне
      const today = getTodayDate();
      if (selectedDate === today) {
        refresh();
      }
      
      window.TelegramAnalytics?.track('habit_marked', {
        habit_id: habitId,
        status: status,
        date: selectedDate,
        total_completed: newCompleted,
        total_habits: currentData.stats.total,
      });
      
    } catch (error) {
      console.error(`❌ [${operationId}] Error marking habit:`, error);
      
      // Откатываем к данным с сервера
      const freshData = await loadHabitsForDate(selectedDate);
      if (freshData) {
        updateDateCache(selectedDate, freshData);
      }
    } finally {
      if (currentSwipeOperation.current === operationId) {
        currentSwipeOperation.current = null;
      }
    }
  }, [isEditableDate, selectedDate, markHabit, dateDataCache, loadHabitsForDate, refresh, updateDateCache]);

  const handleUnmark = useCallback(async (habitId) => {
    if (!isEditableDate) return;
    
    // Защита от одновременных операций
    if (currentSwipeOperation.current) {
      console.log('⚠️ Another swipe operation in progress, skipping...');
      return;
    }
    
    const operationId = `${selectedDate}-${habitId}-unmark-${Date.now()}`;
    currentSwipeOperation.current = operationId;
    
    try {
      console.log(`🎯 [${operationId}] Unmarking habit ${habitId} for date: ${selectedDate}`);
      
      // 1️⃣ Оптимистичное обновление
      const currentData = dateDataCache[selectedDate];
      if (!currentData) {
        console.error('No data for current date');
        return;
      }
      
      const updatedHabits = currentData.habits.map(h => 
        h.id === habitId ? { ...h, today_status: 'pending' } : h
      );
      
      const newCompleted = updatedHabits.filter(h => h.today_status === 'completed').length;
      
      updateDateCache(selectedDate, {
        ...currentData,
        habits: updatedHabits,
        stats: { ...currentData.stats, completed: newCompleted }
      });
      
      // 2️⃣ Отправляем на сервер
      await unmarkHabit(habitId, selectedDate);
      
      // 3️⃣ Перезагружаем данные
      console.log(`🔄 [${operationId}] Reloading habits for selected date: ${selectedDate}`);
      const freshData = await loadHabitsForDate(selectedDate);
      
      if (freshData && currentSwipeOperation.current === operationId) {
        updateDateCache(selectedDate, freshData);
      }
      
      // 4️⃣ Обновляем today cache если нужно
      const today = getTodayDate();
      if (selectedDate === today) {
        refresh();
      }
      
      window.TelegramAnalytics?.track('habit_unmarked', {
        habit_id: habitId,
        date: selectedDate,
      });
      
    } catch (error) {
      console.error(`❌ [${operationId}] Error unmarking habit:`, error);
      
      const freshData = await loadHabitsForDate(selectedDate);
      if (freshData) {
        updateDateCache(selectedDate, freshData);
      }
    } finally {
      if (currentSwipeOperation.current === operationId) {
        currentSwipeOperation.current = null;
      }
    }
  }, [isEditableDate, selectedDate, unmarkHabit, dateDataCache, loadHabitsForDate, refresh, updateDateCache]);

  const getMotivationalBackgroundColor = () => {
    const currentData = dateDataCache[selectedDate];
    const currentPhrase = currentData?.phrase;
    const currentStats = currentData?.stats || { completed: 0, total: 0 };
    
    if (currentPhrase && currentPhrase.backgroundColor) {
      return currentPhrase.backgroundColor;
    }
    
    if (currentStats.total === 0) return '#FFE4B5';
    if (currentStats.completed === 0) return '#FFB3BA';
    if (currentStats.completed === currentStats.total) return '#87CEEB';
    
    const percentage = (currentStats.completed / currentStats.total) * 100;
    if (percentage >= 70) return '#B5E7A0';
    if (percentage >= 50) return '#A7D96C';
    
    return '#FFB3BA';
  };

  useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const sessionDuration = Math.floor((Date.now() - startTime) / 1000);
      if (sessionDuration > 5) {
        window.TelegramAnalytics?.track('page_session_ended', {
          page: 'today',
          duration_seconds: sessionDuration,
          habits_count: dateDataCache[selectedDate]?.habits?.length || 0,
          completed_count: dateDataCache[selectedDate]?.stats?.completed || 0,
        });
      }
    };
  }, [dateDataCache, selectedDate]);

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

  // Получаем данные для текущей выбранной даты
  const currentDateData = dateDataCache[selectedDate] || { 
    habits: [], 
    stats: { completed: 0, total: 0 },
    phrase: null
  };
  
  const displayHabits = dateLoading ? [] : currentDateData.habits;
  const displayStats = currentDateData.stats;
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
            
            window.TelegramAnalytics?.track('create_form_closed', {
              was_cancelled: true,
            });
            console.log('📊 Analytics: create_form_closed');
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
            
            window.TelegramAnalytics?.track('edit_form_closed', {
              was_cancelled: true,
              habit_id: habitToEdit?.id,
            });
            console.log('📊 Analytics: edit_form_closed');
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          
          window.TelegramAnalytics?.track('subscription_modal_closed', {
            was_dismissed: true,
          });
          console.log('📊 Analytics: subscription_modal_closed');
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