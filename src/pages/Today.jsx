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
      await createHabit(habitData);
      setShowCreateForm(false);
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
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenSwipeHint');
    if (!hasSeenHint && todayHabits.length > 0) {
      setTimeout(() => {
        setShowSwipeHint(true);
        localStorage.setItem('hasSeenSwipeHint', 'true');
        console.log('Swipe hint shown');
      }, 1000);
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
// Показываем подсказку при первом открытии или после создания первой привычки
useEffect(() => {
  const hasSeenHint = localStorage.getItem('hasSeenSwipeHint');
  const hintsShownCount = parseInt(localStorage.getItem('hintsShownCount') || '0');
  
  // Показываем подсказку если:
  // 1. Никогда не видели И есть привычки
  // 2. Только что создали первую привычку
  // 3. Показали меньше 3 раз (для новых пользователей)
  if (todayHabits.length > 0) {
    if (!hasSeenHint || (todayHabits.length === 1 && hintsShownCount < 2)) {
      setTimeout(() => {
        setShowSwipeHint(true);
        localStorage.setItem('hasSeenSwipeHint', 'true');
        localStorage.setItem('hintsShownCount', String(hintsShownCount + 1));
        console.log('Swipe hint shown, count:', hintsShownCount + 1);
      }, 1000);
    }
  }
}, [todayHabits.length]);
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
        {/* Help Button */}
{todayHabits.length > 0 && (
  <button 
    className="help-button" 
    onClick={() => setShowSwipeHint(true)}
    aria-label="Show help"
  >
    ?
  </button>
)}
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