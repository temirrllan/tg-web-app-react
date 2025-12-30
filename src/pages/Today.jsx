// src/pages/Today.jsx - С ПОЛНОЙ АНАЛИТИКОЙ

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
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import FabHint from '../components/hints/FabHint';
import WeekNavigationHint from '../components/hints/WeekNavigationHint';

const Today = ({ shouldShowFabHint = false }) => {
  const { t } = useTranslation();
  const { user } = useTelegram();
  useTelegramTheme();

  // 📊 Отслеживание просмотра страницы при монтировании
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
const [fabHintShown, setFabHintShown] = useState(false);
const [showWeekHint, setShowWeekHint] = useState(false); // 🆕
const [weekHintShown, setWeekHintShown] = useState(false); // 🆕


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
  console.log('🔍 FAB Hint check:', {
    shouldShowFabHint,
    loading,
    dateLoading,
    habitsCount: dateHabits.length,
    fabHintShown
  });
  
  // Показываем FAB hint только если пришел флаг И нет привычек И hint еще не показывали
  if (shouldShowFabHint && 
      !loading && 
      !dateLoading &&
      dateHabits.length === 0 &&
      !fabHintShown) {
    
    console.log('🎯 Showing FAB hint for new user');
    
    const timer = setTimeout(() => {
      setShowFabHint(true);
      setFabHintShown(true);
      
      // 📊 Аналитика
      window.TelegramAnalytics?.track('fab_hint_shown', {
        is_new_user: true,
        habits_count: 0,
        trigger: 'after_onboarding'
      });
      console.log('📊 Analytics: fab_hint_shown (after onboarding)');
    }, 500);
    
    return () => clearTimeout(timer);
  }
}, [shouldShowFabHint, loading, dateLoading, dateHabits.length, fabHintShown]);
useEffect(() => {
  console.log('🔍 Week Navigation Hint check:', {
    habitsCount: dateHabits.length,
    loading,
    dateLoading,
    weekHintShown,
    fabHintShown
  });
  
  // Показываем Week hint если:
  // 1. Есть хотя бы одна привычка
  // 2. Не показываем сейчас FAB hint
  // 3. Week hint еще не показывали
  // 4. Данные загружены
  if (dateHabits.length > 0 && 
      !showFabHint && 
      !weekHintShown && 
      !loading && 
      !dateLoading &&
      fabHintShown) { // Показываем только если FAB hint уже был показан
    
    console.log('🎯 Showing Week Navigation hint');
    
    const timer = setTimeout(() => {
      setShowWeekHint(true);
      setWeekHintShown(true);
      
      // 📊 Аналитика
      window.TelegramAnalytics?.track('week_hint_shown', {
        habits_count: dateHabits.length,
        trigger: 'after_first_habit'
      });
      console.log('📊 Analytics: week_hint_shown');
    }, 800); // Небольшая задержка для плавности
    
    return () => clearTimeout(timer);
  }
}, [dateHabits.length, showFabHint, weekHintShown, loading, dateLoading, fabHintShown]);

  // 🆕 Обработчик закрытия FAB hint
  const handleFabHintClose = () => {
  console.log('✅ FAB hint closed');
  setShowFabHint(false);
  
  // ✅ Сохраняем в localStorage только ПОСЛЕ закрытия
  localStorage.setItem('hasSeenFabHint', 'true');
  
  // 📊 Аналитика
  window.TelegramAnalytics?.track('fab_hint_closed', {
    habits_count: dateHabits.length
  });
  console.log('📊 Analytics: fab_hint_closed');
  
  // 🎯 НЕ показываем Week hint сразу - только после создания привычки
};

