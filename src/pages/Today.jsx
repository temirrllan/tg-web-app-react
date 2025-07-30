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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-100">
        <div className="pb-24">
          <Header 
            user={user} 
            onProfileClick={() => setShowProfile(true)} 
          />

          <div className="px-4">
            {/* Статистика */}
            <div className="text-center mb-5">
              <h1 className="text-[28px] font-bold text-black leading-tight">
                Completed <span className="text-[28px]">{stats.completed} out of {stats.total}</span> Habits
              </h1>
              <p className="text-gray-400 text-[15px] mt-1 font-normal">for today</p>
            </div>

            {/* Мотивационная фраза */}
            <div className="bg-white rounded-[20px] px-5 py-[18px] text-center mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="text-[19px] font-semibold text-black">
                {phrase.text || "Yes U Can!"} {phrase.emoji || ""}
              </p>
            </div>

            {/* Переключатель дней */}
            <div className="flex justify-center gap-3 mb-6">
              <button className="bg-[#66D964] text-white px-6 py-[14px] rounded-full font-semibold text-[16px]">
                Today
              </button>
              <button className="text-gray-400 px-5 py-[14px] font-medium text-[16px]">
                Sat 19
              </button>
              <button className="text-gray-400 px-5 py-[14px] font-medium text-[16px]">
                Sun 20
              </button>
              <button className="text-gray-400 px-5 py-[14px] font-medium text-[16px]">
                Mon 21
              </button>
            </div>

            {/* Привычки */}
            {todayHabits.length === 0 ? (
              <EmptyState onCreateClick={() => setShowCreateForm(true)} />
            ) : (
              <div className="space-y-7">
                {/* Morning */}
                {groupedHabits.morning.length > 0 && (
                  <div>
                    <h2 className="text-[18px] font-bold text-black mb-4">Morning</h2>
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
                    <h2 className="text-[18px] font-bold text-black mb-4">Afternoon</h2>
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
                    <h2 className="text-[18px] font-bold text-black mb-4">Evening</h2>
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
          className="fixed bottom-6 right-6 w-[60px] h-[60px] bg-[#66D964] rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(102,217,100,0.4)]"
          onClick={() => setShowCreateForm(true)}
        >
          <span className="text-white text-[32px] font-light leading-none mb-1">+</span>
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