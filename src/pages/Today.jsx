import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import Header from "../components/layout/Header";
import HabitCard from "../components/habits/HabitCard";
import EmptyState from "../components/habits/EmptyState";
import CreateHabitForm from "../components/habits/CreateHabitForm";
import WeekNavigation from "../components/habits/WeekNavigation";
import Profile from "./Profile";
import HabitDetail from './HabitDetail';
import Loader from "../components/common/Loader";
import { useHabits } from "../hooks/useHabits";
import { useTelegram } from "../hooks/useTelegram";
import { habitService } from '../services/habits';
import "./Today.css";
import SwipeHint from '../components/habits/SwipeHint';
import EditHabitForm from '../components/habits/EditHabitForm';
import SubscriptionModal from '../components/modals/SubscriptionModal';

const Today = () => {
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
    refresh
  } = useHabits();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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
  
  // ВАЖНО: Удаляем dateCache - он больше не нужен, каждый раз загружаем свежие данные

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
  const handleEditSuccess = async () => {
    setShowEditForm(false);
    setHabitToEdit(null);
    
    // Перезагружаем привычки для текущей даты
    await reloadCurrentDateHabits();
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      console.log('Deleting habit:', habitId);
      await deleteHabit(habitId);
      setShowHabitDetail(false);
      setSelectedHabit(null);
      
      // Перезагружаем привычки для текущей даты
      await reloadCurrentDateHabits();
      
      // Обновляем статус подписки после удаления
      await checkUserSubscription();
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  // Вспомогательная функция для перезагрузки привычек текущей даты
  const reloadCurrentDateHabits = async () => {
    const todayStr = getTodayDate();
    
    if (selectedDate === todayStr) {
      await refresh();
      setDateHabits(todayHabits);
      setDateStats(stats);
    } else {
      const result = await loadHabitsForDate(selectedDate);
      if (result) {
        setDateHabits(result.habits || []);
        setDateStats(result.stats || { completed: 0, total: 0 });
      }
    }
  };

  // Обработчик выбора даты - ПОЛНОСТЬЮ ПЕРЕПИСАН
  const handleDateSelect = async (date, isEditable) => {
    console.log('handleDateSelect:', date, 'isEditable:', isEditable);
    
    // Сохраняем выбранную дату
    setSelectedDate(date);
    setIsEditableDate(isEditable);
    
    const todayStr = getTodayDate();
    
    // Сбрасываем текущие привычки перед загрузкой новых
    setDateHabits([]);
    setDateStats({ completed: 0, total: 0 });
    setDateLoading(true);
    
    try {
      if (date === todayStr) {
        // Для сегодня используем данные из хука
        await refresh(); // Обновляем данные
        setDateHabits(todayHabits);
        setDateStats(stats);
      } else {
        // Для других дней ВСЕГДА загружаем с сервера
        const result = await loadHabitsForDate(date);
        if (result) {
          setDateHabits(result.habits || []);
          setDateStats(result.stats || { completed: 0, total: 0 });
          
          console.log('Loaded habits from server:', {
            date,
            habitsCount: result.habits?.length,
            stats: result.stats,
            habits: result.habits
          });
        }
      }
    } catch (error) {
      console.error('Failed to load habits for date:', error);
      setDateHabits([]);
      setDateStats({ completed: 0, total: 0 });
    } finally {
      setDateLoading(false);
    }
  };

  // При изменении todayHabits обновляем dateHabits ТОЛЬКО если выбран сегодня
  useEffect(() => {
    const today = getTodayDate();
    if (selectedDate === today && !dateLoading) {
      setDateHabits(todayHabits);
      setDateStats(stats);
    }
  }, [todayHabits, stats, selectedDate, dateLoading]);

  // Инициализация при загрузке
  useEffect(() => {
    const today = getTodayDate();
    if (selectedDate === today) {
      setDateHabits(todayHabits);
      setDateStats(stats);
    }
  }, []);

  const handleCreateHabit = async (habitData) => {
    try {
      console.log('Creating new habit:', habitData);
      await createHabit(habitData);
      setShowCreateForm(false);
      
      // Перезагружаем привычки для текущей даты
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

  const handleSubscriptionContinue = async (plan) => {
    console.log('Selected subscription plan:', plan);
    
    try {
      // Активируем премиум через API
      const result = await habitService.activatePremium(plan);
      
      if (result.success) {
        console.log('Premium activated successfully');
        
        // Обновляем статус подписки
        await checkUserSubscription();
        
        // Закрываем модалку подписки
        setShowSubscriptionModal(false);
        
        // Если лимит был достигнут, теперь открываем форму создания
        if (userSubscription && !userSubscription.canCreateMore) {
          setShowCreateForm(true);
        }
        
        // Показываем уведомление
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert('Premium activated! Now you can create unlimited habits! 🎉');
        }
      }
    } catch (error) {
      console.error('Failed to activate premium:', error);
      
      setShowSubscriptionModal(false);
      
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert('Failed to activate premium. Please try again.');
      } else {
        alert('Failed to activate premium. Please try again.');
      }
    }
  };

  const getMotivationalMessage = () => {
    const currentStats = selectedDate === getTodayDate() ? stats : dateStats;
    const currentPhrase = selectedDate === getTodayDate() ? phrase : null;
    
    if (currentPhrase && currentPhrase.text) {
      return currentPhrase.text;
    }
    
    if (currentStats.total === 0) {
      return "Create your first habit!";
    }
    if (currentStats.completed === 0) {
      return "You can do it!";
    }
    if (currentStats.completed === currentStats.total) {
      return "All done! Amazing! 🎉";
    }
    
    const percentage = (currentStats.completed / currentStats.total) * 100;
    if (percentage >= 70) {
      return "Almost there! 🔥";
    }
    if (percentage >= 50) {
      return "Great progress! ✨";
    }
    
    return "Keep going! 💪";
  };

  const getMotivationalEmoji = () => {
    const currentPhrase = selectedDate === getTodayDate() ? phrase : null;
    
    if (currentPhrase && currentPhrase.emoji) {
      return currentPhrase.emoji;
    }
    
    const currentStats = selectedDate === getTodayDate() ? stats : dateStats;
    if (currentStats.total === 0) return "🚀";
    if (currentStats.completed === 0) return "💪";
    if (currentStats.completed === currentStats.total) return "🎉";
    return "✨";
  };

  const getDateLabel = () => {
    const todayStr = getTodayDate();
    const yesterdayStr = getYesterdayDate();
    
    if (selectedDate === todayStr) {
      return 'for today';
    }
    
    if (selectedDate === yesterdayStr) {
      return 'for yesterday';
    }
    
    const [year, month, day] = selectedDate.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = date.getDate();
    
    return `for ${weekday} ${dayNumber}`;
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

  // ВАЖНО: Обновленные обработчики с передачей даты
  const handleMark = async (habitId, status) => {
    if (!isEditableDate) {
      console.log('Cannot edit habits for this date');
      return;
    }
    
    console.log('Marking habit:', { habitId, status, date: selectedDate });
    
    try {
      // ВСЕГДА передаем дату
      await markHabit(habitId, status, selectedDate);
      
      // Перезагружаем данные для текущей даты
      const result = await loadHabitsForDate(selectedDate);
      if (result && result.habits) {
        setDateHabits(result.habits);
        setDateStats(result.stats || { completed: 0, total: result.habits.length });
      }
    } catch (error) {
      console.error('Error marking habit:', error);
    }
  };

  const handleUnmark = async (habitId) => {
    if (!isEditableDate) {
      console.log('Cannot edit habits for this date');
      return;
    }
    
    console.log('Unmarking habit:', { habitId, date: selectedDate });
    
    try {
      // ВСЕГДА передаем дату
      await unmarkHabit(habitId, selectedDate);
      
      // Перезагружаем данные для текущей даты
      const result = await loadHabitsForDate(selectedDate);
      if (result && result.habits) {
        setDateHabits(result.habits);
        setDateStats(result.stats || { completed: 0, total: result.habits.length });
      }
    } catch (error) {
      console.error('Error unmarking habit:', error);
    }
  };

  const getMotivationalBackgroundColor = () => {
    const currentPhrase = selectedDate === getTodayDate() ? phrase : null;
    
    if (currentPhrase && currentPhrase.backgroundColor) {
      return currentPhrase.backgroundColor;
    }
    
    const currentStats = selectedDate === getTodayDate() ? stats : dateStats;
    
    if (currentStats.total === 0) return '#FFE4B5';
    if (currentStats.completed === 0) return '#FFB3BA';
    if (currentStats.completed === currentStats.total) return '#87CEEB';
    
    const percentage = (currentStats.completed / currentStats.total) * 100;
    if (percentage >= 70) return '#B5E7A0';
    if (percentage >= 50) return '#A7D96C';
    
    return '#FFB3BA';
  };

  // Показываем загрузку
  if (loading) {
    return (
      <Layout>
        <div className="today-loading">
          <Loader size="large" />
        </div>
      </Layout>
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
              <h2 className="today__title">Completed</h2>
              <span className="today__count">
                {displayStats.completed} out of {displayStats.total} Habits
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
                📅 View only mode - you can mark habits only for today and yesterday
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
        onContinue={handleSubscriptionContinue}
      />
    </>
  );
};

export default Today;