const handleWeekHintClose = () => {
  console.log('✅ Week Navigation hint closed');
  setShowWeekHint(false);
  
  // ✅ Сохраняем в localStorage
  localStorage.setItem('hasSeenWeekHint', 'true');
  
  // 📊 Аналитика
  window.TelegramAnalytics?.track('week_hint_closed', {
    habits_count: dateHabits.length
  });
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

  const handleFabClick = async () => {
    const subscriptionStatus = await habitService.checkSubscriptionLimits();
    setUserSubscription(subscriptionStatus);
    
    // 📊 Отслеживание клика на FAB
    window.TelegramAnalytics?.track('fab_clicked', {
      can_create_more: subscriptionStatus.canCreateMore,
      current_habits_count: dateHabits.length,
      is_premium: subscriptionStatus.isPremium,
    });
    console.log('📊 Analytics: fab_clicked');
    
    if (subscriptionStatus.canCreateMore) {
      setShowCreateForm(true);
      
      // 📊 Форма создания открыта
      window.TelegramAnalytics?.track('create_form_opened', {
        current_habits_count: dateHabits.length,
      });
      console.log('📊 Analytics: create_form_opened');
    } else {
      setShowSubscriptionModal(true);
      
      // 📊 Показан лимит подписки
      window.TelegramAnalytics?.track('subscription_limit_reached', {
        current_habits_count: dateHabits.length,
        limit: subscriptionStatus.limit,
      });
      console.log('📊 Analytics: subscription_limit_reached');
    }
  };

  const handleHabitClick = (habit) => {
    setSelectedHabit(habit);
    setShowHabitDetail(true);
    
    // 📊 Отслеживание клика на привычку
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
    
    // 📊 Отслеживание начала редактирования
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
    
    // 📊 Успешное редактирование
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
      
      // 📊 Успешное удаление
      window.TelegramAnalytics?.track('habit_deleted', {
        habit_id: habitId,
        total_habits_after: dateHabits.length - 1,
      });
      console.log('📊 Analytics: habit_deleted');
      
    } catch (error) {
      console.error('Failed to delete habit:', error);
      
      // 📊 Ошибка удаления
      window.TelegramAnalytics?.track('habit_deletion_failed', {
        habit_id: habitId,
        error: error.message,
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
      console.error('Failed to reload habits:', error);
    } finally {
      setDateLoading(false);
    }
  }, [selectedDate, loadHabitsForDate, refresh]);

  const handleDateSelect = useCallback(async (date, isEditable) => {
    setSelectedDate(date);
    setIsEditableDate(isEditable);
    setDateLoading(true);
    
    // 📊 Отслеживание смены даты
    window.TelegramAnalytics?.track('date_changed', {
      from_date: selectedDate,
      to_date: date,
      is_editable: isEditable,
      is_today: date === getTodayDate(),
      is_yesterday: date === getYesterdayDate(),
    });
    console.log('📊 Analytics: date_changed');
    
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
  }, [selectedDate, loadHabitsForDate]);

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
      
      // 📊 Отслеживание обновления
      window.TelegramAnalytics?.track('pull_to_refresh', {
        date: selectedDate,
        is_today: selectedDate === getTodayDate(),
      });
      console.log('📊 Analytics: pull_to_refresh');
      
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

      // 📊 Успешное создание привычки
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
      
      // 📊 Ошибка создания
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
    
    // 📊 Выбран план подписки
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
      await reloadCurrentDateHabits();
      
      // 📊 Подписка активирована
      window.TelegramAnalytics?.track('subscription_activated', {
        plan: selectedSubscriptionPlan,
        is_premium: true,
      });
      console.log('📊 Analytics: subscription_activated');
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
          
          // 📊 Показана подсказка свайпа
          window.TelegramAnalytics?.track('swipe_hint_shown', {
            habits_count: dateHabits.length,
            is_first_time: !hasSeenHint,
          });
          console.log('📊 Analytics: swipe_hint_shown');
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
      
      // 📊 Привычка отмечена
      window.TelegramAnalytics?.track('habit_marked', {
        habit_id: habitId,
        status: status,
        date: selectedDate,
        total_completed: newCompleted,
        total_habits: dateStats.total,
        completion_rate: ((newCompleted / dateStats.total) * 100).toFixed(1),
      });
      console.log('📊 Analytics: habit_marked', status);
      
      // 📊 Все привычки выполнены
      if (newCompleted === dateStats.total && dateStats.total > 0) {
        window.TelegramAnalytics?.track('all_habits_completed', {
          date: selectedDate,
          total_habits: dateStats.total,
        });
        console.log('📊 Analytics: all_habits_completed');
      }
      
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
      
      // 📊 Привычка снята с отметки
      window.TelegramAnalytics?.track('habit_unmarked', {
        habit_id: habitId,
        date: selectedDate,
      });
      console.log('📊 Analytics: habit_unmarked');
      
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

  // 📊 Отслеживание времени на странице
  useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const sessionDuration = Math.floor((Date.now() - startTime) / 1000);
      if (sessionDuration > 5) { // Отслеживаем только если >5 секунд
        window.TelegramAnalytics?.track('page_session_ended', {
          page: 'today',
          duration_seconds: sessionDuration,
          habits_count: dateHabits.length,
          completed_count: dateStats.completed,
        });
      }
    };
  }, [dateHabits.length, dateStats.completed]);

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
        {/* <PullToRefresh onRefresh={handleRefresh}> */}
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
        {/* </PullToRefresh> */}
                <FabHint show={showFabHint} onClose={handleFabHintClose} />
        
        <WeekNavigationHint show={showWeekHint} onClose={handleWeekHintClose} />
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
            
            // 📊 Форма закрыта без создания
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
            
            // 📊 Форма редактирования закрыта
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
          
          // 📊 Модал подписки закрыт
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