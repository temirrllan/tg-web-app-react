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
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isEditableDate, setIsEditableDate] = useState(true);
  const [dateHabits, setDateHabits] = useState([]);
  const [dateLoading, setDateLoading] = useState(false);

  // Обработчик выбора даты
  const handleDateSelect = async (date, isEditable) => {
    setSelectedDate(date);
    setIsEditableDate(isEditable);
    
    const today = new Date().toISOString().split('T')[0];
    
    if (date === today) {
      // Если выбран сегодня, используем уже загруженные данные
      setDateHabits(todayHabits);
    } else {
      // Загружаем привычки для выбранной даты
      setDateLoading(true);
      try {
        // Здесь нужно добавить метод в useHabits для загрузки привычек по дате
        // Пока используем моковые данные
        const habitsForDate = await loadHabitsForDate?.(date) || todayHabits.map(h => ({
          ...h,
          today_status: 'pending' // Сбрасываем статус для прошлых дней
        }));
        setDateHabits(habitsForDate);
      } catch (error) {
        console.error('Failed to load habits for date:', error);
        setDateHabits([]);
      } finally {
        setDateLoading(false);
      }
    }
  };

  // При изменении todayHabits обновляем dateHabits если выбран сегодня
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) {
      setDateHabits(todayHabits);
    }
  }, [todayHabits, selectedDate]);

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
    if (stats.total === 0) return "Yes U Can!";
    if (stats.completed === 0) return phrase.text || "Let's start!";
    if (stats.completed === stats.total)
      return phrase.text || "Perfect day! 🎉";
    return phrase.text || "Keep going!";
  };

  const getDateLabel = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (selectedDate === today) return 'for today';
    if (selectedDate === yesterdayStr) return 'for yesterday';
    
    const date = new Date(selectedDate);
    return `for ${date.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}`;
  };

  // Показываем подсказку при первом запуске или после создания первой привычки
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenSwipeHint');
    const previousHabitsCount = parseInt(localStorage.getItem('previousHabitsCount') || '0');
    
    if (todayHabits.length > 0 && isEditableDate) {
      if (!hasSeenHint || (previousHabitsCount === 0 && todayHabits.length === 1)) {
        setTimeout(() => {
          setShowSwipeHint(true);
          localStorage.setItem('hasSeenSwipeHint', 'true');
          console.log('Swipe hint shown');
        }, 1000);
      }
      
      localStorage.setItem('previousHabitsCount', String(todayHabits.length));
    }
  }, [todayHabits.length, isEditableDate]);

  // Обработчики свайпов с учетом редактируемости
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

  const displayHabits = dateLoading ? [] : dateHabits;

  return (
    <>
      <Layout>
        <Header user={user} onProfileClick={() => setShowProfile(true)} />

        <div className="today">
          <div className="today__stats">
            <div className="today__container">
              <h2 className="today__title">Completed</h2>
              <span className="today__count">
                {stats.completed} out of {stats.total} Habits
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