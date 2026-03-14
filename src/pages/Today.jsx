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
import { specialHabitsService } from '../services/specialHabits';
import "./Today.css";
import SwipeHint from '../components/habits/SwipeHint';
import EditHabitForm from '../components/habits/EditHabitForm';
import SubscriptionModal from '../components/modals/SubscriptionModal';
import Subscription from './Subscription';
import { useTranslation } from '../hooks/useTranslation';
import PullToRefresh from '../components/common/PullToRefresh';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import FabHint from '../components/hints/FabHint';
import WeekHint from '../components/hints/WeekHint';
import AddHabitMenu from '../components/modals/AddHabitMenu';
import SpecialHabitsShop from './SpecialHabitsShop';
import SpecialHabitPackDetail from './SpecialHabitPackDetail';
import SpecialHabitDetail from './SpecialHabitDetail';
import AchievementUnlockedPopup from '../components/modals/AchievementUnlockedPopup';
import BoredBear from "../components/habits/BoredBear";

const Today = ({ shouldShowFabHint = false, shouldShowSwipeHint = false, shouldShowFriendHint = false }) => {
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
    isFirstLoad,
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
  // Флаг «хинт уже закрыт в этой сессии» — блокирует повторный показ
  // даже если shouldShowSwipeHint prop всё ещё true (App.jsx не знает об этом)
  const swipeHintClosedRef = useRef(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showHabitDetail, setShowHabitDetail] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);
  const [showFabHint, setShowFabHint] = useState(false);
  const [showWeekHint, setShowWeekHint] = useState(false);

  // ── Special Habits state ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'special'
  const [showAddHabitMenu, setShowAddHabitMenu] = useState(false);
  const [showSpecialShop, setShowSpecialShop] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [showPackDetail, setShowPackDetail] = useState(false);
  const [specialHabits, setSpecialHabits] = useState([]);
  const [specialHabitsLoading, setSpecialHabitsLoading] = useState(false);
  const [selectedSpecialHabit, setSelectedSpecialHabit] = useState(null);
  const [showSpecialHabitDetail, setShowSpecialHabitDetail] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState([]);




    const groupHabitsByDayPeriod = (habits) => {
  const periods = {
    morning: [],
    afternoon: [],
    evening: [],
    night: []
  };
  
  habits.forEach(habit => {
    const period = habit.day_period || 'morning';
    if (periods[period]) {
      periods[period].push(habit);
    }
  });
  
  return periods;
};

