import React, { useEffect, useState, useMemo } from "react";
import Layout from "../components/layout/Layout";
import Header from "../components/layout/Header";
import HabitGroup from "../components/habits/HabitGroup";
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
  } = useHabits();
  
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isEditableDate, setIsEditableDate] = useState(true);

  // Группируем привычки по времени дня на основе reminder_time
  const groupedHabits = useMemo(() => {
    const groups = {
      morning: [],
      afternoon: [],
      evening: []
    };
    
    todayHabits.forEach(habit => {
      if (habit.reminder_time) {
        const hour = parseInt(habit.reminder_time.split(':')[0]);
        if (hour < 12) {
          groups.morning.push(habit);
        } else if (hour < 18) {
          groups.afternoon.push(habit);
        } else {
          groups.evening.push(habit);
        }
      } else {
        // Если время не указано, добавляем в утро
        groups.morning.push(habit);
      }
    });
    
    return groups;
  }, [todayHabits]);

  const handleDateSelect = (date, isEditable) => {
    setSelectedDate(date);
    setIsEditableDate(isEditable);
    // Здесь можно добавить загрузку привычек для выбранной даты
  };

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
    if (selectedDate === today) return 'for today';
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDate === yesterday.toISOString().split('T')[0]) return 'for yesterday';
    
    const date = new Date(selectedDate);
    return `for ${date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
  };

  // Показываем подсказку при первом запуске
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenSwipeHint');
    const previousHabitsCount = parseInt(localStorage.getItem('previousHabitsCount') || '0');
    
    if (todayHabits.length > 0 && isEditableDate) {
      if (!hasSeenHint || (previousHabitsCount === 0 && todayHabits.length === 1)) {
        setTimeout(() => {
          setShowSwipeHint(true);
          localStorage.setItem('hasSeenSwipeHint', 'true');
        }, 1000);
      }
      
      localStorage.setItem('previousHabitsCount', String(todayHabits.length));
    }
  }, [todayHabits.length, isEditableDate]);

  if (loading) {
    return (
      <Layout>
        <div className="today-loading">
          <Loader size="large" />
        </div>
      </Layout>
    );
  }

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
              <span>📅 View only - you can edit only today and yesterday</span>
            </div>
          )}

          {todayHabits.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="today__habits">
              <HabitGroup 
                title="Morning"
                habits={groupedHabits.morning}
                onMark={isEditableDate ? markHabit : undefined}
                onUnmark={isEditableDate ? unmarkHabit : undefined}
                readOnly={!isEditableDate}
              />
              <HabitGroup 
                title="Afternoon"
                habits={groupedHabits.afternoon}
                onMark={isEditableDate ? markHabit : undefined}
                onUnmark={isEditableDate ? unmarkHabit : undefined}
                readOnly={!isEditableDate}
              />
              <HabitGroup 
                title="Evening"
                habits={groupedHabits.evening}
                onMark={isEditableDate ? markHabit : undefined}
                onUnmark={isEditableDate ? unmarkHabit : undefined}
                readOnly={!isEditableDate}
              />
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