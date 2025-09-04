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
    deleteHabit, // Добавляем deleteHabit
    loadHabitsForDate,
    refresh
  } = useHabits();
  
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showHabitDetail, setShowHabitDetail] = useState(false);
  // Добавьте состояние для редактирования
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

  // Обновите handleEditHabit
const handleEditHabit = (habit) => {
  console.log('Edit habit:', habit);
  setHabitToEdit(habit);
  setShowEditForm(true);
  setShowHabitDetail(false);
};
// Добавьте обработчик успешного редактирования
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
    
    if (dateCache[date] && date !== todayStr) {
      console.log(`Using cached data for ${date}`);
      setDateHabits(dateCache[date].habits);
      setDateStats(dateCache[date].stats);
      return;
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
            stats: result.stats
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
      const currentCount = todayHabits.length;
      
      console.log('Creating new habit:', habitData);
      await createHabit(habitData);
      setShowCreateForm(false);
      
      setDateCache({});
      
      if (selectedDate !== getTodayDate()) {
        const result = await loadHabitsForDate(selectedDate);
        if (result) {
          setDateHabits(result.habits || []);
          setDateStats(result.stats || { completed: 0, total: 0 });
        }
      }
      
      if (currentCount === 0) {
        localStorage.removeItem('hasSeenSwipeHint');
        console.log('First habit created, hint will be shown');
      }
    } catch (error) {
      console.error("Failed to create habit:", error);
    }
  };

  const getMotivationalMessage = () => {
    const currentStats = selectedDate === getTodayDate() ? stats : dateStats;
    
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
      
      setDateCache(prev => {
        const newCache = { ...prev };
        delete newCache[selectedDate];
        return newCache;
      });
      
      const result = await loadHabitsForDate(selectedDate);
      if (result && result.habits) {
        setDateHabits(result.habits);
        setDateStats(result.stats || { completed: 0, total: result.habits.length });
        
        setDateCache(prev => ({
          ...prev,
          [selectedDate]: {
            habits: result.habits,
            stats: result.stats || { completed: 0, total: result.habits.length }
          }
        }));
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
      await unmarkHabit(habitId, selectedDate);
      
      setDateCache(prev => {
        const newCache = { ...prev };
        delete newCache[selectedDate];
        return newCache;
      });
      
      const result = await loadHabitsForDate(selectedDate);
      if (result && result.habits) {
        setDateHabits(result.habits);
        setDateStats(result.stats || { completed: 0, total: result.habits.length });
        
        setDateCache(prev => ({
          ...prev,
          [selectedDate]: {
            habits: result.habits,
            stats: result.stats || { completed: 0, total: result.habits.length }
          }
        }));
      }
    } catch (error) {
      console.error('Error unmarking habit:', error);
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
              <div className="today__motivation">
                {getMotivationalMessage()} {phrase.emoji}
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
                  key={`${habit.id}-${selectedDate}`}
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
        
        <button className="fab" onClick={() => setShowCreateForm(true)}>
          +
        </button>
      </Layout>

      {showCreateForm && (
        <CreateHabitForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateHabit}
        />
      )}

      {/* В конце компонента, после CreateHabitForm, добавьте: */}
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
    </>
  );
};

export default Today;