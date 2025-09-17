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
import "./Today.css";
import SwipeHint from '../components/habits/SwipeHint';
import EditHabitForm from '../components/habits/EditHabitForm';
import SubscriptionModal from '../components/modals/SubscriptionModal';

const Today = ({ user }) => {
    const { user: tgUser } = useTelegram(); // Telegram user

  // const { user } = useTelegram();
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
  const [dateCache, setDateCache] = useState({});

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
    
    // Перезагружаем привычки
    if (selectedDate === getTodayDate()) {
      await refresh();
    } else {
      const result = await loadHabitsForDate(selectedDate);
      if (result) {
        setDateHabits(result.habits || []);
        setDateStats(result.stats || { completed: 0, total: 0 });
      }
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      console.log('Deleting habit:', habitId);
      await deleteHabit(habitId);
      setShowHabitDetail(false);
      setSelectedHabit(null);
      
      // Перезагружаем привычки
      if (selectedDate === getTodayDate()) {
        await refresh();
      } else {
        const result = await loadHabitsForDate(selectedDate);
        if (result) {
          setDateHabits(result.habits || []);
          setDateStats(result.stats || { completed: 0, total: 0 });
        }
      }
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  // Обработчик выбора даты
  const handleDateSelect = async (date, isEditable) => {
    console.log('handleDateSelect:', date, 'isEditable:', isEditable);
    setSelectedDate(date);
    setIsEditableDate(isEditable);
    
    const todayStr = getTodayDate();
    
    // Очищаем кэш для выбранной даты, чтобы загрузить свежие данные
    if (dateCache[date]) {
      delete dateCache[date];
    }
    
    setDateLoading(true);
    try {
      if (date === todayStr) {
        await refresh();
        setDateHabits(todayHabits);
        setDateStats(stats);
      } else {
        const result = await loadHabitsForDate(date);
        if (result) {
          setDateHabits(result.habits || []);
          setDateStats(result.stats || { completed: 0, total: 0 });
          
          setDateCache(prev => ({
            ...prev,
            [date]: {
              habits: result.habits || [],
              stats: result.stats || { completed: 0, total: 0 }
            }
          }));
          
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

  // При изменении todayHabits обновляем dateHabits если выбран сегодня
  useEffect(() => {
    const today = getTodayDate();
    if (selectedDate === today) {
      setDateHabits(todayHabits);
      setDateStats(stats);
      
      setDateCache(prev => ({
        ...prev,
        [today]: {
          habits: todayHabits,
          stats: stats
        }
      }));
    }
  }, [todayHabits, stats, selectedDate]);

  // Инициализация при загрузке
  useEffect(() => {
    const today = getTodayDate();
    setDateHabits(todayHabits);
    setDateStats(stats);
    
    setDateCache({
      [today]: {
        habits: todayHabits,
        stats: stats
      }
    });
  }, []);

const handleCreateHabit = async (habitData) => {
  try {
    // Повторная проверка на случай, если пользователь обошел первую проверку
    const currentCount = todayHabits.length;
    const hasSubscription = user?.is_premium === true;
    
    if (currentCount >= 3 && !hasSubscription) {
      console.log('Blocking habit creation - no premium subscription');
      setShowCreateForm(false);
      setShowSubscriptionModal(true);
      return;
    }
    
    console.log('Creating new habit:', habitData);
    await createHabit(habitData);
    setShowCreateForm(false);
    
    setDateCache({});
    
    if (selectedDate !== getTodayDate()) {
      const result = await loadHabitsForDate(selectedDate);
      if (result) {
        setDateHabits(result.habits || []);
        setDateStats(result.stats || { completed: 0, total: result.habits.length });
      }
    }
    
    if (currentCount === 0) {
      localStorage.removeItem('hasSeenSwipeHint');
      console.log('First habit created, hint will be shown');
    }
  } catch (error) {
    console.error("Failed to create habit:", error);
    
    // Проверяем, если ошибка связана с лимитом
    if (error.response?.status === 403 && error.response?.data?.showPremium) {
      setShowCreateForm(false);
      setShowSubscriptionModal(true);
    }
  }
};
const handleSubscriptionContinue = async (plan) => {
  console.log('Selected subscription plan:', plan);
  
  try {
    // Здесь в будущем будет логика оплаты через Telegram Stars
    // Пока что просто логируем выбранный план
    console.log('Payment processing for plan:', plan);
    
    // TODO: Implement payment through Telegram Stars API
    // const paymentResult = await processTelegramStarsPayment(plan);
    
    // После успешной оплаты нужно будет обновить is_premium в БД через API
    // await api.post('/api/users/upgrade-subscription', { plan });
    
    // Временное решение: показываем уведомление
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(
        'Payment functionality will be available soon. Contact admin to upgrade your account.'
      );
    } else {
      alert('Payment functionality will be available soon. Contact admin to upgrade your account.');
    }
    
    // Закрываем модальное окно
    setShowSubscriptionModal(false);
    
    // НЕ открываем форму создания, так как оплата еще не прошла
    // setShowCreateForm(true);
    
  } catch (error) {
    console.error('Subscription error:', error);
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert('Failed to process subscription. Please try again.');
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

  const handleMark = async (habitId, status) => {
    if (!isEditableDate) {
      console.log('Cannot edit habits for this date');
      return;
    }
    
    console.log('Marking habit:', { habitId, status, date: selectedDate });
    
    try {
      await markHabit(habitId, status, selectedDate);
      
      // Обновляем только статус конкретной привычки без полной перезагрузки
      setDateHabits(prevHabits => 
        prevHabits.map(h => 
          h.id === habitId 
            ? { ...h, today_status: status }
            : h
        )
      );
      
      // Обновляем статистику
      setDateStats(prev => {
        let newStats = { ...prev };
        const habit = dateHabits.find(h => h.id === habitId);
        const oldStatus = habit?.today_status || 'pending';
        
        // Корректируем счетчики
        if (oldStatus === 'completed' && status !== 'completed') {
          newStats.completed = Math.max(0, newStats.completed - 1);
        } else if (oldStatus !== 'completed' && status === 'completed') {
          newStats.completed = newStats.completed + 1;
        }
        
        return newStats;
      });
      
    } catch (error) {
      console.error('Error marking habit:', error);
      // В случае ошибки перезагружаем данные
      const result = await loadHabitsForDate(selectedDate);
      if (result && result.habits) {
        setDateHabits(result.habits);
        setDateStats(result.stats || { completed: 0, total: result.habits.length });
      }
    }
  };
const getMotivationalBackgroundColor = () => {
  const currentPhrase = selectedDate === getTodayDate() ? phrase : null;
  
  if (currentPhrase && currentPhrase.backgroundColor) {
    return currentPhrase.backgroundColor;
  }
  
  // Запасные цвета в зависимости от прогресса
  const currentStats = selectedDate === getTodayDate() ? stats : dateStats;
  
  if (currentStats.total === 0) return '#FFE4B5';
  if (currentStats.completed === 0) return '#FFB3BA';
  if (currentStats.completed === currentStats.total) return '#87CEEB';
  
  const percentage = (currentStats.completed / currentStats.total) * 100;
  if (percentage >= 70) return '#B5E7A0';
  if (percentage >= 50) return '#A7D96C';
  
  return '#FFB3BA';
};
  const handleUnmark = async (habitId) => {
    if (!isEditableDate) {
      console.log('Cannot edit habits for this date');
      return;
    }
    
    console.log('Unmarking habit:', { habitId, date: selectedDate });
    
    try {
      await unmarkHabit(habitId, selectedDate);
      
      // Обновляем только статус конкретной привычки
      setDateHabits(prevHabits => 
        prevHabits.map(h => 
          h.id === habitId 
            ? { ...h, today_status: 'pending' }
            : h
        )
      );
      
      // Обновляем статистику
      setDateStats(prev => {
        const habit = dateHabits.find(h => h.id === habitId);
        const oldStatus = habit?.today_status || 'pending';
        
        if (oldStatus === 'completed') {
          return { ...prev, completed: Math.max(0, prev.completed - 1) };
        }
        return prev;
      });
      
    } catch (error) {
      console.error('Error unmarking habit:', error);
      // В случае ошибки перезагружаем данные
      const result = await loadHabitsForDate(selectedDate);
      if (result && result.habits) {
        setDateHabits(result.habits);
        setDateStats(result.stats || { completed: 0, total: result.habits.length });
      }
    }
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
            <EmptyState onCreateClick={() => setShowCreateForm(true)} />
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
        
        <button className="fab" onClick={() => {
  // Проверяем количество активных привычек
  const allHabits = dateHabits.filter(h => h.is_active !== false);
  const currentCount = allHabits.length;
  
  console.log('=== Premium Check Debug ===');
  console.log('Current habits count:', currentCount);
  console.log('User object:', user);
  console.log('User is_premium:', user?.is_premium);
  console.log('Type of is_premium:', typeof user?.is_premium);
  
  // Проверяем подписку из данных пользователя
  const hasSubscription = user?.is_premium === true || user?.is_premium === 1;
  console.log('Has subscription result:', hasSubscription);
  
  // Если 3 или больше привычек и нет подписки - показываем SubscriptionModal
  if (currentCount >= 3 && !hasSubscription) {
    console.log('Showing subscription modal - user has no premium');
    setShowSubscriptionModal(true);
  } else {
    console.log('Opening create form - user has premium or less than 3 habits');
    setShowCreateForm(true);
  }
}}>
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