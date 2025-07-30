import React, { useState } from 'react';
import Header from '../components/layout/Header';
import HabitCard from '../components/habits/HabitCard';
import EmptyState from '../components/habits/EmptyState';
import CreateHabitForm from '../components/habits/CreateHabitForm';
import Profile from './Profile';
import Loader from '../components/common/Loader';
import { useHabits } from '../hooks/useHabits';
import { useTelegram } from '../hooks/useTelegram';

const Today = () => {
  const { user } = useTelegram();
  const { 
    todayHabits, 
    stats, 
    phrase, 
    loading, 
    markHabit, 
    unmarkHabit, 
    createHabit 
  } = useHabits();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleCreateHabit = async (habitData) => {
    try {
      await createHabit(habitData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  // Группируем привычки по времени дня
  const groupedHabits = {
    morning: [],
    afternoon: [],
    evening: []
  };

  todayHabits.forEach(habit => {
    if (habit.reminder_time) {
      const hour = parseInt(habit.reminder_time.split(':')[0]);
      if (hour < 12) {
        groupedHabits.morning.push(habit);
      } else if (hour < 18) {
        groupedHabits.afternoon.push(habit);
      } else {
        groupedHabits.evening.push(habit);
      }
    } else {
      groupedHabits.morning.push(habit);
    }
  });

  return (
    <>
      <div className="min-h-screen bg-[#f5f5f5]">
        <div className="pb-20">
          <Header 
            user={user} 
            onProfileClick={() => setShowProfile(true)} 
          />

          <div className="px-4">
            {/* Статистика */}
            <div className="text-center mb-5">
              <h1 className="text-2xl font-bold text-black">
                Completed{' '}
                <span className="text-2xl font-bold">
                  {stats.completed} out of {stats.total}
                </span>{' '}
                Habits
              </h1>
              <p className="text-gray-400 text-base mt-1">for today</p>
            </div>

            {/* Мотивационная фраза */}
            <div className="bg-white rounded-2xl p-5 text-center mb-5 shadow-sm">
              <p className="text-xl font-semibold text-black">
                {phrase.text || "Yes U Can!"} {phrase.emoji || "✨"}
              </p>
            </div>

            {/* Переключатель дней */}
            <div className="flex justify-center mb-6">
              <button className="bg-[#4CAF50] text-white px-6 py-3 rounded-full font-semibold">
                Today
              </button>
            </div>

            {/* Привычки или Empty State */}
            {todayHabits.length === 0 ? (
              <EmptyState onCreateClick={() => setShowCreateForm(true)} />
            ) : (
              <div className="space-y-6">
                {/* Morning */}
                {groupedHabits.morning.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-black mb-3">Morning</h2>
                    <div className="space-y-3">
                      {groupedHabits.morning.map(habit => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          onMark={markHabit}
                          onUnmark={unmarkHabit}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Afternoon */}
                {groupedHabits.afternoon.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-black mb-3">Afternoon</h2>
                    <div className="space-y-3">
                      {groupedHabits.afternoon.map(habit => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          onMark={markHabit}
                          onUnmark={unmarkHabit}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Evening */}
                {groupedHabits.evening.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-black mb-3">Evening</h2>
                    <div className="space-y-3">
                      {groupedHabits.evening.map(habit => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          onMark={markHabit}
                          onUnmark={unmarkHabit}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FAB */}
        <button 
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#4CAF50] rounded-full flex items-center justify-center shadow-lg"
          onClick={() => setShowCreateForm(true)}
        >
          <span className="text-white text-3xl font-light">+</span>
        </button>
      </div>

      {/* Модальные окна */}
      {showCreateForm && (
        <CreateHabitForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateHabit}
        />
      )}

      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}
    </>
  );
};

export default Today;