const getDayPeriodInfo = (period) => {
  const info = {
    morning: { icon: '🌅', label: t('dayPeriod.morning') || 'Morning' },
    afternoon: { icon: '☀️', label: t('dayPeriod.afternoon') || 'Afternoon' },
    evening: { icon: '🌆', label: t('dayPeriod.evening') || 'Evening' },
    night: { icon: '🌙', label: t('dayPeriod.night') || 'Night' }
  };
  
  return info[period] || info.morning;
};




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

    const hasSeenWeekHint = localStorage.getItem('hasSeenWeekHint');
    if (!hasSeenWeekHint) {
      setTimeout(() => {
        setShowWeekHint(true);
        
        window.TelegramAnalytics?.track('week_hint_shown', {
          trigger: 'after_fab_hint'
        });
        console.log('📊 Analytics: week_hint_shown');
      }, 300);
    }
  };

  const handleWeekHintClose = () => {
    setShowWeekHint(false);
    localStorage.setItem('hasSeenWeekHint', 'true');
    
    window.TelegramAnalytics?.track('week_hint_closed', {});
    console.log('📊 Analytics: week_hint_closed');
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

  // ── Special habits loading ──────────────────────────────────────────────────
  const loadSpecialHabitsForDate = useCallback(async (date) => {
    setSpecialHabitsLoading(true);
    try {
      const data = await specialHabitsService.getSpecialHabitsForDate(date);
      setSpecialHabits(data.habits || []);
    } catch (err) {
      console.error('Failed to load special habits:', err);
      setSpecialHabits([]);
    } finally {
      setSpecialHabitsLoading(false);
    }
  }, []);

  // Load special habits whenever date changes AND special tab is active
  useEffect(() => {
    if (activeTab === 'special') {
      loadSpecialHabitsForDate(selectedDate);
    }
  }, [activeTab, selectedDate, loadSpecialHabitsForDate]);

  // ── Special habit mark / unmark ─────────────────────────────────────────────
  const handleSpecialMark = useCallback(async (habitId, status) => {
    if (!isEditableDate) return;

    // Optimistic update
    setSpecialHabits(prev => prev.map(h =>
      h.id === habitId ? { ...h, today_status: status } : h
    ));

    try {
      const result = await specialHabitsService.markSpecialHabit(habitId, status, selectedDate);

      if (result.newly_unlocked && result.newly_unlocked.length > 0) {
        setAchievementQueue(prev => [...prev, ...result.newly_unlocked]);
      }
    } catch (err) {
      console.error('Failed to mark special habit:', err);
      // Roll back on error
      await loadSpecialHabitsForDate(selectedDate);
    }

    // Re-fetch to get server truth
    await loadSpecialHabitsForDate(selectedDate);
  }, [isEditableDate, selectedDate, loadSpecialHabitsForDate]);

  const handleSpecialUnmark = useCallback(async (habitId) => {
    if (!isEditableDate) return;

    setSpecialHabits(prev => prev.map(h =>
      h.id === habitId ? { ...h, today_status: 'pending' } : h
    ));

    try {
      const result = await specialHabitsService.unmarkSpecialHabit(habitId, selectedDate);
      if (result.newly_unlocked && result.newly_unlocked.length > 0) {
        setAchievementQueue(prev => [...prev, ...result.newly_unlocked]);
      }
    } catch (err) {
      console.error('Failed to unmark special habit:', err);
    }

    await loadSpecialHabitsForDate(selectedDate);
  }, [isEditableDate, selectedDate, loadSpecialHabitsForDate]);

  // ── FAB click: show AddHabitMenu instead of direct CreateForm ───────────────
  const handleFabClick = async () => {
    setShowAddHabitMenu(true);
  };

  const handleMenuCustomHabit = async () => {
    setShowAddHabitMenu(false);
    const subscriptionStatus = await habitService.checkSubscriptionLimits();
    setUserSubscription(subscriptionStatus);

    window.TelegramAnalytics?.track('fab_clicked', {
      can_create_more: subscriptionStatus.canCreateMore,
      is_premium: subscriptionStatus.isPremium,
    });

    if (subscriptionStatus.canCreateMore) {
      setShowCreateForm(true);
    } else {
      setShowSubscriptionModal(true);
    }
  };

  const handleMenuSpecialHabits = () => {
    setShowAddHabitMenu(false);
    setShowSpecialShop(true);
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
    // ✅ ВСЕГДА загружаем свежие данные с сервера
    console.log(`🌐 Loading fresh data for ${date}`);
    
    // 🆕 Сначала инвалидируем кэш для этой даты
    habitService.invalidateHabitsCache();
    
    const result = await loadHabitsForDate(date);
    
    if (result) {
      console.log(`✅ Loaded ${result.habits?.length || 0} habits for ${date}`);
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
  
  // При первом рендере загружаем данные для сегодняшнего дня
  if (selectedDate === today && !dateDataCache[today]) {
    console.log('📥 Initial load: fetching today habits');
    
    const loadInitialData = async () => {
      setDateLoading(true);
      try {
        const result = await loadHabitsForDate(today);
        if (result) {
          updateDateCache(today, result);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setDateLoading(false);
      }
    };
    
    loadInitialData();
  }
}, []);

// ── Member-count polling ──────────────────────────────────────────────────
// Updates ONLY members_count in cached habits every 10 s — no full reload,
// no flicker, no swipe interruptions.
useEffect(() => {
  const poll = async () => {
    try {
      const res = await habitService.getMemberCounts();
      if (!res?.counts?.length) return;
      // Build a lookup map: habitId → members_count
      const map = {};
      res.counts.forEach(({ id, members_count }) => {
        map[id] = Number(members_count) || 0;
      });
      // Patch only changed habits inside every cached date
      setDateDataCache(prev => {
        let changed = false;
        const next = {};
        Object.entries(prev).forEach(([date, entry]) => {
          const nextHabits = entry.habits.map(h => {
            const fresh = map[h.id];
            if (fresh === undefined || fresh === h.members_count) return h;
            changed = true;
            return { ...h, members_count: fresh };
          });
          next[date] = changed ? { ...entry, habits: nextHabits } : entry;
        });
        return changed ? next : prev;
      });
    } catch { /* silent — polling shouldn't crash the UI */ }
  };

  const id = setInterval(poll, 10_000);
  // Also fire immediately on visibility restore
  const onVisible = () => {
    if (document.visibilityState === 'visible') poll();
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    clearInterval(id);
    document.removeEventListener('visibilitychange', onVisible);
  };
}, []);

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

    // Показываем swipe hint: только новым пользователям (shouldShowSwipeHint=true),
    // один раз за всё время (hint_swipe_shown), и не повторяем в рамках сессии (ref)
    const swipeShown = localStorage.getItem('hint_swipe_shown') === '1';
    if (shouldShowSwipeHint && !swipeShown && !swipeHintClosedRef.current && currentHabits.length > 0 && isEditableDate) {
      const timer = setTimeout(() => {
        setShowSwipeHint(true);
        window.TelegramAnalytics?.track('swipe_hint_shown', {
          habits_count: currentHabits.length,
        });
        console.log('📊 Analytics: swipe_hint_shown');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [dateDataCache, selectedDate, isEditableDate, shouldShowSwipeHint]);

  // SwipeHint закрывается — запоминаем в localStorage (на всё время) + ref (в рамках сессии)
  const handleSwipeHintClose = () => {
    swipeHintClosedRef.current = true;
    localStorage.setItem('hint_swipe_shown', '1');
    setShowSwipeHint(false);
  };

  // Оптимистично обновляет привычку в кэше без перезагрузки с сервера
  const applyOptimisticUpdate = useCallback((habitId, status, currentData) => {
    const updatedHabits = currentData.habits.map(h => {
      if (h.id !== habitId) return h;
      const wasCompleted  = h.today_status === 'completed';
      const isNowComplete = status === 'completed';
      // Оптимистично корректируем стрик (+1 если новый done, -1 если снимаем done)
      const streakDelta = (isNowComplete ? 1 : 0) - (wasCompleted ? 1 : 0);
      return {
        ...h,
        today_status:       status,
        is_completed_today: isNowComplete,
        streak_current:     Math.max(0, (h.streak_current || 0) + streakDelta),
      };
    });
    const newCompleted = updatedHabits.filter(h => h.today_status === 'completed').length;
    updateDateCache(selectedDate, {
      ...currentData,
      habits: updatedHabits,
      stats: { ...currentData.stats, completed: newCompleted },
    });
    return { updatedHabits, newCompleted };
  }, [selectedDate, updateDateCache]);

  // Тихая фоновая синхронизация — не показывает loader, обновляет кэш без мерцания
  const silentSync = useCallback((date, operationId) => {
    setTimeout(async () => {
      if (currentSwipeOperation.current && currentSwipeOperation.current !== operationId) return;
      const freshData = await loadHabitsForDate(date).catch(() => null);
      if (freshData && currentSwipeOperation.current === operationId) {
        updateDateCache(date, freshData);
      }
    }, 1500);
  }, [loadHabitsForDate, updateDateCache]);

  // Обработка свайпа — оптимистичное обновление + серверный запрос без перезагрузки
  const handleMark = useCallback(async (habitId, status) => {
    if (!isEditableDate) return;
    if (currentSwipeOperation.current) return;

    const operationId = `${selectedDate}-${habitId}-${status}-${Date.now()}`;
    currentSwipeOperation.current = operationId;

    const currentData = dateDataCache[selectedDate];
    if (!currentData) { currentSwipeOperation.current = null; return; }

    // 1️⃣ Мгновенное оптимистичное обновление UI — без ожидания сервера
    const { newCompleted } = applyOptimisticUpdate(habitId, status, currentData);

    try {
      // 2️⃣ Запрос на сервер (в фоне, UI уже обновлён)
      await markHabit(habitId, status, selectedDate);
      habitService.invalidateHabitsCache();

      // 3️⃣ Тихая синхронизация через 1.5с — исправляет streak с сервера без мерцания
      silentSync(selectedDate, operationId);

      window.TelegramAnalytics?.track('habit_marked', {
        habit_id: habitId, status, date: selectedDate,
        total_completed: newCompleted, total_habits: currentData.stats.total,
      });
    } catch (error) {
      console.error(`❌ Error marking habit ${habitId}:`, error);
      // Откат: восстанавливаем оригинальный статус
      updateDateCache(selectedDate, currentData);
    } finally {
      if (currentSwipeOperation.current === operationId) {
        currentSwipeOperation.current = null;
      }
    }
  }, [isEditableDate, selectedDate, markHabit, dateDataCache, applyOptimisticUpdate, silentSync, updateDateCache]);

  const handleUnmark = useCallback(async (habitId) => {
    if (!isEditableDate) return;
    if (currentSwipeOperation.current) return;

    const operationId = `${selectedDate}-${habitId}-unmark-${Date.now()}`;
    currentSwipeOperation.current = operationId;

    const currentData = dateDataCache[selectedDate];
    if (!currentData) { currentSwipeOperation.current = null; return; }

    // 1️⃣ Мгновенное оптимистичное обновление
    applyOptimisticUpdate(habitId, 'pending', currentData);

    try {
      // 2️⃣ Запрос на сервер
      await unmarkHabit(habitId, selectedDate);
      habitService.invalidateHabitsCache();

      // 3️⃣ Тихая синхронизация через 1.5с
      silentSync(selectedDate, operationId);

      window.TelegramAnalytics?.track('habit_unmarked', { habit_id: habitId, date: selectedDate });
    } catch (error) {
      console.error(`❌ Error unmarking habit ${habitId}:`, error);
      // Откат
      updateDateCache(selectedDate, currentData);
    } finally {
      if (currentSwipeOperation.current === operationId) {
        currentSwipeOperation.current = null;
      }
    }
  }, [isEditableDate, selectedDate, unmarkHabit, dateDataCache, applyOptimisticUpdate, silentSync, updateDateCache]);

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
        shouldShowFriendHint={shouldShowFriendHint}
      />
    );
  }

  if (showProfile) {
    return <Profile
      onClose={() => setShowProfile(false)}
      onOpenSpecialShop={() => { setShowProfile(false); setShowSpecialShop(true); }}
    />;
  }

  // ── Special Habits pages ─────────────────────────────────────────────────
  if (showSpecialHabitDetail && selectedSpecialHabit) {
    return (
      <SpecialHabitDetail
        habit={selectedSpecialHabit}
        onClose={() => {
          setShowSpecialHabitDetail(false);
          setSelectedSpecialHabit(null);
        }}
      />
    );
  }

  if (showPackDetail && selectedPack) {
    return (
      <SpecialHabitPackDetail
        pack={selectedPack}
        onClose={() => {
          setShowPackDetail(false);
          setSelectedPack(null);
          // Refresh special habits after potential purchase
          loadSpecialHabitsForDate(selectedDate);
        }}
        onGoToSpecialTab={() => {
          setShowPackDetail(false);
          setSelectedPack(null);
          setActiveTab('special');
          loadSpecialHabitsForDate(selectedDate);
        }}
      />
    );
  }

  if (showSpecialShop) {
    return (
      <SpecialHabitsShop
        onClose={() => setShowSpecialShop(false)}
        onPackSelect={(pack) => {
          setSelectedPack(pack);
          setShowPackDetail(true);
          setShowSpecialShop(false);
        }}
      />
    );
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

          {/* ── My / Special tab switcher ── */}
          <div className="today__tabs">
            <button
              className={`today__tab ${activeTab === 'special' ? 'today__tab--active' : ''}`}
              onClick={() => {
                setActiveTab('special');
                loadSpecialHabitsForDate(selectedDate);
              }}
            >
              {t('specialHabits.tabSpecial') || 'Special'}
            </button>
            <button
              className={`today__tab ${activeTab === 'my' ? 'today__tab--active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              {t('specialHabits.tabMy') || 'My'}
            </button>
          </div>

          {showReadOnlyNotice && (
            <div className="today__readonly-notice">
              <span>{t('todays.viewOnly')}</span>
            </div>
          )}

          {/* ── MY habits tab ── */}
          {activeTab === 'my' && (
            dateLoading ? (
              <div className="today__habits-loading">
                <HabitsSkeleton />
              </div>
            ) : displayHabits.length === 0 ? (
              // <EmptyState onCreateClick={() => handleFabClick()} />
              <BoredBear onCreateClick={() => handleFabClick()}/>
            ) : (
              <div className="today__habits">
                {(() => {
                  const groupedHabits = groupHabitsByDayPeriod(displayHabits);
                  const periods = ['morning', 'afternoon', 'evening', 'night'];
                  return periods.map(period => {
                    const habitsInPeriod = groupedHabits[period];
                    if (habitsInPeriod.length === 0) return null;
                    const periodInfo = getDayPeriodInfo(period);
                    return (
                      <div key={period} className="day-period-section">
                        <div className="day-period-header">
                          <h3 className="day-period-title">{periodInfo.label}</h3>
                          <span className="day-period-count">
                            {habitsInPeriod.filter(h => h.today_status === 'completed').length}/{habitsInPeriod.length}
                          </span>
                        </div>
                        <div className="day-period-habits">
                          {habitsInPeriod.map((habit) => (
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
                      </div>
                    );
                  });
                })()}
              </div>
            )
          )}

          {/* ── SPECIAL habits tab ── */}
          {activeTab === 'special' && (
            specialHabitsLoading ? (
              <div className="today__habits-loading"><HabitsSkeleton /></div>
            ) : specialHabits.length === 0 ? (
              <div className="today__special-empty">
                <p className="today__special-empty-icon">✨</p>
                <p className="today__special-empty-title">{t('specialHabits.emptyTitle') || 'No Special Habits Yet'}</p>
                <p className="today__special-empty-desc">{t('specialHabits.emptyDesc') || 'Purchase a Celebrity Habit Pack from the store'}</p>
                <button
                  className="today__special-empty-btn"
                  onClick={() => setShowSpecialShop(true)}
                >
                  {t('specialHabits.browseStore') || 'Browse Store'}
                </button>
              </div>
            ) : (
              <div className="today__habits">
                {(() => {
                  const groupedHabits = groupHabitsByDayPeriod(specialHabits);
                  const periods = ['morning', 'afternoon', 'evening', 'night'];
                  return periods.map(period => {
                    const habitsInPeriod = groupedHabits[period];
                    if (habitsInPeriod.length === 0) return null;
                    const periodInfo = getDayPeriodInfo(period);
                    return (
                      <div key={period} className="day-period-section">
                        <div className="day-period-header">
                          <h3 className="day-period-title">{periodInfo.label}</h3>
                          <span className="day-period-count">
                            {habitsInPeriod.filter(h => h.today_status === 'completed').length}/{habitsInPeriod.length}
                          </span>
                        </div>
                        <div className="day-period-habits">
                          {habitsInPeriod.map((habit) => (
                            <HabitCard
                              key={`special-${habit.id}-${selectedDate}-${habit.today_status}`}
                              habit={habit}
                              onMark={isEditableDate ? handleSpecialMark : undefined}
                              onUnmark={isEditableDate ? handleSpecialUnmark : undefined}
                              onClick={(h) => {
                                setSelectedSpecialHabit(h);
                                setShowSpecialHabitDetail(true);
                              }}
                              readOnly={!isEditableDate}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )
          )}
        </div>

        <FabHint show={showFabHint} onClose={handleFabHintClose} />
        <WeekHint show={showWeekHint} onClose={handleWeekHintClose} />

        <SwipeHint
          show={showSwipeHint}
          onClose={handleSwipeHintClose}
        />
        
        <button
          className={`fab ${showAddHabitMenu ? 'fab--open' : ''}`}
          onClick={showAddHabitMenu ? () => setShowAddHabitMenu(false) : handleFabClick}
        >
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

      {/* ── Add Habit bottom sheet menu ── */}
      <AddHabitMenu
        isOpen={showAddHabitMenu}
        onClose={() => setShowAddHabitMenu(false)}
        onCustomHabit={handleMenuCustomHabit}
        onSpecialHabits={handleMenuSpecialHabits}
      />

      {/* ── Achievement unlocked popup (queue-based) ── */}
      <AchievementUnlockedPopup
        achievement={achievementQueue[0] || null}
        onClose={() => setAchievementQueue(prev => prev.slice(1))}
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