import { useState, useEffect, useCallback } from 'react';
import { habitService } from '../services/habits';
import { vibrate } from '../utils/helpers';

export const useHabits = () => {
  const [habits, setHabits] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [phrase, setPhrase] = useState({ text: '', emoji: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Временные моковые данные для демонстрации
  const mockHabits = [
    {
      id: 1,
      title: 'Run',
      goal: '20 min',
      icon: '🏃',
      reminder_time: '08:00',
      today_status: 'pending',
      category_icon: '🏃'
    },
    {
      id: 2,
      title: 'Drink Water',
      goal: '2.00 L',
      icon: '💧',
      reminder_time: '09:00',
      today_status: 'completed',
      category_icon: '💧'
    },
    {
      id: 3,
      title: 'Read Book',
      goal: '15 min',
      icon: '📖',
      reminder_time: '14:00',
      today_status: 'pending',
      category_icon: '📖'
    },
    {
      id: 4,
      title: 'Yoga',
      goal: '30 min',
      icon: '🧘',
      reminder_time: '20:00',
      today_status: 'pending',
      category_icon: '🧘'
    }
  ];

  // Загрузка привычек на сегодня
  const loadTodayHabits = useCallback(async () => {
    try {
      setLoading(true);
      
      // Временно используем моковые данные
      setTodayHabits(mockHabits);
      setStats({ completed: 1, total: 4 });
      setPhrase({ text: 'Yes U Can!', emoji: '💪' });
      
      // Раскомментировать для реального API
      // const data = await habitService.getTodayHabits();
      // setTodayHabits(data.habits || []);
      // setStats(data.stats || { completed: 0, total: 0 });
      // setPhrase(data.phrase || { text: '', emoji: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка всех привычек
  const loadAllHabits = useCallback(async () => {
    try {
      // Временно используем моковые данные
      setHabits(mockHabits);
      
      // Раскомментировать для реального API
      // const data = await habitService.getAllHabits();
      // setHabits(data.habits || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Отметка привычки
  const markHabit = useCallback(async (habitId, status = 'completed') => {
    try {
      vibrate();
      
      // Обновляем локальное состояние для демонстрации
      setTodayHabits(prev => prev.map(habit => 
        habit.id === habitId 
          ? { ...habit, today_status: status }
          : habit
      ));
      
      // Обновляем статистику
      setStats(prev => ({
        ...prev,
        completed: prev.completed + 1
      }));
      
      // Раскомментировать для реального API
      // await habitService.markHabit(habitId, status);
      // await loadTodayHabits();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Отмена отметки
  const unmarkHabit = useCallback(async (habitId) => {
    try {
      vibrate();
      
      // Обновляем локальное состояние для демонстрации
      setTodayHabits(prev => prev.map(habit => 
        habit.id === habitId 
          ? { ...habit, today_status: 'pending' }
          : habit
      ));
      
      // Обновляем статистику
      setStats(prev => ({
        ...prev,
        completed: Math.max(0, prev.completed - 1)
      }));
      
      // Раскомментировать для реального API
      // await habitService.unmarkHabit(habitId);
      // await loadTodayHabits();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Создание привычки
  const createHabit = useCallback(async (habitData) => {
    try {
      // Временно добавляем в локальное состояние
      const newHabit = {
        id: Date.now(),
        ...habitData,
        today_status: 'pending'
      };
      setTodayHabits(prev => [...prev, newHabit]);
      setStats(prev => ({ ...prev, total: prev.total + 1 }));
      
      // Раскомментировать для реального API
      // const result = await habitService.createHabit(habitData);
      // await loadAllHabits();
      // await loadTodayHabits();
      // return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Удаление привычки
  const deleteHabit = useCallback(async (habitId) => {
    try {
      // Временно удаляем из локального состояния
      setTodayHabits(prev => prev.filter(habit => habit.id !== habitId));
      setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      
      // Раскомментировать для реального API
      // await habitService.deleteHabit(habitId);
      // await loadAllHabits();
      // await loadTodayHabits();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadTodayHabits();
    loadAllHabits();
  }, [loadTodayHabits, loadAllHabits]);

  return {
    habits,
    todayHabits,
    stats,
    phrase,
    loading,
    error,
    markHabit,
    unmarkHabit,
    createHabit,
    deleteHabit,
    refresh: loadTodayHabits
  };
};