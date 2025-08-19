import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import Header from "../components/layout/Header";
import HabitCard from "../components/habits/HabitCard";
import EmptyState from "../components/habits/EmptyState";
import CreateHabitForm from "../components/habits/CreateHabitForm";
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
  const [showProfile, setShowProfile] = useState(false);

  const handleCreateHabit = async (habitData) => {
  try {
    // Запоминаем количество привычек до создания
    const currentCount = todayHabits.length;
    
    await createHabit(habitData);
    setShowCreateForm(false);
    
    // Если это была первая привычка, сбрасываем флаг для показа подсказки
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

  const getDayLabel = () => {
    const today = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[today.getDay()];
  };
  // Показываем подсказку при первом открытии
  // Показываем подсказку при первом запуске или после создания первой привычки
useEffect(() => {
  const hasSeenHint = localStorage.getItem('hasSeenSwipeHint');
  const previousHabitsCount = parseInt(localStorage.getItem('previousHabitsCount') || '0');
  
  if (todayHabits.length > 0) {
    // Показываем если:
    // 1. Никогда не видели подсказку (первый запуск)
    // 2. Только что создали первую привычку (было 0, стало 1)
    if (!hasSeenHint || (previousHabitsCount === 0 && todayHabits.length === 1)) {
      setTimeout(() => {
        setShowSwipeHint(true);
        localStorage.setItem('hasSeenSwipeHint', 'true');
        console.log('Swipe hint shown');
      }, 1000);
    }
    
    // Сохраняем текущее количество привычек для следующей проверки
    localStorage.setItem('previousHabitsCount', String(todayHabits.length));
  }
}, [todayHabits.length]);
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
              <p className="today__subtitle">for today</p>
              <div className="today__motivation">
                {getMotivationalMessage()} {phrase.emoji}
              </div>
            </div>
          </div>

          <div className="today__days">
            <div className="today__day today__day--active">Today</div>
          </div>

          {todayHabits.length === 0 ? (
            <EmptyState onCreateClick={() => setShowCreateForm(true)} />
          ) : (
            <div className="today__habits">
              {todayHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onMark={markHabit}
                  onUnmark={unmarkHabit}
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