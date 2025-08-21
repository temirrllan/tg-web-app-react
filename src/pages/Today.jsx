import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import Header from "../components/layout/Header";
import HabitCard from "../components/habits/HabitCard";
import EmptyState from "../components/habits/EmptyState";
import CreateHabitForm from "../components/habits/CreateHabitForm";
import WeekNavigation from "../components/habits/WeekNavigation";
import Loader from "../components/common/Loader";
import { useHabits } from "../hooks/useHabits";
import { useTelegram } from "../hooks/useTelegram";
import "./Today.css";
import SwipeHint from '../components/habits/SwipeHint';

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
    loadHabitsForDate,
  } = useHabits();
  
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Всегда инициализируем с сегодняшней датой
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }; 
   // Функция для получения вчерашней даты
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
// Фильтруем привычки по выбранному дню недели
  const getHabitsForDate = useMemo(() => {
    const date = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = date.getDay() || 7; // 0 (Sunday) = 7
    
    return (habits) => {
      return habits.filter(habit => {
        // Если у привычки нет расписания по дням, показываем всегда
        if (!habit.schedule_days || habit.schedule_days.length === 0) {
          return true;
        }
        // Проверяем, входит ли текущий день в расписание привычки
        return habit.schedule_days.includes(dayOfWeek);
      });
    };
  }, [selectedDate]);

  // Обработчик выбора даты
  const handleDateSelect = async (date, isEditable) => {
    console.log('handleDateSelect:', date, 'isEditable:', isEditable);
    setSelectedDate(date);
    setIsEditableDate(isEditable);
    
    const todayStr = getTodayDate();
    
    if (date === todayStr) {
      const filteredHabits = getHabitsForDate(todayHabits);
      setDateHabits(filteredHabits);
      
      const completedCount = filteredHabits.filter(h => h.today_status === 'completed').length;
      setDateStats({ 
        completed: completedCount, 
        total: filteredHabits.length 
      });
    } else {
      setDateLoading(true);
      try {
        const result = await loadHabitsForDate?.(date);
        if (result) {
          const filteredHabits = getHabitsForDate(result.habits || []);
          setDateHabits(filteredHabits);
          
          const completedCount = filteredHabits.filter(h => h.today_status === 'completed').length;
          setDateStats({ 
            completed: completedCount, 
            total: filteredHabits.length 
          });
        } else {
          const filteredHabits = getHabitsForDate(todayHabits.map(h => ({
            ...h,
            today_status: 'pending'
          })));
          setDateHabits(filteredHabits);
          setDateStats({ completed: 0, total: filteredHabits.length });
        }
      } catch (error) {
        console.error('Failed to load habits for date:', error);
        setDateHabits([]);
        setDateStats({ completed: 0, total: 0 });
      } finally {
        setDateLoading(false);
      }
    }
  };

  // При изменении todayHabits обновляем dateHabits если выбран сегодня
  useEffect(() => {
    const today = getTodayDate();
    if (selectedDate === today) {
      const filteredHabits = getHabitsForDate(todayHabits);
      setDateHabits(filteredHabits);
      
      const completedCount = filteredHabits.filter(h => h.today_status === 'completed').length;
      setDateStats({ 
        completed: completedCount, 
        total: filteredHabits.length 
      });
    }
  }, [todayHabits, selectedDate, getHabitsForDate]);

  // Инициализация при загрузке
  useEffect(() => {
    const filteredHabits = getHabitsForDate(todayHabits);
    setDateHabits(filteredHabits);
    
    const completedCount = filteredHabits.filter(h => h.today_status === 'completed').length;
    setDateStats({ 
      completed: completedCount, 
      total: filteredHabits.length 
    });
  }, []);

  const handleCreateHabit = async (habitData) => {
    try {
      const currentCount = todayHabits.length;
      
      await createHabit(habitData);
      setShowCreateForm(false);
      
      if (currentCount === 0) {
        localStorage.removeItem('hasSeenSwipeHint');
        console.log('First habit created, hint will be shown');
      }
    } catch (error) {
      console.error("Failed to create habit:", error);
    }
  };

  const getMotivationalMessage = () => {
    const currentStats = selectedDate === getTodayDate() ? dateStats : dateStats;
    
    if (currentStats.total === 0) return "Yes U Can!";
    if (currentStats.completed === 0) return phrase.text || "Let's start!";
    if (currentStats.completed === currentStats.total)
      return phrase.text || "Perfect day! 🎉";
    return phrase.text || "Keep going!";
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
    
    return `for ${date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    })}`;
  };

  // Показываем подсказку при первом запуске или после создания первой привычки
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenSwipeHint');
    const previousHabitsCount = parseInt(localStorage.getItem('previousHabitsCount') || '0');
    
    if (dateHabits.length > 0 && isEditableDate) {
      if (!hasSeenHint || (previousHabitsCount === 0 && dateHabits.length === 1)) {
        setTimeout(() => {
          setShowSwipeHint(true);
          localStorage.setItem('hasSeenSwipeHint', 'true');
          console.log('Swipe hint shown');
        }, 1000);
      }
      
      localStorage.setItem('previousHabitsCount', String(dateHabits.length));
    }
  }, [dateHabits.length, isEditableDate]);

  // Обработчики свайпов с учетом даты
  const handleMark = async (habitId, status) => {
    if (!isEditableDate) {
      console.log('Cannot edit habits for this date');
      return;
    }
    await markHabit(habitId, status, selectedDate);
  };

  const handleUnmark = async (habitId) => {
    if (!isEditableDate) {
      console.log('Cannot edit habits for this date');
      return;
    }
    await unmarkHabit(habitId, selectedDate);
  };

  if (loading) {
    return (
      <Layout>
        <div className="today-loading">
          <Loader size="large" />
        </div>
      </Layout>
    );
  }
if (showProfile) {
    return <Profile onClose={() => setShowProfile(false)} />;
  }
  const displayHabits = dateLoading ? [] : dateHabits;
  const displayStats = dateStats;

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
              <div className="today__motivation">
                {getMotivationalMessage()} {phrase.emoji}
              </div>
            </div>
          </div>

          <WeekNavigation 
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />

          {!isEditableDate && (
            <div className="today__readonly-notice">
              <span>📅 View only mode - you can edit only today and yesterday</span>
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
                  key={habit.id}
                  habit={habit}
                  onMark={isEditableDate ? handleMark : undefined}
                  onUnmark={isEditableDate ? handleUnmark : undefined}
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
        
        {/* FAB Button */}
        <button className="fab" onClick={() => setShowCreateForm(true)}>
          +
        </button>
      </Layout>

      {/* Modals */}
      {showCreateForm && (
        <CreateHabitForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateHabit}
        />
      )}
    </>
  );
};

export default Today;