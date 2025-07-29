import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import HabitCard from '../components/habits/HabitCard';
import EmptyState from '../components/habits/EmptyState';
import CreateHabitForm from '../components/habits/CreateHabitForm';
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
  console.log('Submitting new habit:', habitData);
  
  try {
    const result = await createHabit(habitData);
    console.log('Habit created successfully:', result);
    setShowCreateForm(false);
  } catch (error) {
    console.error('Failed to create habit:', error);
    
    // Показываем пользователю конкретную ошибку
    const errorMessage = error.response?.data?.error || error.message || 'Failed to create habit';
    
    if (error.response?.data?.showPremium) {
      alert('You have reached the limit of 3 habits for free users. Please upgrade to Premium.');
    } else {
      alert(`Error: ${errorMessage}`);
    }
  }
};

  const getMotivationalMessage = () => {
    if (stats.total === 0) return "Yes U Can!";
    if (stats.completed === 0) return phrase.text || "Let's start!";
    if (stats.completed === stats.total) return phrase.text || "Perfect day! 🎉";
    return phrase.text || "Keep going!";
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout>
        <Header 
          user={user} 
          onProfileClick={() => setShowProfile(true)} 
        />

        <div className="px-4 pb-20">
          {/* Статистика */}
          <div className="mt-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Completed{' '}
              <span className="text-green-600">
                {stats.completed} out of {stats.total}
              </span>{' '}
              Habits
            </h2>
            <p className="text-sm text-gray-400 mt-1">for today</p>
          </div>

          {/* Мотивация */}
          <div className="mb-6">
            <div className="inline-block px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-gray-700 font-medium">
              {getMotivationalMessage()} {phrase.emoji}
            </div>
          </div>

          {/* Дни недели */}
          <div className="flex space-x-2 overflow-x-auto mb-6 pb-1">
            {/* Предыдущие дни, если нужны */}
            {/* <div className="px-3 py-1 bg-gray-100 rounded-lg text-gray-500">Thu 17</div> */}
            <div className="px-4 py-2 bg-green-200 text-green-800 rounded-lg font-medium flex-shrink-0">
              Today
            </div>
            <div className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg flex-shrink-0">
              Sat 19
            </div>
            <div className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg flex-shrink-0">
              Sun 20
            </div>
            {/* ... */}
          </div>

          {/* Список привычек или пустое состояние */}
          {todayHabits.length === 0 ? (
            <EmptyState onCreateClick={() => setShowCreateForm(true)} />
          ) : (
            <div className="space-y-4">
              {todayHabits.map(habit => (
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

        {/* Плавающая кнопка «+» */}
        <button
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white text-3xl rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition"
          onClick={() => setShowCreateForm(true)}
        >
          +
        </button>
      </Layout>

      {/* Модалка создания привычки */}
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
