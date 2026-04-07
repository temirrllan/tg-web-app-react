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
import SwipeGuide from '../components/hints/SwipeGuide';
import EditHabitForm from '../components/habits/EditHabitForm';
import SubscriptionModal from '../components/modals/SubscriptionModal';
import Subscription from './Subscription';
import { useTranslation } from '../hooks/useTranslation';
import PullToRefresh from '../components/common/PullToRefresh';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import FabHint from '../components/hints/FabHint';
import OnboardingGuide from '../components/hints/OnboardingGuide';
import WeekHint from '../components/hints/WeekHint';
import AddHabitMenu from '../components/modals/AddHabitMenu';
import SpecialHabitsShop from './SpecialHabitsShop';
import SpecialHabitPackDetail from './SpecialHabitPackDetail';
import SpecialHabitDetail from './SpecialHabitDetail';
import AchievementUnlockedPopup from '../components/modals/AchievementUnlockedPopup';
import BoredBear from "../components/habits/BoredBear";

const Today = ({ shouldShowFabHint = false, shouldShowSwipeHint = false, shouldShowFriendHint = false, pendingPackId = null, onPendingPackHandled = null }) => {
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
  const [showSwipeGuide, setShowSwipeGuide] = useState(false);
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
  const [showOnboarding, setShowOnboarding] = useState(false);
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




  // ── Deep link: auto-open pack by ID ──────────────────────────────────────
  useEffect(() => {
    if (!pendingPackId) return;
    console.log('📦 Auto-opening pack from deep link, id:', pendingPackId);
    setSelectedPack({ id: Number(pendingPackId) });
    setShowPackDetail(true);
    if (onPendingPackHandled) onPendingPackHandled();
  }, [pendingPackId, onPendingPackHandled]);

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

// Очистка кэша дат при смене языка
useEffect(() => {
  const handleLanguageChanged = () => {
    console.log('🌍 Language changed, clearing date cache...');
    setDateDataCache({});
  };
  window.addEventListener('language-changed', handleLanguageChanged);
  return () => window.removeEventListener('language-changed', handleLanguageChanged);
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

  // 🆕 Реф для отслеживания текущих операций свайпа (per-habit)
  const pendingSwipes = useRef(new Set());
  const silentSyncTimer = useRef(null);
  // 🆕 Version counter — инкрементируется при каждом оптимистичном обновлении
  // Если версия изменилась пока silentSync загружал данные — значит были новые свайпы,
  // и стейл данные с сервера НЕ должны перезаписывать оптимистичные обновления
  const optimisticVersion = useRef(0);

  // ✅ Stable refs для callbacks — чтобы HabitCard (React.memo) всегда вызывал актуальный код
  const handleMarkRef = useRef(null);
  const handleUnmarkRef = useRef(null);

  // ── Removal tracking ─────────────────────────────────────────────────────
  // Set of habit IDs (strings) currently playing their "leave" animation
  const [leavingHabitIds, setLeavingHabitIds] = useState(new Set());
  // Mirror of today's habits — updated on every dateDataCache change so the
  // poll callback can compare against it without a stale closure.
  const todayHabitsRef = useRef([]);
  // Stable ref so the interval callback always sees the latest poll function
  const pollMemberCountsRef = useRef(null);

  // Keep todayHabitsRef in sync so pollMemberCounts always sees fresh IDs
  useEffect(() => {
    const today = getTodayDate();
    todayHabitsRef.current = dateDataCache[today]?.habits || [];
  }, [dateDataCache]);

  useEffect(() => {
    if (shouldShowFabHint &&
        !loading &&
        !dateLoading &&
        (!dateDataCache[selectedDate]?.habits || dateDataCache[selectedDate].habits.length === 0)) {

      // Always show the interactive OnboardingGuide for new users
      const timer = setTimeout(() => {
        setShowOnboarding(true);
        window.TelegramAnalytics?.track('onboarding_shown', { trigger: 'new_user' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowFabHint, loading, dateLoading, dateDataCache, selectedDate]);





  
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboarding_done', '1');
    localStorage.setItem('hasSeenFabHint', 'true');
    localStorage.setItem('hasSeenWeekHint', 'true');
    window.TelegramAnalytics?.track('onboarding_completed');
  };

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
    console.log(`📦 updateDateCache for ${date}:`, {
      habits: data.habits?.length,
      statuses: data.habits?.map(h => `${h.id}:${h.today_status}`).join(', '),
      completed: data.stats?.completed,
      total: data.stats?.total,
      caller: new Error().stack?.split('\n')[2]?.trim()
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

// ── Member-count polling + removal detection ──────────────────────────────
// • Updates members_count badge in real-time (every 10 s or on-demand)
// • Detects if the current user was removed from a shared habit and
//   animates the card out immediately — no page reload needed.
const pollMemberCounts = useCallback(async () => {
  try {
    const res = await habitService.getMemberCounts();
    if (!res?.counts) return;

    // Build lookup: habitId(string) → members_count
    const map = {};
    const responseIds = new Set();
    res.counts.forEach(({ id, members_count }) => {
      const sid = String(id);
      map[sid] = Number(members_count) || 0;
      responseIds.add(sid);
    });

    // ── Removal detection ────────────────────────────────────────────
    // Compare what's currently shown in today's list vs what the server
    // returned.  Any habit that's in the UI but missing from member-counts
    // means the user was removed (or the habit was deleted).
    // todayHabitsRef is kept in sync by a separate useEffect above.
    const removedIds = todayHabitsRef.current
      .map(h => String(h.id))
      .filter(id => !responseIds.has(id));

    if (removedIds.length > 0) {
      // Start leave animation on all removed cards
      setLeavingHabitIds(prev => {
        const next = new Set(prev);
        removedIds.forEach(id => next.add(id));
        return next;
      });
      // After animation completes, purge from cache and clear the leaving set
      setTimeout(() => {
        setDateDataCache(prev => {
          const next = {};
          Object.entries(prev).forEach(([date, entry]) => {
            next[date] = {
              ...entry,
              habits: entry.habits.filter(h => !removedIds.includes(String(h.id)))
            };
          });
          return next;
        });
        setLeavingHabitIds(prev => {
          const next = new Set(prev);
          removedIds.forEach(id => next.delete(id));
          return next;
        });
      }, 600); // matches CSS animation duration
    }

    // ── Patch members_count for all cached dates ─────────────────────
    setDateDataCache(prev => {
      let changed = false;
      const next = {};
      Object.entries(prev).forEach(([date, entry]) => {
        let dateChanged = false;
        const nextHabits = entry.habits.map(h => {
          const fresh = map[String(h.id)];
          // ✅ FIX: Сравниваем как строки, т.к. API возвращает строки, а map — числа
          if (fresh === undefined || String(fresh) === String(h.members_count)) return h;
          dateChanged = true;
          changed = true;
          return { ...h, members_count: fresh };
        });
        next[date] = dateChanged ? { ...entry, habits: nextHabits } : entry;
      });
      return changed ? next : prev;
    });
  } catch { /* silent — polling must never crash the UI */ }
}, []);

// Keep the ref in sync so the interval always calls the latest closure
pollMemberCountsRef.current = pollMemberCounts;

useEffect(() => {
  const tick = () => pollMemberCountsRef.current();

  // First poll fires after habits have had a moment to load into dateDataCache.
  // 2 s delay avoids comparing against an empty ref on the very first render.
  const initialTimer = setTimeout(tick, 2_000);

  // Then poll every 4 s — fast enough to feel instant to the removed friend.
  const id = setInterval(tick, 4_000);

  const onVisible = () => {
    if (document.visibilityState === 'visible') tick();
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    clearTimeout(initialTimer);
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
    if (percentage >= 70) return t("todays.almostThere");
    if (percentage >= 50) return t("todays.greatProgress");

    return t("todays.keepGoing");
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

    // Показываем SwipeGuide: только новым пользователям (shouldShowSwipeHint=true),
    // один раз за всё время (hint_swipe_shown), и не повторяем в рамках сессии (ref)
    const swipeShown = localStorage.getItem('hint_swipe_shown') === '1';
    if (shouldShowSwipeHint && !swipeShown && !swipeHintClosedRef.current && currentHabits.length > 0 && isEditableDate) {
      const timer = setTimeout(() => {
        setShowSwipeGuide(true);
        window.TelegramAnalytics?.track('swipe_guide_shown', {
          habits_count: currentHabits.length,
        });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [dateDataCache, selectedDate, isEditableDate, shouldShowSwipeHint]);

  // SwipeGuide завершён — запоминаем
  const handleSwipeGuideComplete = () => {
    swipeHintClosedRef.current = true;
    localStorage.setItem('hint_swipe_shown', '1');
    setShowSwipeGuide(false);
  };

  // Reset first habit to pending (called by SwipeGuide after tutorial)
  const handleResetFirstHabit = useCallback(() => {
    const habits = dateDataCache[selectedDate]?.habits;
    if (habits && habits.length > 0) {
      const firstHabit = habits[0];
      if (firstHabit.today_status !== 'pending') {
        handleUnmarkRef.current?.(firstHabit.id);
      }
    }
  }, [dateDataCache, selectedDate]);

  // Legacy SwipeHint close (если где-то ещё используется)
  const handleSwipeHintClose = () => {
    swipeHintClosedRef.current = true;
    localStorage.setItem('hint_swipe_shown', '1');
    setShowSwipeHint(false);
  };

  // Оптимистично обновляет привычку в кэше без перезагрузки с сервера
  // ✅ КРИТИЧНО: Использует functional state update (prev =>) чтобы ВСЕГДА читать
  // актуальное состояние, даже если вызвано из stale closure (React.memo)
  const applyOptimisticUpdate = useCallback((habitId, status) => {
    let newCompleted = 0;
    // 🆕 Инкрементируем версию — silentSync проверит, не изменилась ли она
    optimisticVersion.current += 1;
    setDateDataCache(prev => {
      const currentData = prev[selectedDate];
      if (!currentData) return prev;

      // 🔍 DEBUG: Логируем состояние ПЕРЕД обновлением
      console.log(`🔄 applyOptimisticUpdate: habit=${habitId} → ${status}`);
      console.log(`   BEFORE:`, currentData.habits.map(h => `${h.id}:${h.today_status}`).join(', '));

      const updatedHabits = currentData.habits.map(h => {
        if (h.id !== habitId) return h;
        const wasCompleted  = h.today_status === 'completed';
        const isNowComplete = status === 'completed';
        const streakDelta = (isNowComplete ? 1 : 0) - (wasCompleted ? 1 : 0);
        return {
          ...h,
          today_status:       status,
          is_completed_today: isNowComplete,
          streak_current:     Math.max(0, (h.streak_current || 0) + streakDelta),
        };
      });
      newCompleted = updatedHabits.filter(h => h.today_status === 'completed').length;

      // 🔍 DEBUG: Логируем состояние ПОСЛЕ обновления
      console.log(`   AFTER:`, updatedHabits.map(h => `${h.id}:${h.today_status}`).join(', '));

      return {
        ...prev,
        [selectedDate]: {
          ...currentData,
          habits: updatedHabits,
          stats: { ...currentData.stats, completed: newCompleted },
          timestamp: Date.now()
        }
      };
    });
    return { newCompleted };
  }, [selectedDate]);

  // Тихая фоновая синхронизация — дебаунсированная, ждёт пока ВСЕ свайпы завершатся
  const silentSync = useCallback((date) => {
    // Сбрасываем предыдущий таймер — синхронизируем только после последней операции
    if (silentSyncTimer.current) clearTimeout(silentSyncTimer.current);
    silentSyncTimer.current = setTimeout(async () => {
      // Не синхронизируем если есть in-flight операции
      if (pendingSwipes.current.size > 0) return;
      // 🆕 Запоминаем версию ПЕРЕД загрузкой — если она изменится пока GET летит,
      // значит были новые свайпы и стейл данные нельзя применять
      const versionBefore = optimisticVersion.current;
      const freshData = await loadHabitsForDate(date).catch(() => null);
      // Повторная проверка после await — вдруг за это время начался новый свайп
      if (freshData && pendingSwipes.current.size === 0 && optimisticVersion.current === versionBefore) {
        updateDateCache(date, freshData);
      } else if (freshData && optimisticVersion.current !== versionBefore) {
        console.log('⚠️ silentSync: skipped stale data — optimistic updates happened during fetch');
      }
    }, 1500);
  }, [loadHabitsForDate, updateDateCache]);

  // Обработка свайпа — оптимистичное обновление + серверный запрос без перезагрузки
  const handleMark = useCallback(async (habitId, status) => {
    if (!isEditableDate) return;
    // Блокируем только повторный свайп на ТУ ЖЕ привычку, другие — не трогаем
    if (pendingSwipes.current.has(habitId)) return;
    pendingSwipes.current.add(habitId);

    // 1️⃣ Мгновенное оптимистичное обновление UI — без ожидания сервера
    // ✅ Использует functional state update — читает АКТУАЛЬНЫЙ стейт, не closure
    const { newCompleted } = applyOptimisticUpdate(habitId, status);

    try {
      // 2️⃣ Запрос на сервер (в фоне, UI уже обновлён)
      await markHabit(habitId, status, selectedDate);

      // 3️⃣ Тихая синхронизация — дебаунсированная, подождёт окончания всех свайпов
      silentSync(selectedDate);

      // Notify SwipeGuide about status change
      window.dispatchEvent(new CustomEvent('habit-status-change', {
        detail: { habitId, status }
      }));

      window.TelegramAnalytics?.track('habit_marked', {
        habit_id: habitId, status, date: selectedDate,
        total_completed: newCompleted,
      });
    } catch (error) {
      console.error(`❌ Error marking habit ${habitId}:`, error);
      // Откат: возвращаем привычку в pending
      applyOptimisticUpdate(habitId, 'pending');
    } finally {
      pendingSwipes.current.delete(habitId);
    }
  }, [isEditableDate, selectedDate, markHabit, applyOptimisticUpdate, silentSync]);

  const handleUnmark = useCallback(async (habitId) => {
    if (!isEditableDate) return;
    if (pendingSwipes.current.has(habitId)) return;
    pendingSwipes.current.add(habitId);

    // Сохраняем предыдущий статус для отката через functional read
    let prevStatus = 'completed';
    setDateDataCache(prev => {
      const h = prev[selectedDate]?.habits?.find(h => h.id === habitId);
      if (h) prevStatus = h.today_status;
      return prev; // не меняем стейт, только читаем
    });

    // 1️⃣ Мгновенное оптимистичное обновление
    applyOptimisticUpdate(habitId, 'pending');

    try {
      // 2️⃣ Запрос на сервер
      await unmarkHabit(habitId, selectedDate);

      // 3️⃣ Тихая синхронизация
      silentSync(selectedDate);

      // Notify SwipeGuide about status change
      window.dispatchEvent(new CustomEvent('habit-status-change', {
        detail: { habitId, status: 'pending' }
      }));

      window.TelegramAnalytics?.track('habit_unmarked', { habit_id: habitId, date: selectedDate });
    } catch (error) {
      console.error(`❌ Error unmarking habit ${habitId}:`, error);
      // Откат к предыдущему статусу
      applyOptimisticUpdate(habitId, prevStatus);
    } finally {
      pendingSwipes.current.delete(habitId);
    }
  }, [isEditableDate, selectedDate, unmarkHabit, applyOptimisticUpdate, silentSync]);

  // ✅ КРИТИЧНО: Stable callback wrappers через ref
  // HabitCard с React.memo может держать stale onMark/onUnmark.
  // Ref всегда указывает на актуальную функцию, а wrapper — стабильная ссылка.
  handleMarkRef.current = handleMark;
  handleUnmarkRef.current = handleUnmark;

  const stableHandleMark = useCallback(
    (habitId, status) => handleMarkRef.current(habitId, status),
    []
  );
  const stableHandleUnmark = useCallback(
    (habitId) => handleUnmarkRef.current(habitId),
    []
  );

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
        onMembersChanged={() => pollMemberCountsRef.current?.()}
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
          setShowSpecialShop(false);
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
                backgroundColor: getMotivationalBackgroundColor(),
                fontSize: `${getMotivationalMessage().length > 30 ? 13 : getMotivationalMessage().length > 22 ? 14 : 16}px`
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
                              key={`${habit.id}-${selectedDate}`}
                              habit={habit}
                              onMark={isEditableDate ? stableHandleMark : undefined}
                              onUnmark={isEditableDate ? stableHandleUnmark : undefined}
                              onClick={handleHabitClick}
                              readOnly={!isEditableDate}
                              isLeaving={leavingHabitIds.has(String(habit.id))}
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
                              isLeaving={leavingHabitIds.has(String(habit.id))}
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

        <OnboardingGuide show={showOnboarding} onComplete={handleOnboardingComplete} />
        <FabHint show={showFabHint} onClose={handleFabHintClose} />
        <WeekHint show={showWeekHint} onClose={handleWeekHintClose} />

        <SwipeGuide
          show={showSwipeGuide}
          onComplete={handleSwipeGuideComplete}
          onResetHabit={handleResetFirstHabit}
        />

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