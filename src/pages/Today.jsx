import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/layout/Layout";
import Header from "../components/layout/Header";
import HabitCard from "../components/habits/HabitCard";
import EmptyState from "../components/habits/EmptyState";
import CreateHabitForm from "../components/habits/CreateHabitForm";
import WeekNavigation from "../components/habits/WeekNavigation";
import Profile from "./Profile";
import HabitDetail from './HabitDetail';
import Loader from "../components/common/Loader";
import { useHabitsOptimized as useHabits } from '../hooks/useHabitsOptimized';
import { useTelegram } from "../hooks/useTelegram";
import { habitService } from '../services/habits';
import "./Today.css";
import SwipeHint from '../components/habits/SwipeHint';
import EditHabitForm from '../components/habits/EditHabitForm';
import SubscriptionModal from '../components/modals/SubscriptionModal';
import Subscription from './Subscription';
import { useTranslation } from '../hooks/useTranslation';

const Today = () => {
    const { t } = useTranslation();

  const { user } = useTelegram();
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
    refreshDateData
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
  // После всех useState определений добавьте:
useEffect(() => {
  const handleOpenSubscription = () => {
    setShowSubscriptionPage(true);
  };

  window.addEventListener('openSubscriptionPage', handleOpenSubscription);
  
  return () => {
    window.removeEventListener('openSubscriptionPage', handleOpenSubscription);
  };
}, []);
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

  // Проверяем подписку при загрузке
  useEffect(() => {
    checkUserSubscription();
  }, []);

  const checkUserSubscription = async () => {
    try {
      const result = await habitService.checkSubscriptionLimits();
      setUserSubscription(result);
      console.log('User subscription status:', result);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  // Обработчик нажатия на FAB кнопку
  const handleFabClick = async () => {
    console.log('FAB clicked, checking subscription...');
    
    // Проверяем актуальные лимиты
    const subscriptionStatus = await habitService.checkSubscriptionLimits();
    setUserSubscription(subscriptionStatus);
    
    console.log('Subscription status:', subscriptionStatus);
    
    // Если пользователь может создавать привычки - открываем форму
    if (subscriptionStatus.canCreateMore) {
      setShowCreateForm(true);
    } else {
      // Иначе показываем модалку подписки
      console.log('Limit reached, showing subscription modal');
      setShowSubscriptionModal(true);
    }
  };

  // Обработчик клика на привычку
  const handleHabitClick = (habit) => {
    console.log('Habit clicked:', habit);
    setSelectedHabit(habit);
    setShowHabitDetail(true);
  };

  // Обработчик редактирования
  const handleEditHabit = (habit) => {
    console.log('Edit habit:', habit);
    setHabitToEdit(habit);
    setShowEditForm(true);
    setShowHabitDetail(false);
  };

  // Обработчик успешного редактирования
 // Обработчик успешного редактирования
const handleEditSuccess = async () => {
  setShowEditForm(false);
  setHabitToEdit(null);
  
  // Перезагружаем данные для текущей выбранной даты
  await reloadCurrentDateHabits();
  
  // Показываем уведомление об успешном обновлении
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }
  
  // ВАЖНО: После редактирования обновления автоматически применятся
  // у всех участников через webhook уведомления от бота
  console.log('✅ Habit updated successfully. Notifications sent to all members.');
};

  const handleDeleteHabit = async (habitId) => {
    try {
      console.log('Deleting habit:', habitId);
      await deleteHabit(habitId);
      setShowHabitDetail(false);
      setSelectedHabit(null);
      
      // Перезагружаем данные для текущей выбранной даты
      await reloadCurrentDateHabits();
      
      // Обновляем статус подписки после удаления
      await checkUserSubscription();
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  // КРИТИЧНО: Функция перезагрузки привычек для текущей даты
  const reloadCurrentDateHabits = useCallback(async () => {
    const todayStr = getTodayDate();
    
    console.log(`Reloading habits for selected date: ${selectedDate}`);
    setDateLoading(true);
    
    try {
      // ВСЕГДА загружаем с сервера для любой даты
      const result = await loadHabitsForDate(selectedDate);
      
      if (result) {
        setDateHabits(result.habits || []);
        setDateStats(result.stats || { completed: 0, total: 0 });
        setDatePhrase(result.phrase);
        
        // Если это сегодня, также обновляем основной хук
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

  // КРИТИЧНО: Обработчик выбора даты
  const handleDateSelect = useCallback(async (date, isEditable) => {
    console.log('Date selected:', date, 'isEditable:', isEditable);
    
    // Сохраняем выбранную дату
    setSelectedDate(date);
    setIsEditableDate(isEditable);
    
    // Начинаем загрузку
    setDateLoading(true);
    
    try {
      // ВСЕГДА загружаем с сервера для любой даты
      console.log(`Loading data from server for date: ${date}`);
      const result = await loadHabitsForDate(date);
      
      if (result) {
        setDateHabits(result.habits || []);
        setDateStats(result.stats || { completed: 0, total: 0 });
        setDatePhrase(result.phrase);
        
        console.log(`Loaded ${result.habits?.length || 0} habits for ${date}:`, {
          date: date,
          statuses: result.habits?.map(h => ({
            id: h.id,
            title: h.title,
            status: h.today_status
          }))
        });
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

  // При изменении todayHabits обновляем dateHabits ТОЛЬКО если выбран сегодня
  useEffect(() => {
    const today = getTodayDate();
    if (selectedDate === today && !dateLoading && !loading) {
      console.log('Updating TODAY display from hook');
      setDateHabits(todayHabits);
      setDateStats(stats);
      setDatePhrase(phrase);
    }
  }, [todayHabits, stats, phrase, selectedDate, dateLoading, loading]);

  // Инициализация при загрузке
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
      console.log('Creating new habit:', habitData);
      await createHabit(habitData);
      setShowCreateForm(false);
      
      // Перезагружаем данные для текущей выбранной даты
      await reloadCurrentDateHabits();
      
      // Обновляем статус подписки после создания
      await checkUserSubscription();
      
      // Проверяем, нужно ли показать подсказку о свайпах
      const currentCount = todayHabits.length + 1;
      if (currentCount === 1) {
        localStorage.removeItem('hasSeenSwipeHint');
        console.log('First habit created, hint will be shown');
      }
    } catch (error) {
      console.error("Failed to create habit:", error);
    }
  };

  // Обработчик выбора плана в модалке
  const handleSubscriptionPlanSelect = (plan) => {
    console.log('Plan selected in modal:', plan);
    setSelectedSubscriptionPlan(plan);
    setShowSubscriptionModal(false);
    setShowSubscriptionPage(true);
  };

  // Обработчик закрытия страницы подписки
  // Обработчик закрытия страницы подписки
const handleSubscriptionPageClose = async () => {
  console.log('🔒 Closing subscription page');
  
  setShowSubscriptionPage(false);
  setSelectedSubscriptionPlan(null);
  
  // Обновляем статус подписки
  await checkUserSubscription();
  
  // ВАЖНО: НЕ открываем форму создания привычки автоматически
  // Пользователь вернётся на главный экран Today
  
  // Если пользователь стал premium, показываем уведомление
  const updatedSubscription = await habitService.checkSubscriptionLimits();
  if (updatedSubscription && updatedSubscription.isPremium) {
    console.log('✅ User is now premium');
    
    // Перезагружаем привычки на сегодня
    await reloadCurrentDateHabits();
  }
};

  const getMotivationalMessage = () => {
    const currentStats = dateStats;
    const currentPhrase = datePhrase;
    
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
    if (percentage >= 70) {
      return t("habits.almostThere");
    }
    if (percentage >= 50) {
      return t("habits.greatProgress");
    }
    
    return t("habits.keepGoing");
  };

  const getMotivationalEmoji = () => {
    const currentPhrase = datePhrase;
    
    if (currentPhrase && currentPhrase.emoji) {
      return currentPhrase.emoji;
    }
    
    const currentStats = dateStats;
    if (currentStats.total === 0) return "🚀";
    if (currentStats.completed === 0) return "💪";
    if (currentStats.completed === currentStats.total) return "🎉";
    return "✨";
  };

  const getDateLabel = () => {
    const todayStr = getTodayDate();
    const yesterdayStr = getYesterdayDate();
    
    if (selectedDate === todayStr) {
      return t('todays.forToday');
    }
    
    if (selectedDate === yesterdayStr) {
      return t('todays.forYesterday');
    }
    
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

  // КРИТИЧНО: Обработчики с передачей даты
  const handleMark = useCallback(async (habitId, status) => {
    if (!isEditableDate) {
      console.log('Cannot edit habits for this date');
      return;
    }
    
    console.log('Marking habit:', { habitId, status, date: selectedDate });
    
    try {
      // КРИТИЧНО: Передаем дату в markHabit
      await markHabit(habitId, status, selectedDate);
      
      // ВАЖНО: Перезагружаем данные ТОЛЬКО для выбранной даты
      await reloadCurrentDateHabits();
    } catch (error) {
      console.error('Error marking habit:', error);
    }
  }, [isEditableDate, selectedDate, markHabit, reloadCurrentDateHabits]);

  const handleUnmark = useCallback(async (habitId) => {
    if (!isEditableDate) {
      console.log('Cannot edit habits for this date');
      return;
    }
    
    console.log('Unmarking habit:', { habitId, date: selectedDate });
    
    try {
      // КРИТИЧНО: Передаем дату в unmarkHabit
      await unmarkHabit(habitId, selectedDate);
      
      // ВАЖНО: Перезагружаем данные ТОЛЬКО для выбранной даты
      await reloadCurrentDateHabits();
    } catch (error) {
      console.error('Error unmarking habit:', error);
    }
  }, [isEditableDate, selectedDate, unmarkHabit, reloadCurrentDateHabits]);

  const getMotivationalBackgroundColor = () => {
    const currentPhrase = datePhrase;
    
    if (currentPhrase && currentPhrase.backgroundColor) {
      return currentPhrase.backgroundColor;
    }
    
    const currentStats = dateStats;
    
    if (currentStats.total === 0) return '#FFE4B5';
    if (currentStats.completed === 0) return '#FFB3BA';
    if (currentStats.completed === currentStats.total) return '#87CEEB';
    
    const percentage = (currentStats.completed / currentStats.total) * 100;
    if (percentage >= 70) return '#B5E7A0';
    if (percentage >= 50) return '#A7D96C';
    
    return '#FFB3BA';
  };

  // Показываем загрузку
  // if (loading) {
  //   return (
  //     <Layout>
  //       <div className="today-loading">
  //         <Loader size="large" />
  //       </div>
  //     </Layout>
  //   );
  // }

  // Показываем страницу подписки если нужно
  if (showSubscriptionPage) {
    return (
      <Subscription
        onClose={handleSubscriptionPageClose}
        preselectedPlan={selectedSubscriptionPlan}
      />
    );
  }

  // Показываем детальную страницу привычки
  if (showHabitDetail && selectedHabit) {
    console.log('Rendering HabitDetail with habit:', selectedHabit);
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

  // Показываем профиль
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
              <span>
                {t('todays.viewOnly')}
              </span>
            </div>
          )}

          {dateLoading ? (
            <div className="today__habits-loading">
              <Loader size="medium" />
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

export default Today;